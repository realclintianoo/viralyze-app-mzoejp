
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { storage } from '../utils/storage';
import { logSystemCheck } from '../utils/systemCheck';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';

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
    }, [authLoading, isPersonalized, user, session, initializeApp])
  );

  useEffect(() => {
    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading, isPersonalized, user, session, initializeApp]);

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Perform system check
      logSystemCheck();
      
      console.log('🎯 Checking app state:', { 
        hasProfile: !!profile, 
        isPersonalized,
        hasUser: !!user,
        hasSession: !!session
      });
      
      // Show onboarding if:
      // 1. No profile exists (new user or after sign out)
      // 2. User is not personalized
      // 3. Fresh app start without proper setup
      const needsOnboarding = !isPersonalized || !profile;
      
      console.log('🎯 Needs onboarding:', needsOnboarding);
      setShouldShowOnboarding(needsOnboarding);
      
    } catch (error) {
      console.error('Error initializing app:', error);
      // On error, show onboarding to reset state
      setShouldShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  }, [isPersonalized, profile, user, session]);

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
    console.log('🎯 Redirecting to onboarding for setup');
    return <Redirect href="/onboarding" />;
  }

  // If user has completed personalization, go to main app
  console.log('🎯 Redirecting to main app');
  return <Redirect href="/tabs/chat" />;
}
