
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

interface PremiumConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'success' | 'warning' | 'error' | 'info';
}

export default function PremiumConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}: PremiumConfirmModalProps) {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, fadeAnim, scaleAnim]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: colors.neonGreen };
      case 'warning':
        return { icon: 'warning', color: colors.neonYellow };
      case 'error':
        return { icon: 'close-circle', color: colors.neonRed };
      default:
        return { icon: 'information-circle', color: colors.neonTeal };
    }
  };

  const { icon, color } = getIconAndColor();

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
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
              {/* Icon */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: color + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={36} color={color} />
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

              {/* Buttons */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
                width: '100%',
              }}>
                {/* Cancel Button */}
                <TouchableOpacity
                  style={[
                    commonStyles.secondaryButton,
                    {
                      flex: 1,
                      backgroundColor: colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                    }
                  ]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    commonStyles.secondaryButtonText,
                    {
                      color: colors.text,
                      fontWeight: '600',
                    }
                  ]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={[
                    commonStyles.primaryButton,
                    {
                      flex: 1,
                      backgroundColor: color,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 6,
                    }
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    commonStyles.primaryButtonText,
                    {
                      color: colors.background,
                      fontWeight: '700',
                    }
                  ]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
