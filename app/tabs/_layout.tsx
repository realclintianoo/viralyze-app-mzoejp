
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/commonStyles';
import { Platform, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

import ChatScreen from './chat';
import ToolsScreen from './tools';
import SavedScreen from './saved';
import SettingsScreen from './settings';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (user) {
      loadCurrentStreak();
    }
  }, [user]);

  const loadCurrentStreak = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setCurrentStreak(data.current_streak || 0);
      }
    } catch (error) {
      console.log('Error loading streak:', error);
    }
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.glassBackgroundUltra,
          borderTopColor: colors.glassBorderStrong,
          borderTopWidth: 2,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 12,
          height: Math.max(80 + insets.bottom, 88),
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 20,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarActiveTintColor: colors.neonTeal,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'tools') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return (
            <Ionicons 
              name={iconName} 
              size={focused ? 24 : 22} 
              color={focused ? colors.neonTeal : colors.textSecondary}
              style={{
                textShadowColor: focused ? colors.glowNeonTeal : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: focused ? 8 : 0,
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="chat"
        component={ChatScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name="tools"
        component={ToolsScreen}
        options={{ tabBarLabel: 'Tools' }}
      />
      <Tab.Screen
        name="saved"
        component={SavedScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
