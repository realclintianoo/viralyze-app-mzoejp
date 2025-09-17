
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { storage } from '../utils/storage';
import { logSystemCheck } from '../utils/systemCheck';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';

export default function Index() {
  console.log('🏠 Index component rendered');
  
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading, session } = useAuth();

  // Always redirect to onboarding first - this ensures the welcome screen is shown immediately
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        initializeApp();
      }
    }, [authLoading])
  );

  useEffect(() => {
    if (!authLoading) {
      initializeApp();
    }
  }, [authLoading]);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Perform system check
      logSystemCheck();
      
      console.log('App initialized, redirecting to onboarding/welcome screen');
    } catch (error) {
      console.error('Error initializing app:', error);
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

  // Always redirect to onboarding first - the onboarding screen will handle the logic
  // of whether to show welcome screen or go directly to the app
  return <Redirect href="/onboarding" />;
}
