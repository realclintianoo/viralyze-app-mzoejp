
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { OnboardingData } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { 
  getPersonalizationTheme, 
  getFollowerTier, 
  getPersonalizedWelcomeMessage,
  getPersonalizedRecommendations,
  getPersonalizedChatContext,
  PersonalizationTheme,
  FollowerTier
} from '../utils/personalization';

interface PersonalizationContextType {
  profile: OnboardingData | null;
  theme: PersonalizationTheme;
  followerTier: FollowerTier;
  welcomeMessage: string;
  recommendations: string[];
  chatContext: string;
  isPersonalized: boolean;
  updateProfile: (profile: OnboardingData) => Promise<void>;
  clearPersonalization: () => Promise<void>;
  refreshPersonalization: () => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType>({
  profile: null,
  theme: { primary: '#22C55E', secondary: '#06B6D4', glow: 'rgba(6, 182, 212, 0.6)', gradient: ['#22C55E', '#06B6D4'], emoji: '🚀' },
  followerTier: { id: 'starter', label: 'Starter', min: 0, max: 1000, badge: '🌱', color: '#22C55E' },
  welcomeMessage: 'Welcome back 👋',
  recommendations: [],
  chatContext: '',
  isPersonalized: false,
  updateProfile: async () => {},
  clearPersonalization: async () => {},
  refreshPersonalization: async () => {},
});

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🎨 PersonalizationProvider initialized');
  
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [theme, setTheme] = useState(getPersonalizationTheme());
  const [followerTier, setFollowerTier] = useState(getFollowerTier(0));
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome back 👋');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [chatContext, setChatContext] = useState('');

  // Get auth context to listen for sign out events
  const { user, session } = useAuth();

  const updatePersonalization = useCallback((newProfile: OnboardingData | null, username?: string) => {
    console.log('🎨 Updating personalization with profile:', newProfile);
    
    setProfile(newProfile);
    
    if (newProfile) {
      const newTheme = getPersonalizationTheme(newProfile.niche);
      const newTier = getFollowerTier(newProfile.followers);
      const newWelcome = getPersonalizedWelcomeMessage(newProfile, username);
      const newRecommendations = getPersonalizedRecommendations(newProfile);
      const newChatContext = getPersonalizedChatContext(newProfile);
      
      setTheme(newTheme);
      setFollowerTier(newTier);
      setWelcomeMessage(newWelcome);
      setRecommendations(newRecommendations);
      setChatContext(newChatContext);
      
      console.log('🎨 Personalization updated:', {
        niche: newProfile.niche,
        followers: newProfile.followers,
        tier: newTier.label,
        theme: newTheme.primary,
      });
    } else {
      // Reset to defaults
      setTheme(getPersonalizationTheme());
      setFollowerTier(getFollowerTier(0));
      setWelcomeMessage('Welcome back 👋');
      setRecommendations([]);
      setChatContext('');
      
      console.log('🎨 Personalization reset to defaults');
    }
  }, []);

  const loadPersonalization = useCallback(async () => {
    try {
      console.log('🎨 Loading personalization data...');
      const savedProfile = await storage.getOnboardingData();
      updatePersonalization(savedProfile);
    } catch (error) {
      console.error('❌ Error loading personalization:', error);
      updatePersonalization(null);
    }
  }, [updatePersonalization]);

  // Listen for auth state changes to clear personalization on sign out
  useEffect(() => {
    if (!user && !session) {
      // User has signed out, clear personalization immediately
      console.log('🎨 User signed out, clearing personalization state');
      updatePersonalization(null);
    } else if (user || session) {
      // User is signed in or session exists, load personalization
      loadPersonalization();
    }
  }, [user, session, updatePersonalization, loadPersonalization]);

  const updateProfile = async (newProfile: OnboardingData) => {
    try {
      console.log('🎨 Updating profile:', newProfile);
      await storage.saveOnboardingData(newProfile);
      updatePersonalization(newProfile);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  };

  const clearPersonalization = async () => {
    try {
      console.log('🎨 Clearing personalization...');
      // Clear state first for immediate UI update
      updatePersonalization(null);
      // Then clear storage
      await storage.clearOnboardingData();
      console.log('✅ Personalization cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing personalization:', error);
      // Ensure state is cleared even if storage fails
      updatePersonalization(null);
      throw error;
    }
  };

  const refreshPersonalization = async () => {
    await loadPersonalization();
  };

  const value = {
    profile,
    theme,
    followerTier,
    welcomeMessage,
    recommendations,
    chatContext,
    isPersonalized: !!profile,
    updateProfile,
    clearPersonalization,
    refreshPersonalization,
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
};
