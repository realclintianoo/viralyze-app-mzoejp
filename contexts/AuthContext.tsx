
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync local data to remote when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        await syncLocalDataToRemote(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncLocalDataToRemote = async (userId: string) => {
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
  };

  const upsertProfile = async (userId: string, profile: OnboardingData) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
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
