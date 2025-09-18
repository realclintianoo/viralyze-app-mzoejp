
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { storage } from '../utils/storage';
import { logSystemCheck } from '../utils/systemCheck';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useCallback } from 'react';

export default function Index() {
  console.log('🏠 Index component rendered');
  
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  
  const { user, loading: authLoading, session } = useAuth();
  const { profile, isPersonalized } = usePersonalization();

  // Check if user needs onboarding on every app launch
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        initializeApp();
      }
    }, [authLoading, isPersonalized])
  );

  useEffect(() => {
    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading, isPersonalized]);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Perform system check
      logSystemCheck();
      
      // Always show onboarding for personalization - this is the key change
      // Even existing users should go through onboarding to update their preferences
      console.log('🎯 Checking personalization status:', { 
        hasProfile: !!profile, 
        isPersonalized,
        user: !!user 
      });
      
      // Show onboarding if:
      // 1. No profile exists (new user)
      // 2. User is logged in but we want to refresh their preferences
      // 3. Guest user without profile
      const needsOnboarding = !isPersonalized || (user && !profile);
      
      console.log('🎯 Needs onboarding:', needsOnboarding);
      setShouldShowOnboarding(needsOnboarding);
      
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
          Loading VIRALYZE...
        </Text>
      </View>
    );
  }

  // Always redirect to onboarding first for personalization
  // The onboarding screen will handle whether to show welcome or go directly to app
  if (shouldShowOnboarding) {
    console.log('🎯 Redirecting to onboarding for personalization');
    return <Redirect href="/onboarding" />;
  }

  // If user has completed personalization, go to main app
  console.log('🎯 Redirecting to main app');
  return <Redirect href="/tabs/chat" />;
}
