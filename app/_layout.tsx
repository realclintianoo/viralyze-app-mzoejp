
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { setupErrorLogging } from '../utils/errorLogger';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

export default function RootLayout() {
  useEffect(() => {
    setupErrorLogging();
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
          </ToastProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
