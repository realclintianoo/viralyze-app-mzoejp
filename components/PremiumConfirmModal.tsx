
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors } from '../styles/commonStyles';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface PremiumConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const PremiumConfirmModal: React.FC<PremiumConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
  icon = 'alert-circle',
}) => {
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      modalOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      modalScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }));
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const handleConfirm = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
  };

  const handleCancel = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Backdrop */}
        <Animated.View
          style={[
            backdropAnimatedStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
          ]}
        />

        {/* Modal Content */}
        <Animated.View style={[modalAnimatedStyle, { width: width - 48, maxWidth: 400 }]}>
          <LinearGradient
            colors={isDestructive 
              ? ['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.05)']
              : [colors.glassBackground, colors.glassBackgroundStrong]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 2,
              shadowColor: isDestructive ? colors.error : colors.neuDark,
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.4,
              shadowRadius: 30,
              elevation: 30,
            }}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={{
                borderRadius: 26,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  backgroundColor: colors.glassBackgroundUltra,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: isDestructive 
                    ? 'rgba(239, 68, 68, 0.3)' 
                    : colors.glassBorderUltra,
                  borderRadius: 26,
                  alignItems: 'center',
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isDestructive 
                      ? 'rgba(239, 68, 68, 0.15)' 
                      : 'rgba(34, 197, 94, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    borderWidth: 2,
                    borderColor: isDestructive 
                      ? 'rgba(239, 68, 68, 0.3)' 
                      : 'rgba(34, 197, 94, 0.3)',
                    shadowColor: isDestructive ? colors.error : colors.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    elevation: 20,
                  }}
                >
                  <Ionicons
                    name={icon}
                    size={36}
                    color={isDestructive ? colors.error : colors.primary}
                  />
                </View>

                {/* Title */}
                <Text style={[commonStyles.title, { 
                  fontSize: 22, 
                  textAlign: 'center', 
                  marginBottom: 12,
                  color: isDestructive ? colors.error : colors.text,
                }]}>
                  {title}
                </Text>

                {/* Message */}
                <Text style={[commonStyles.text, { 
                  textAlign: 'center', 
                  marginBottom: 32,
                  opacity: 0.8,
                  lineHeight: 22,
                }]}>
                  {message}
                </Text>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', width: '100%', gap: 16 }}>
                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={{ flex: 1 }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.glassBackgroundStrong, colors.glassBackground]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 16,
                        borderRadius: 20,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.glassBorderStrong,
                        shadowColor: colors.neuDark,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 16,
                        elevation: 12,
                      }}
                    >
                      <Text style={[commonStyles.textBold, { fontSize: 16 }]}>
                        {cancelText}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Confirm Button */}
                  <TouchableOpacity
                    onPress={handleConfirm}
                    style={{ flex: 1 }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isDestructive 
                        ? [colors.error, '#DC2626'] 
                        : [colors.primary, colors.tealPrimary]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 16,
                        borderRadius: 20,
                        alignItems: 'center',
                        shadowColor: isDestructive ? colors.error : colors.glowPrimary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 20,
                        elevation: 20,
                      }}
                    >
                      <Text style={[commonStyles.buttonText, { fontSize: 16 }]}>
                        {confirmText}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PremiumConfirmModal;
