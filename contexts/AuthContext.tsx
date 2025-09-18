
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storage } from '../utils/storage';
import { OnboardingData, SavedItem } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  isGuest: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔐 AuthProvider initialized');
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncLocalDataToRemote = useCallback(async (userId: string) => {
    try {
      console.log('Syncing local data to remote for user:', userId);
      
      // Sync profile data
      const localProfile = await storage.getOnboardingData();
      if (localProfile) {
        await upsertProfile(userId, localProfile);
      }

      // Sync saved items
      const localSavedItems = await storage.getSavedItems();
      if (localSavedItems.length > 0) {
        await syncSavedItems(userId, localSavedItems);
      }

      console.log('Local data sync completed');
    } catch (error) {
      console.error('Error syncing local data:', error);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Update state immediately
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in successfully, syncing data...');
        await syncLocalDataToRemote(session.user.id);
      }

      // Clear local data when user signs out - this is crucial for proper logout
      if (event === 'SIGNED_OUT') {
        console.log('Auth state changed to SIGNED_OUT, clearing all local data');
        try {
          await storage.clearAll();
          console.log('All local data cleared after sign out');
        } catch (error) {
          console.error('Error clearing data on sign out:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [syncLocalDataToRemote]);

  const upsertProfile = async (userId: string, profile: OnboardingData) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId,
        platforms: profile.platforms,
        niche: profile.niche,
        followers: profile.followers,
        goal: profile.goal,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error upserting profile:', error);
    }
  };

  const syncSavedItems = async (userId: string, items: SavedItem[]) => {
    const itemsToSync = items.map(item => ({
      user_id: userId,
      type: item.type,
      title: item.title,
      payload: item.payload,
      created_at: item.created_at,
    }));

    const { error } = await supabase
      .from('saved_items')
      .upsert(itemsToSync);

    if (error) {
      console.error('Error syncing saved items:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://natively.dev/email-confirmed'
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting complete logout process...');
      
      // Step 1: Clear session state FIRST to trigger UI updates immediately
      console.log('🚪 Clearing session state...');
      setSession(null);
      setUser(null);
      console.log('✅ Session state cleared');
      
      // Step 2: Clear all local storage data
      console.log('🚪 Clearing all local storage data...');
      await storage.clearAll();
      console.log('✅ All local storage cleared successfully');
      
      // Step 3: Sign out from Supabase (this will trigger the auth state change)
      console.log('🚪 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out from Supabase:', error);
        // Don't throw here - we've already cleared local state
        console.log('⚠️ Supabase sign out failed, but local state is cleared');
      } else {
        console.log('✅ Successfully signed out from Supabase');
      }
      
      console.log('🎉 Complete logout process finished successfully');
      
    } catch (error) {
      console.error('❌ Error during logout process:', error);
      // Ensure local state is cleared even on error
      setSession(null);
      setUser(null);
      await storage.clearAll().catch(e => console.error('Error clearing storage:', e));
      // Don't re-throw - we want sign out to always succeed from UI perspective
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isGuest: !user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
