
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

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ visible, onConfirm, onCancel }: LogoutModalProps) {
  const backgroundOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { tension: 300, friction: 8 });
      modalOpacity.value = withTiming(1, { duration: 400 });
    } else {
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, backgroundOpacity, modalOpacity, modalScale]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

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
                backgroundColor: colors.neonRed + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: colors.neonRed,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <Ionicons name="log-out-outline" size={36} color={colors.neonRed} />
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
                Sign Out
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
                Are you sure you want to sign out? You&apos;ll need to sign in again to access your account.
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
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={[
                    commonStyles.primaryButton,
                    {
                      flex: 1,
                      backgroundColor: colors.neonRed,
                      shadowColor: colors.neonRed,
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
                    Sign Out
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
