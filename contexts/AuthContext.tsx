
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

  const loadRemoteDataToLocal = useCallback(async (userId: string) => {
    try {
      console.log('Loading remote data to local for user:', userId);
      
      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        const onboardingData: OnboardingData = {
          platforms: profileData.platforms || [],
          niche: profileData.niche || '',
          followers: profileData.followers || 0,
          goal: profileData.goal || '',
        };
        await storage.saveOnboardingData(onboardingData);
      }

      // Load saved items
      const { data: savedItemsData } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedItemsData && savedItemsData.length > 0) {
        const localSavedItems: SavedItem[] = savedItemsData.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          payload: item.payload,
          created_at: item.created_at,
        }));
        
        // Merge with local items (avoid duplicates)
        const existingLocalItems = await storage.getSavedItems();
        const mergedItems = [...localSavedItems];
        
        existingLocalItems.forEach(localItem => {
          if (!mergedItems.find(item => item.id === localItem.id)) {
            mergedItems.push(localItem);
          }
        });
        
        await storage.setSavedItems(mergedItems);
      }

      console.log('Remote data loading completed');
    } catch (error) {
      console.error('Error loading remote data:', error);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Load remote data when user is already authenticated
      if (session?.user) {
        loadRemoteDataToLocal(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in successfully');
        // First sync local data to remote, then load any additional remote data
        await syncLocalDataToRemote(session.user.id);
        await loadRemoteDataToLocal(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Clear local data on sign out to ensure clean state
        console.log('User signed out - clearing local data');
        try {
          await storage.clearAll();
        } catch (clearError) {
          console.error('Error clearing local data on auth state change:', clearError);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed for user:', session?.user?.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncLocalDataToRemote, loadRemoteDataToLocal]);

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
      id: item.id,
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
      throw error;
    }
    
    // Clear local data on sign out to ensure clean state
    try {
      await storage.clearAll();
      console.log('Local data cleared on sign out');
    } catch (clearError) {
      console.error('Error clearing local data on sign out:', clearError);
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
