
import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import PremiumSplashScreen from '../components/PremiumSplashScreen';
import { storage } from '../utils/storage';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const initializeApp = useCallback(async () => {
    try {
      // Check if user has completed onboarding
      const profile = await storage.getProfile();
      setHasCompletedOnboarding(!!profile);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Show splash screen
  if (showSplash) {
    return <PremiumSplashScreen onFinish={handleSplashFinish} />;
  }

  // Show loading while auth is loading
  if (authLoading || loading) {
    return <View style={{ flex: 1, backgroundColor: '#0B0F14' }} />;
  }

  // Redirect based on auth and onboarding status
  if (!user || !hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/tabs/chat" />;
}
