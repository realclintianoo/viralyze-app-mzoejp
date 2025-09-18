
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../styles/commonStyles';
import { router } from 'expo-router';

interface PremiumFeatureLockProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PremiumFeatureLock: React.FC<PremiumFeatureLockProps> = ({
  visible,
  onClose,
  featureName,
  description,
  icon = 'diamond',
}) => {
  console.log('💎 PremiumFeatureLock rendered:', { visible, featureName });
  
  const backdropOpacity = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const iconRotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { rotateZ: `${interpolate(modalScale.value, [0.8, 1], [-5, 0])}deg` },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${iconRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowIntensity.value,
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [0, 30]),
  }));

  useEffect(() => {
    if (visible) {
      console.log('💎 Animating premium lock modal in');
      
      // Backdrop animation
      backdropOpacity.value = withTiming(1, { duration: 300 });
      
      // Modal entrance animation
      modalOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      modalScale.value = withDelay(100, withSpring(1, { tension: 300, friction: 8 }));
      
      // Icon animation
      iconRotation.value = withDelay(300, withSequence(
        withTiming(-10, { duration: 200 }),
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ));
      
      // Glow effect
      glowIntensity.value = withDelay(200, withTiming(0.8, { duration: 600 }));
      
    } else {
      console.log('💎 Animating premium lock modal out');
      
      backdropOpacity.value = withTiming(0, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      glowIntensity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const handleClose = () => {
    console.log('💎 Premium lock modal close requested');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleUpgrade = () => {
    console.log('💎 Upgrade button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/paywall');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[styles.modal, modalStyle]}>
          <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)']}
              style={styles.gradientOverlay}
            />

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Premium Icon */}
            <Animated.View style={[styles.iconContainer, glowStyle, iconStyle]}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.iconGradient}
              >
                <Ionicons name={icon} size={48} color={colors.white} />
              </LinearGradient>
            </Animated.View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>Premium Feature</Text>
              <Text style={styles.featureName}>{featureName}</Text>
              <Text style={styles.description}>{description}</Text>

              {/* Benefits List */}
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.benefitText}>Unlimited AI requests</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.benefitText}>Advanced features</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.benefitText}>Priority support</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.upgradeGradient}
                >
                  <Ionicons name="diamond" size={20} color={colors.white} />
                  <Text style={styles.upgradeText}>Upgrade to Pro</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: 32,
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.glassBackgroundStrong,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...commonStyles.textSmall,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureName: {
    ...commonStyles.title,
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    ...commonStyles.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsList: {
    alignSelf: 'stretch',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    ...commonStyles.text,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
  upgradeButton: {
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeText: {
    ...commonStyles.textBold,
    color: colors.white,
    marginLeft: 8,
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    ...commonStyles.text,
    color: colors.textSecondary,
  },
});

export default PremiumFeatureLock;
