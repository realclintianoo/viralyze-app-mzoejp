
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../contexts/AuthContext';
import { PersonalizationProvider } from '../contexts/PersonalizationContext';
import { ConversationsProvider } from '../contexts/ConversationsContext';
import { ToastProvider } from '../contexts/ToastContext';
import { colors } from '../styles/commonStyles';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <AuthProvider>
          <PersonalizationProvider>
            <ConversationsProvider>
              <StatusBar style="light" backgroundColor={colors.background} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="tabs" />
                <Stack.Screen name="tool/[id]" />
                <Stack.Screen name="profile/edit" />
                <Stack.Screen name="paywall" />
              </Stack>
            </ConversationsProvider>
          </PersonalizationProvider>
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
