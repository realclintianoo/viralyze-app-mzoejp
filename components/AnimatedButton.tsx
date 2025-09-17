
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  Animated,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, animations } from '../styles/commonStyles';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  haptics?: boolean;
  glow?: boolean;
}

export default function AnimatedButton({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  haptics = true,
  glow = false,
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      glow && Animated.timing(glowAnim, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      glow && Animated.timing(glowAnim, {
        toValue: 0,
        duration: animations.normal,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: size === 'small' ? 36 : size === 'large' ? 56 : 48,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 32 : 24,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.grey : colors.accent,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? colors.grey : colors.border,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: colors.white,
        };
      case 'secondary':
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? colors.grey : colors.text,
        };
      default:
        return baseStyle;
    }
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    shadowOpacity: glow ? glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.4],
    }) : undefined,
    shadowRadius: glow ? glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 12],
    }) : undefined,
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
