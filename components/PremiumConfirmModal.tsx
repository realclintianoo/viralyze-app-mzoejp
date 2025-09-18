
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors } from '../styles/commonStyles';

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
  icon = 'alert-circle'
}) => {
  const scaleAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: fadeAnim.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  React.useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible]);

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
      statusBarTranslucent
    >
      <Animated.View style={[
        {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
        backdropStyle
      ]}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={handleCancel}
        />

        <Animated.View style={[
          {
            backgroundColor: colors.glassBackground,
            borderRadius: 28,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          },
          animatedStyle
        ]}>
          <BlurView intensity={20} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
          }} />

          {/* Icon */}
          <View style={{
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <View style={{
              backgroundColor: isDestructive ? colors.error + '20' : colors.warning + '20',
              borderRadius: 30,
              padding: 16,
              borderWidth: 2,
              borderColor: isDestructive ? colors.error + '40' : colors.warning + '40',
            }}>
              <Ionicons 
                name={icon} 
                size={32} 
                color={isDestructive ? colors.error : colors.warning} 
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[
            commonStyles.title,
            { 
              textAlign: 'center', 
              marginBottom: 12,
              fontSize: 22
            }
          ]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[
            commonStyles.text,
            { 
              textAlign: 'center', 
              marginBottom: 32,
              color: colors.textSecondary,
              lineHeight: 22
            }
          ]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: 12,
          }}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                commonStyles.secondaryButton,
                { flex: 1 }
              ]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={commonStyles.secondaryButtonText}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                commonStyles.premiumButton,
                { 
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderColor: isDestructive ? colors.error : colors.accent,
                }
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDestructive ? [colors.error, colors.error] : [colors.gradientStart, colors.gradientEnd]}
                style={[commonStyles.premiumButton, { margin: 0 }]}
              >
                <Text style={commonStyles.buttonText}>
                  {confirmText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default PremiumConfirmModal;
