
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles/commonStyles';

interface QuotaPillProps {
  remaining: number;
  total: number;
  type?: 'text' | 'image';
}

export default function QuotaPill({ remaining, total, type = 'text' }: QuotaPillProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (remaining <= 1) {
      // Pulse animation when quota is low
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow effect when quota is low
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [remaining]);

  const getColor = () => {
    if (remaining === 0) return colors.error;
    if (remaining <= 1) return colors.warning;
    return colors.accent;
  };

  const getIcon = () => {
    if (type === 'image') return 'image-outline';
    return 'flash-outline';
  };

  const animatedStyle = {
    transform: [{ scale: pulseAnim }],
    shadowColor: getColor(),
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.4],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
  };

  return (
    <Animated.View
      style={[
        {
          alignSelf: 'center',
          backgroundColor: colors.card,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
          borderRadius: borderRadius.full,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: getColor() + '30',
        },
        animatedStyle,
      ]}
    >
      <Ionicons 
        name={getIcon() as any} 
        size={16} 
        color={getColor()} 
        style={{ marginRight: spacing.xs }} 
      />
      <Text
        style={[
          typography.caption,
          {
            color: getColor(),
            fontWeight: '600',
          },
        ]}
      >
        {remaining} free left today
      </Text>
    </Animated.View>
  );
}
