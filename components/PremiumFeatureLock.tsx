
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
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { colors, commonStyles } from '../styles/commonStyles';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface PremiumFeatureLockProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  style?: any;
}

export default function PremiumFeatureLock({ 
  title, 
  description, 
  onUpgrade, 
  style 
}: PremiumFeatureLockProps) {
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [glowAnim]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
    shadowRadius: 15 + glowAnim.value * 10,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.6 + glowAnim.value * 0.4,
  }));

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgrade();
  };

  return (
    <Animated.View style={[
      {
        margin: 16,
        shadowColor: colors.glowNeonTeal,
        shadowOffset: { width: 0, height: 4 },
        elevation: 12,
      },
      containerAnimatedStyle,
      style
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
            padding: 24,
            alignItems: 'center',
            minHeight: 200,
            justifyContent: 'center',
          }}
        >
          {/* Premium Crown Icon */}
          <Animated.View style={[
            {
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.neonTeal + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
              shadowColor: colors.glowNeonTeal,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 15,
              elevation: 8,
            },
            iconAnimatedStyle
          ]}>
            <Ionicons name="diamond" size={36} color={colors.neonTeal} />
          </Animated.View>

          {/* Title */}
          <Text style={[
            commonStyles.subtitle,
            {
              fontSize: 20,
              fontWeight: '700',
              color: colors.text,
              textAlign: 'center',
              marginBottom: 12,
            }
          ]}>
            {title}
          </Text>

          {/* Description */}
          <Text style={[
            commonStyles.text,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }
          ]}>
            {description}
          </Text>

          {/* Upgrade Button */}
          <TouchableOpacity
            style={[
              commonStyles.primaryButton,
              {
                backgroundColor: colors.neonTeal,
                paddingHorizontal: 32,
                paddingVertical: 16,
                shadowColor: colors.glowNeonTeal,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 8,
              }
            ]}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name="flash" 
                size={18} 
                color={colors.background} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[
                commonStyles.primaryButtonText,
                {
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.background,
                }
              ]}>
                Upgrade to Pro
              </Text>
            </View>
          </TouchableOpacity>

          {/* Features List */}
          <View style={{ 
            marginTop: 20, 
            alignSelf: 'stretch',
            paddingHorizontal: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.neonGreen} />
              <Text style={[
                commonStyles.textSmall,
                { color: colors.textSecondary, marginLeft: 8 }
              ]}>
                Unlimited AI generation
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.neonGreen} />
              <Text style={[
                commonStyles.textSmall,
                { color: colors.textSecondary, marginLeft: 8 }
              ]}>
                Premium features & tools
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.neonGreen} />
              <Text style={[
                commonStyles.textSmall,
                { color: colors.textSecondary, marginLeft: 8 }
              ]}>
                Priority support
              </Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}
