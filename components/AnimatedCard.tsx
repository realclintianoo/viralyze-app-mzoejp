
import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, shadows, borderRadius, animations } from '../styles/commonStyles';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  delay?: number;
  glow?: boolean;
  hover?: boolean;
}

export default function AnimatedCard({
  children,
  style,
  onPress,
  delay = 0,
  glow = false,
  hover = false,
}: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animations.slow,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        ...animations.spring,
      }),
    ]).start();
  }, [delay, fadeAnim, scaleAnim]);

  const handlePressIn = () => {
    if (hover) {
      Animated.timing(hoverAnim, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (hover) {
      Animated.timing(hoverAnim, {
        toValue: 0,
        duration: animations.normal,
        useNativeDriver: false,
      }).start();
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.md,
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
    backgroundColor: hover ? hoverAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.card, colors.cardHover],
    }) : colors.card,
    shadowOpacity: glow ? 0.3 : shadows.md.shadowOpacity,
    shadowColor: glow ? colors.accent : shadows.md.shadowColor,
  };

  if (onPress) {
    return (
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={[cardStyle, { backgroundColor: 'transparent' }, style]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[cardStyle, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
