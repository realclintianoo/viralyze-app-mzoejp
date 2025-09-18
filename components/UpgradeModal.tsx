
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, commonStyles } from '../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'text' | 'image';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ visible, onClose, type }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleUpgrade = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/paywall');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[colors.glassBackground, colors.glassBackgroundStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 1,
              shadowColor: colors.glowPrimary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 32,
              elevation: 24,
            }}
          >
            <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
              <View
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  padding: 32,
                  width: width - 40,
                  maxWidth: 400,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    padding: 8,
                    borderRadius: 12,
                    backgroundColor: colors.backgroundTertiary,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                  <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      shadowColor: colors.glowPrimary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 20,
                      elevation: 16,
                    }}
                  >
                    <Ionicons 
                      name={type === 'text' ? 'document-text' : 'image'} 
                      size={40} 
                      color={colors.white} 
                    />
                  </LinearGradient>

                  <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
                    Upgrade to Pro
                  </Text>
                  <Text style={[commonStyles.textSmall, { textAlign: 'center', opacity: 0.8 }]}>
                    You&apos;ve reached your daily limit of {type === 'text' ? '10 AI text requests' : '1 AI image generation'}
                  </Text>
                </View>

                {/* Quick Benefits Preview */}
                <View style={{ marginBottom: 32 }}>
                  {[
                    'Unlimited AI requests (10 → ∞)',
                    'All premium tools unlocked',
                    'Content Calendar & Scheduler',
                    'Cross-Platform Rewriter',
                    'Guideline Guardian',
                    'Advanced Analytics',
                  ].map((feature, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[commonStyles.text, { fontSize: 15 }]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Upgrade Button */}
                <TouchableOpacity onPress={handleUpgrade}>
                  <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    style={{
                      borderRadius: 16,
                      padding: 20,
                      alignItems: 'center',
                      shadowColor: colors.glowPrimary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 16,
                      elevation: 12,
                    }}
                  >
                    <Text style={[commonStyles.textBold, { fontSize: 18, color: colors.white }]}>
                      See All Pro Features
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={[commonStyles.textSmall, { textAlign: 'center', marginTop: 16, opacity: 0.6 }]}>
                  7-day free trial • Cancel anytime
                </Text>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default UpgradeModal;
