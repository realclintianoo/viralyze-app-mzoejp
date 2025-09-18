
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { PersonalizationProvider } from '../contexts/PersonalizationContext';
import { ConversationsProvider } from '../contexts/ConversationsContext';
import { ToastProvider } from '../contexts/ToastContext';
import React from 'react';

export default function RootLayout() {
  console.log('🏗️ RootLayout initialized');
  
  return (
    <ToastProvider>
      <AuthProvider>
        <PersonalizationProvider>
          <ConversationsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="paywall" />
              <Stack.Screen name="tabs" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="tool/[id]" />
            </Stack>
            <StatusBar style="light" backgroundColor="#0B0F14" />
          </ConversationsProvider>
        </PersonalizationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
