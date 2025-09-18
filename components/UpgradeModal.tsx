
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, commonStyles } from '../styles/commonStyles';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface UpgradeModalProps {
  visible: boolean;
  onUpgrade: () => void;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function UpgradeModal({
  visible,
  onUpgrade,
  onClose,
  title = 'Upgrade to Pro',
  message = 'Unlock unlimited AI generation and premium features with VIRALYZE Pro.'
}: UpgradeModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { tension: 300, friction: 8 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, opacity, scale]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgrade();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[
        {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        },
        backgroundAnimatedStyle
      ]}>
        <Animated.View style={[
          {
            width: width * 0.85,
            maxWidth: 400,
          },
          modalAnimatedStyle
        ]}>
          <BlurView intensity={40} style={{
            borderRadius: 24,
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
                padding: 32,
                alignItems: 'center',
              }}
            >
              {/* Close button */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.backgroundSecondary + '80',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleClose}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Premium Icon */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.neonTeal + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: colors.glowNeonTeal,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 15,
                elevation: 8,
              }}>
                <Ionicons name="diamond" size={36} color={colors.neonTeal} />
              </View>

              {/* Title */}
              <Text style={[
                commonStyles.headerTitle,
                {
                  fontSize: 24,
                  textAlign: 'center',
                  marginBottom: 12,
                  color: colors.text,
                }
              ]}>
                {title}
              </Text>

              {/* Message */}
              <Text style={[
                commonStyles.text,
                {
                  textAlign: 'center',
                  color: colors.textSecondary,
                  lineHeight: 22,
                  marginBottom: 32,
                }
              ]}>
                {message}
              </Text>

              {/* Features List */}
              <View style={{
                alignSelf: 'stretch',
                marginBottom: 32,
              }}>
                {[
                  'Unlimited AI text generation',
                  'Unlimited AI image creation',
                  'Premium tools & features',
                  'Priority support'
                ].map((feature, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.neonGreen} />
                    <Text style={[
                      commonStyles.text,
                      {
                        color: colors.text,
                        marginLeft: 12,
                        fontSize: 16,
                      }
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Upgrade Button */}
              <TouchableOpacity
                style={[
                  commonStyles.primaryButton,
                  {
                    backgroundColor: colors.neonTeal,
                    width: '100%',
                    marginBottom: 16,
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

              {/* Maybe Later Button */}
              <TouchableOpacity
                style={[
                  commonStyles.secondaryButton,
                  {
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                  }
                ]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={[
                  commonStyles.secondaryButtonText,
                  {
                    color: colors.textSecondary,
                    fontSize: 14,
                  }
                ]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
