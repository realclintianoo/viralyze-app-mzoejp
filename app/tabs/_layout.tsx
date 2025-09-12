
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/commonStyles';
import FloatingVerificationButton from '../../components/FloatingVerificationButton';

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="construct" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <FloatingVerificationButton />
    </>
  );
}
