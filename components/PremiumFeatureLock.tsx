
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors } from '../styles/commonStyles';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PremiumFeatureLockProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: string[];
}

const PremiumFeatureLock: React.FC<PremiumFeatureLockProps> = ({
  title,
  description,
  onUpgrade,
  icon = 'diamond',
  gradient = ['#22C55E', '#06B6D4'],
}) => {
  const shimmerAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    // Shimmer effect
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );

    // Gentle pulse
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [shimmerAnim, pulseAnim]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerAnim.value * 200 - 100 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onUpgrade();
  };

  return (
    <Animated.View style={[pulseStyle, { margin: 16 }]}>
      <BlurView intensity={20} style={{
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
      }}>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.1)', 'rgba(6, 182, 212, 0.1)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        
        {/* Shimmer overlay */}
        <Animated.View style={[shimmerStyle, {
          position: 'absolute',
          top: 0,
          left: -50,
          right: -50,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          width: 50,
        }]} />
        
        <View style={{
          padding: 24,
          alignItems: 'center',
        }}>
          {/* Premium Icon */}
          <LinearGradient
            colors={gradient}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: gradient[0],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name={icon} size={28} color={colors.white} />
          </LinearGradient>
          
          {/* Content */}
          <Text style={[commonStyles.textBold, { 
            fontSize: 18, 
            textAlign: 'center',
            marginBottom: 8,
          }]}>
            {title}
          </Text>
          
          <Text style={[commonStyles.textSmall, { 
            textAlign: 'center',
            marginBottom: 20,
            opacity: 0.8,
            lineHeight: 20,
          }]}>
            {description}
          </Text>
          
          {/* Upgrade Button */}
          <TouchableOpacity
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: gradient[0],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradient}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="diamond" size={16} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={[commonStyles.textBold, { 
                color: colors.white,
                fontSize: 16,
              }]}>
                Upgrade to Pro
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={[commonStyles.textSmall, { 
            textAlign: 'center',
            marginTop: 12,
            opacity: 0.6,
            fontSize: 12,
          }]}>
            Unlock all premium features
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

export default PremiumFeatureLock;
