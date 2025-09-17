
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { storage } from '../utils/storage';
import { logSystemCheck } from '../utils/systemCheck';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import AuthFlow from '../components/AuthFlow';
import OnboardingFlow from '../components/OnboardingFlow';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [authLoading, user]);

  const checkOnboardingStatus = async () => {
    try {
      // Perform system check
      logSystemCheck();
      
      // Check if user has completed onboarding
      const onboardingData = await storage.getOnboardingData();
      const hasOnboarding = !!onboardingData;
      
      setHasCompletedOnboarding(hasOnboarding);
      
      // If no onboarding data, show auth flow first (unless already authenticated)
      if (!hasOnboarding && !user) {
        setShowAuthFlow(true);
      } else if (!hasOnboarding && user) {
        // User is authenticated but hasn't completed onboarding
        setShowOnboardingFlow(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthFlow(false);
    setShowOnboardingFlow(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingFlow(false);
    setHasCompletedOnboarding(true);
  };

  if (isLoading || authLoading) {
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

  return (
    <View style={[commonStyles.container, commonStyles.centered]}>
      <AuthFlow
        visible={showAuthFlow}
        onClose={() => setShowAuthFlow(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <OnboardingFlow
        visible={showOnboardingFlow}
        onComplete={handleOnboardingComplete}
        username={user?.email?.split('@')[0] || 'Creator'}
      />
      
      {!showAuthFlow && !showOnboardingFlow && (
        <>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[commonStyles.text, { marginTop: 16 }]}>
            Setting up your experience...
          </Text>
        </>
      )}
    </View>
  );
}
