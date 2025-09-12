
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { colors, spacing } from '../styles/commonStyles';

interface TypingIndicatorProps {
  visible: boolean;
}

export default function TypingIndicator({ visible }: TypingIndicatorProps) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createAnimation(dot1Anim, 0),
        createAnimation(dot2Anim, 200),
        createAnimation(dot3Anim, 400),
      ]).start();
    } else {
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
  }, [visible, dot1Anim, dot2Anim, dot3Anim]);

  if (!visible) return null;

  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grey,
    marginHorizontal: 2,
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    }}>
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot1Anim,
            transform: [{
              scale: dot1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot2Anim,
            transform: [{
              scale: dot2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot3Anim,
            transform: [{
              scale: dot3Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      />
    </View>
  );
}
