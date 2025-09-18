
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onConfirm, onCancel }) => {
  const backgroundOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backgroundOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, backgroundOpacity, modalScale, modalOpacity]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
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
      <Animated.View style={[styles.overlay, backgroundAnimatedStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onCancel}
          activeOpacity={1}
        />
        
        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          <BlurView intensity={20} tint="dark" style={styles.modalBlur}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.modalContent}
            >
              {/* Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.iconBackground}
                >
                  <Ionicons name="log-out-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.title}>Are you sure you want to log out?</Text>
              
              {/* Message */}
              <Text style={styles.message}>
                This will sign you out completely and clear all local data. You&apos;ll need to sign in again or choose guest mode to continue using the app.
              </Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <View style={styles.confirmButtonContent}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalBlur: {
    borderRadius: 24,
  },
  modalContent: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E6EAF0',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 26,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EAF0',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  confirmButtonContent: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});

export default LogoutModal;
