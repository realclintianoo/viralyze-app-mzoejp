
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onClose }) => {
  console.log('🚪 LogoutModal rendered:', { visible });
  
  const { signOut } = useAuth();
  
  const backgroundOpacity = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  useEffect(() => {
    if (visible) {
      console.log('🚪 Animating logout modal in');
      backgroundOpacity.value = withTiming(1, { duration: 200 });
      modalOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
      modalScale.value = withDelay(100, withSpring(1, { tension: 300, friction: 8 }));
    } else {
      console.log('🚪 Animating logout modal out');
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [visible, backgroundOpacity, modalOpacity, modalScale]);

  const handleCancel = () => {
    console.log('🚪 Logout cancelled');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleConfirm = async () => {
    console.log('🚪 Logout confirmed, performing sign out');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      onClose(); // Close modal first
      
      console.log('🚪 Calling signOut...');
      await signOut();
      console.log('✅ Sign out completed');
      
      // Navigate to index
      console.log('🚪 Navigating to index...');
      router.replace('/');
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
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
        <Animated.View style={[styles.background, backgroundStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleCancel}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View style={[styles.modal, modalStyle]}>
          <BlurView intensity={20} tint="dark" style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out" size={48} color={colors.error} />
            </View>

            <Text style={styles.title}>Sign Out</Text>
            <Text style={styles.message}>
              Are you sure you want to sign out? Your local data will be cleared.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>Sign Out</Text>
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
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...commonStyles.title,
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    ...commonStyles.text,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.glassBackgroundStrong,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  cancelText: {
    ...commonStyles.textBold,
    color: colors.text,
  },
  confirmText: {
    ...commonStyles.textBold,
    color: colors.white,
  },
});

export default LogoutModal;
