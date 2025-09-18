
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const { width, height } = Dimensions.get('window');

interface AuthFlowProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ visible, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();

  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(height);
  const logoScale = useSharedValue(0.8);
  const logoGlow = useSharedValue(0);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Entrance animations
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      contentTranslateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      logoScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
      logoGlow.value = withDelay(400, withTiming(1, { duration: 800 }));
      formOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    } else {
      // Exit animations
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      contentTranslateY.value = withTiming(height, { duration: 300 });
      logoScale.value = withTiming(0.8, { duration: 200 });
      logoGlow.value = withTiming(0, { duration: 200 });
      formOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, backgroundOpacity, contentTranslateY, formOpacity, logoGlow, logoScale]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    shadowOpacity: interpolate(logoGlow.value, [0, 1], [0, 0.8]),
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (isSignUp && !name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = isSignUp 
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

      if (error) {
        console.error('Auth error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          showToast('Invalid email or password', 'error');
        } else if (error.message?.includes('Email not confirmed')) {
          showToast('Please check your email and confirm your account', 'error');
        } else if (error.message?.includes('User already registered')) {
          showToast('Account already exists. Try signing in instead.', 'error');
        } else {
          showToast(error.message || 'Authentication failed', 'error');
        }
      } else {
        if (isSignUp) {
          showToast('Account created! Please check your email to verify.', 'success');
          Alert.alert(
            'Verify Your Email',
            'We\'ve sent you a verification email. Please check your inbox and click the verification link to complete your registration.',
            [{ text: 'OK' }]
          );
          // Don't call onSuccess for sign up since email needs to be verified
        } else {
          showToast('Welcome back!', 'success');
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(`${provider} authentication coming soon!`, 'info');
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Password reset coming soon!', 'info');
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsSignUp(false);
    setFocusedField(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['#000000', '#0F172A', '#134E4A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="#E6EAF0" />
              </TouchableOpacity>

              {/* Logo */}
              <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <LinearGradient
                  colors={['#22C55E', '#10B981']}
                  style={styles.logo}
                >
                  <Text style={styles.logoText}>V</Text>
                </LinearGradient>
              </Animated.View>

              {/* Title */}
              <Animated.View style={formAnimatedStyle}>
                <Text style={styles.title}>
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={styles.subtitle}>
                  {isSignUp 
                    ? 'Join thousands of creators growing with AI'
                    : 'Continue your journey to viral success'
                  }
                </Text>
              </Animated.View>

              {/* Form */}
              <Animated.View style={[styles.form, formAnimatedStyle]}>
                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'name' && styles.inputWrapperFocused
                    ]}>
                      <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#64748B"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#64748B"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#64748B"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <View style={[
                      styles.inputWrapper,
                      focusedField === 'confirmPassword' && styles.inputWrapperFocused
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#64748B"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                {/* Primary Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#22C55E', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch Auth Mode */}
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                >
                  <Text style={styles.switchText}>
                    {isSignUp 
                      ? 'Already have an account? Sign in'
                      : 'Don\'t have an account? Sign up'
                    }
                  </Text>
                </TouchableOpacity>

                {/* Forgot Password */}
                {!isSignUp && (
                  <TouchableOpacity
                    style={styles.forgotButton}
                    onPress={handleForgotPassword}
                    disabled={loading}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                {/* Social Auth */}
                <View style={styles.socialContainer}>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialButtons}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialAuth('google')}
                      disabled={loading}
                    >
                      <Ionicons name="logo-google" size={24} color="#E6EAF0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialAuth('apple')}
                      disabled={loading}
                    >
                      <Ionicons name="logo-apple" size={24} color="#E6EAF0" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Trust Text */}
                <Text style={styles.trustText}>
                  🔒 Your data is encrypted and secure
                </Text>
              </Animated.View>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E6EAF0',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#E6EAF0',
    fontWeight: '500',
  },
  primaryButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  primaryButtonGradient: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  socialContainer: {
    marginTop: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '500',
  },
});

export default AuthFlow;
