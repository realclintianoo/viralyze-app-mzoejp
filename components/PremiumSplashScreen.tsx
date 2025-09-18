
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { colors, commonStyles } from '../styles/commonStyles';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface PremiumSplashScreenProps {
  onFinish: () => void;
}

const PremiumSplashScreen: React.FC<PremiumSplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.3);
  const glowAnim = useSharedValue(0);
  const textFadeAnim = useSharedValue(0);
  const logoRotateAnim = useSharedValue(0);

  // Create animated styles outside of useEffect
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { scale: scaleAnim.value },
      { rotate: `${logoRotateAnim.value}deg` }
    ],
    shadowOpacity: 0.6 + glowAnim.value * 0.4,
    shadowRadius: 20 + glowAnim.value * 20,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textFadeAnim.value,
    transform: [
      { translateY: interpolate(textFadeAnim.value, [0, 1], [20, 0]) }
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value * 0.8,
    transform: [{ scale: 1 + glowAnim.value * 0.1 }],
  }));

  // Create dot animated styles outside of useEffect
  const dotOpacity1 = useSharedValue(0);
  const dotOpacity2 = useSharedValue(0);
  const dotOpacity3 = useSharedValue(0);

  const dotAnimatedStyle1 = useAnimatedStyle(() => ({
    opacity: dotOpacity1.value,
  }));

  const dotAnimatedStyle2 = useAnimatedStyle(() => ({
    opacity: dotOpacity2.value,
  }));

  const dotAnimatedStyle3 = useAnimatedStyle(() => ({
    opacity: dotOpacity3.value,
  }));

  const dotAnimatedStyles = [dotAnimatedStyle1, dotAnimatedStyle2, dotAnimatedStyle3];

  useEffect(() => {
    // Start the splash animation sequence
    const startAnimation = () => {
      // Logo scale and fade in
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
      fadeAnim.value = withTiming(1, { duration: 800 });
      
      // Continuous glow effect
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
      
      // Subtle logo rotation
      logoRotateAnim.value = withRepeat(
        withTiming(360, { duration: 20000 }),
        -1,
        false
      );
      
      // Text fade in after logo
      textFadeAnim.value = withDelay(600, withTiming(1, { duration: 600 }));
      
      // Dot animations
      dotOpacity1.value = withDelay(
        0 * 200,
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          true
        )
      );
      
      dotOpacity2.value = withDelay(
        1 * 200,
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          true
        )
      );
      
      dotOpacity3.value = withDelay(
        2 * 200,
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          true
        )
      );
      
      // Auto finish after 3 seconds
      setTimeout(() => {
        onFinish();
      }, 3000);
    };

    startAnimation();
  }, [fadeAnim, glowAnim, logoRotateAnim, onFinish, scaleAnim, textFadeAnim, dotOpacity1, dotOpacity2, dotOpacity3]);

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Background gradient */}
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundSecondary + '80',
          colors.background,
        ]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Animated glow background */}
      <Animated.View style={[
        {
          position: 'absolute',
          width: width * 0.8,
          height: width * 0.8,
          borderRadius: width * 0.4,
          backgroundColor: colors.neonTeal + '10',
        },
        glowAnimatedStyle
      ]} />

      <Animated.View style={[
        {
          position: 'absolute',
          width: width * 0.6,
          height: width * 0.6,
          borderRadius: width * 0.3,
          backgroundColor: colors.neonGreen + '08',
        },
        glowAnimatedStyle
      ]} />

      {/* VIRALYZE Logo */}
      <Animated.View style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 0 },
          elevation: 20,
        },
        logoAnimatedStyle
      ]}>
        <Image
          source={require('../assets/images/a8b69f5d-7692-41da-84fd-76aebd35c7d4.png')}
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App Title */}
      <Animated.View style={[
        {
          alignItems: 'center',
          marginTop: 40,
        },
        textAnimatedStyle
      ]}>
        <Text style={[
          commonStyles.headerTitle,
          {
            fontSize: 36,
            color: colors.neonTeal,
            textShadowColor: colors.glowNeonTeal,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 16,
            letterSpacing: 2,
            marginBottom: 8,
          }
        ]}>
          VIRALYZE
        </Text>
        
        <Text style={[
          commonStyles.subtitle,
          {
            fontSize: 16,
            color: colors.neonGreen,
            textShadowColor: colors.glowNeonGreen,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontWeight: '600',
          }
        ]}>
          AI Coach
        </Text>
        
        <Text style={[
          commonStyles.textSmall,
          {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 16,
            letterSpacing: 1,
            textAlign: 'center',
          }
        ]}>
          Premium Content Creation Platform
        </Text>
      </Animated.View>

      {/* Loading indicator dots */}
      <Animated.View style={[
        {
          flexDirection: 'row',
          marginTop: 60,
          gap: 8,
        },
        textAnimatedStyle
      ]}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.neonTeal,
                shadowColor: colors.glowNeonTeal,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 6,
              },
              dotAnimatedStyles[index]
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
};

export default PremiumSplashScreen;
