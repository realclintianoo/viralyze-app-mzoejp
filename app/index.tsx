
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

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Perform system check
      logSystemCheck();
      
      console.log('🎯 Checking app state:', { 
        hasProfile: !!profile, 
        isPersonalized,
        user: !!user,
        session: !!session
      });
      
      // If user is signed out (no user and no session), always show onboarding
      // This ensures proper flow after sign-out
      if (!user && !session) {
        console.log('🎯 No user/session - showing onboarding');
        setShouldShowOnboarding(true);
        return;
      }
      
      // If user exists but no personalization, show onboarding
      if ((user || session) && !isPersonalized) {
        console.log('🎯 User exists but no personalization - showing onboarding');
        setShouldShowOnboarding(true);
        return;
      }
      
      // If everything is set up, go to main app
      console.log('🎯 User personalized - going to main app');
      setShouldShowOnboarding(false);
      
    } catch (error) {
      console.error('Error initializing app:', error);
      // On error, show onboarding as fallback
      setShouldShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  }, [isPersonalized, profile, user, session]);

  // Check if user needs onboarding on every app launch
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        initializeApp();
      }
    }, [authLoading, initializeApp])
  );

  useEffect(() => {
    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading, initializeApp]);

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
