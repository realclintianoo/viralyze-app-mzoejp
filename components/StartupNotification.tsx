
import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, commonStyles } from '../styles/commonStyles';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface StartupNotificationProps {
  onDismiss: () => void;
}

export default function StartupNotification({ onDismiss }: StartupNotificationProps) {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-100);

  const checkSystemOnStartup = useCallback(async () => {
    // System check logic here
    console.log('Checking system on startup');
  }, []);

  useEffect(() => {
    checkSystemOnStartup();
    
    // Show notification
    fadeAnim.value = withTiming(1, { duration: 400 });
    slideAnim.value = withSpring(0, { tension: 300, friction: 8 });

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [checkSystemOnStartup, fadeAnim, slideAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const handleDismiss = () => {
    fadeAnim.value = withTiming(0, { duration: 300 });
    slideAnim.value = withTiming(-100, { duration: 300 });
    setTimeout(onDismiss, 300);
  };

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      },
      animatedStyle
    ]}>
      <BlurView intensity={40} style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}>
        <LinearGradient
          colors={[
            colors.glassBackground + 'F0',
            colors.background + 'E6',
          ]}
          style={{
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.neonGreen + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.neonGreen} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[
              commonStyles.subtitle,
              {
                color: colors.text,
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 2,
              }
            ]}>
              System Ready
            </Text>
            <Text style={[
              commonStyles.textSmall,
              {
                color: colors.textSecondary,
                fontSize: 12,
              }
            ]}>
              All systems operational
            </Text>
          </View>

          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.backgroundSecondary + '80',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}
