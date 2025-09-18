
import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { commonStyles, colors } from '../styles/commonStyles';

export default function Index() {
  console.log('🏠 Index screen rendered');
  
  const { user, loading: authLoading } = useAuth();
  const { isPersonalized, loading: personalizationLoading } = usePersonalization();

  const initializeApp = useCallback(async () => {
    console.log('🏠 Initializing app...');
    console.log('🏠 User:', !!user);
    console.log('🏠 Is personalized:', isPersonalized);
    console.log('🏠 Auth loading:', authLoading);
    console.log('🏠 Personalization loading:', personalizationLoading);
  }, [user, isPersonalized, authLoading, personalizationLoading]);

  useEffect(() => {
    if (!authLoading && !personalizationLoading) {
      initializeApp();
    }
  }, [authLoading, personalizationLoading, initializeApp]);

  // Show loading while auth and personalization are initializing
  if (authLoading || personalizationLoading) {
    console.log('🏠 Showing loading screen');
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // User is authenticated and personalized -> go to main app
  if (user && isPersonalized) {
    console.log('🏠 Redirecting to main app (tabs)');
    return <Redirect href="/tabs" />;
  }

  // User is authenticated but not personalized -> go to onboarding
  if (user && !isPersonalized) {
    console.log('🏠 Redirecting to onboarding (user exists but not personalized)');
    return <Redirect href="/onboarding" />;
  }

  // No user -> go to onboarding
  console.log('🏠 Redirecting to onboarding (no user)');
  return <Redirect href="/onboarding" />;
}
