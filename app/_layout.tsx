
// Import polyfills first, before any other imports
import 'react-native-url-polyfill/auto';

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { setupErrorLogging } from '../utils/errorLogger';
import { logSystemCheck } from '../utils/systemCheck';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import SystemCheckNotification from '../components/SystemCheckNotification';
import OpenAIDebug from '../components/OpenAIDebug';

export default function RootLayout() {
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setupErrorLogging();
    
    // Run system check on startup
    setTimeout(() => {
      logSystemCheck();
    }, 1000);
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'default',
              }}
            />
            <SystemCheckNotification onOpenDebug={() => setShowDebug(true)} />
            <OpenAIDebug visible={showDebug} onClose={() => setShowDebug(false)} />
          </ToastProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
