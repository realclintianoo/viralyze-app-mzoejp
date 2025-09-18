
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { PersonalizationProvider } from '../contexts/PersonalizationContext';
import StartupNotification from '../components/StartupNotification';
import { logSystemCheck } from '../utils/systemCheck';

export default function RootLayout() {
  const [showStartupNotification, setShowStartupNotification] = useState(false); // Disabled for now

  useEffect(() => {
    // Run system check on app startup
    logSystemCheck();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PersonalizationProvider>
          <ToastProvider>
            <StatusBar style="light" backgroundColor="#0B0F14" />
            
            {showStartupNotification && (
              <StartupNotification 
                onDismiss={() => setShowStartupNotification(false)} 
              />
            )}
            
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0B0F14' },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="tabs" />
              <Stack.Screen name="tool/[id]" />
              <Stack.Screen 
                name="profile/edit" 
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen 
                name="paywall" 
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack>
          </ToastProvider>
        </PersonalizationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
