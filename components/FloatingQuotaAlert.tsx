
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface FloatingQuotaAlertProps {
  visible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export default function FloatingQuotaAlert({ visible, onUpgrade, onDismiss }: FloatingQuotaAlertProps) {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-100);
  const scaleAnim = useSharedValue(0.8);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 400 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(-100, { duration: 300 });
      scaleAnim.value = withTiming(0.8, { duration: 300 });
      glowAnim.value = withTiming(0, { duration: 300 });
    }
  }, [visible, fadeAnim, glowAnim, scaleAnim, slideAnim]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glowAnim.value * 0.4,
    shadowRadius: 15 + glowAnim.value * 10,
  }));

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgrade();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      },
      containerAnimatedStyle
    ]}>
      <Animated.View style={[
        {
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 4 },
          elevation: 12,
        },
        glowAnimatedStyle
      ]}>
        <BlurView intensity={40} style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: colors.glassBorderUltra,
        }}>
          <LinearGradient
            colors={[
              colors.glassBackgroundUltra + 'F0',
              colors.background + 'E6',
            ]}
            style={{
              padding: 20,
            }}
          >
            {/* Close button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.backgroundSecondary + '80',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
              onPress={handleDismiss}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Content */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Icon */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.neonTeal + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
                shadowColor: colors.glowNeonTeal,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 4,
              }}>
                <Ionicons name="flash-off" size={24} color={colors.neonTeal} />
              </View>

              {/* Text content */}
              <View style={{ flex: 1, paddingRight: 20 }}>
                <Text style={[
                  commonStyles.subtitle,
                  {
                    color: colors.text,
                    fontWeight: '700',
                    marginBottom: 6,
                    fontSize: 16,
                  }
                ]}>
                  Daily Limit Reached
                </Text>
                
                <Text style={[
                  commonStyles.text,
                  {
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 16,
                  }
                ]}>
                  You&apos;ve hit your daily free limit. Come back tomorrow to refresh or upgrade to Pro for unlimited access.
                </Text>

                {/* Upgrade button */}
                <TouchableOpacity
                  style={[
                    {
                      backgroundColor: colors.neonTeal,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      alignItems: 'center',
                      shadowColor: colors.glowNeonTeal,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: 6,
                    }
                  ]}
                  onPress={handleUpgrade}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="flash" size={16} color={colors.background} style={{ marginRight: 8 }} />
                    <Text style={[
                      commonStyles.primaryButtonText,
                      {
                        fontSize: 14,
                        fontWeight: '700',
                        color: colors.background,
                      }
                    ]}>
                      Upgrade Now
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}
