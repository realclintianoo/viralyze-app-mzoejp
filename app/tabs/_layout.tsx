
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/commonStyles';
import { Platform, View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 16,
          height: Math.max(88 + insets.bottom, 96),
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}>
            <BlurView intensity={30} style={{
              flex: 1,
              backgroundColor: colors.glassBackgroundUltra + 'E6',
            }} />
            <LinearGradient
              colors={[
                colors.glassBackgroundUltra + 'F0',
                colors.background + 'F8',
              ]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Top border with glow */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: colors.glassBorderUltra,
              shadowColor: colors.glowNeonTeal,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 12,
            }} />
          </View>
        ),
        tabBarActiveTintColor: colors.neonTeal,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginTop: 4,
          textShadowColor: 'rgba(0, 255, 255, 0.3)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          paddingHorizontal: 4,
          marginHorizontal: 8,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
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
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: focused ? colors.neonTeal + '20' : 'transparent',
              borderWidth: focused ? 2 : 0,
              borderColor: focused ? colors.neonTeal + '40' : 'transparent',
              shadowColor: focused ? colors.glowNeonTeal : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: focused ? 0.8 : 0,
              shadowRadius: focused ? 12 : 0,
              elevation: focused ? 8 : 0,
            }}>
              <Ionicons 
                name={iconName} 
                size={focused ? 26 : 24} 
                color={focused ? colors.neonTeal : colors.textSecondary}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="chat"
        component={ChatScreen}
        options={{ 
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="tools"
        component={ToolsScreen}
        options={{ 
          tabBarLabel: 'Tools',
        }}
      />
      <Tab.Screen
        name="saved"
        component={SavedScreen}
        options={{ 
          tabBarLabel: 'Saved',
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{ 
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
