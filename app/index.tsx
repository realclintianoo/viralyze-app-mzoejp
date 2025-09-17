
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { storage } from '../utils/storage';
import { logSystemCheck } from '../utils/systemCheck';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Check onboarding status whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        checkOnboardingStatus();
      }
    }, [authLoading])
  );

  useEffect(() => {
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [authLoading]);

  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      
      // Perform system check
      logSystemCheck();
      
      // Check if user has completed onboarding
      const onboardingData = await storage.getOnboardingData();
      console.log('Onboarding data found:', !!onboardingData);
      setHasCompletedOnboarding(!!onboardingData);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={[commonStyles.container, commonStyles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[commonStyles.text, { marginTop: 16 }]}>
          Loading VIRALYZE...
        </Text>
      </View>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/tabs/chat" />;
  }

  return <Redirect href="/onboarding" />;
}
