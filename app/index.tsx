
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { storage } from '../utils/storage';
import { logSystemCheck } from '../utils/systemCheck';
import { colors, commonStyles } from '../styles/commonStyles';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Perform system check
      logSystemCheck();
      
      // Check if user has completed onboarding
      const onboardingData = await storage.getOnboardingData();
      setHasCompletedOnboarding(!!onboardingData);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
