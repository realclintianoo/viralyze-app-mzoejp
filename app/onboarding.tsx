
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { OnboardingData } from '../types';
import { storage } from '../utils/storage';
import { commonStyles, colors, animations } from '../styles/commonStyles';
import AuthSheet from '../components/AuthSheet';

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' as keyof typeof Ionicons.glyphMap },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' as keyof typeof Ionicons.glyphMap },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' as keyof typeof Ionicons.glyphMap },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' as keyof typeof Ionicons.glyphMap },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin' as keyof typeof Ionicons.glyphMap },
  { id: 'all', name: 'All Platforms', icon: 'globe-outline' as keyof typeof Ionicons.glyphMap },
];

const NICHES = [
  'Business & Finance', 'Health & Fitness', 'Technology', 'Lifestyle',
  'Education', 'Entertainment', 'Travel', 'Food & Cooking',
  'Fashion & Beauty', 'Gaming', 'Sports', 'Music',
  'Art & Design', 'Photography', 'Parenting', 'DIY & Crafts'
];

export default function Onboarding() {
  const { user, session, loading: authContextLoading } = useAuth();
  const { updateProfile } = usePersonalization();
  
  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [followers, setFollowers] = useState(1000);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [existingProfile, setExistingProfile] = useState<OnboardingData | null>(null);

  // Animation values
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(1);

  const animateStep = useCallback(() => {
    slideAnim.value = withSequence(
      withTiming(-50, { duration: 200 }),
      withTiming(0, { duration: 300 })
    );
    fadeAnim.value = withSequence(
      withTiming(0.3, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
  }, [slideAnim, fadeAnim]);

  useEffect(() => {
    if (step > 0) {
      animateStep();
    }
  }, [step, animateStep]);

  useEffect(() => {
    slideAnim.value = withTiming(0, { duration: 500 });
    fadeAnim.value = withTiming(1, { duration: 500 });
  }, [slideAnim, fadeAnim]);

  // Check for existing profile and auth state
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const profile = await storage.getProfile();
        if (profile) {
          setExistingProfile(profile);
          // If user has profile and is authenticated, redirect to main app
          if (user && session) {
            router.replace('/tabs/chat');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      }
    };

    if (!authContextLoading) {
      checkExistingData();
    }
  }, [session, user, authContextLoading, existingProfile]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateX: slideAnim.value }],
  }));

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const togglePlatform = (platform: string) => {
    if (platform === 'all') {
      setPlatforms(platforms.includes('all') ? [] : ['all']);
    } else {
      setPlatforms(prev => {
        const newPlatforms = prev.filter(p => p !== 'all');
        return prev.includes(platform)
          ? newPlatforms.filter(p => p !== platform)
          : [...newPlatforms, platform];
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectNiche = (selectedNiche: string) => {
    setNiche(selectedNiche);
    setCustomNiche('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return platforms.length > 0;
      case 2: return niche || customNiche.trim();
      case 3: return followers > 0;
      case 4: return goal.trim().length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      handleComplete();
    }
  };

  const handleSignIn = () => {
    setShowAuth(true);
  };

  const handleContinueAsGuest = async () => {
    await handleComplete();
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // After successful auth, complete onboarding
    setTimeout(() => {
      handleComplete();
    }, 500);
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      const profileData: OnboardingData = {
        platforms,
        niche: customNiche.trim() || niche,
        followers,
        goal: goal.trim(),
        completedAt: new Date().toISOString(),
      };

      // Save profile locally
      await storage.saveProfile(profileData);
      
      // Update personalization context
      updateProfile(profileData);

      // Show success animation
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to main app after a delay
      setTimeout(() => {
        router.replace('/tabs/chat');
      }, 2000);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep0 = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
      <View style={{ alignItems: 'center', marginBottom: 60 }}>
        <Text style={[commonStyles.headerTitle, { fontSize: 42, marginBottom: 16, textAlign: 'center' }]}>
          Welcome to{'\n'}
          <Text style={{ color: colors.neonTeal }}>VIRALYZE</Text>
        </Text>
        <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 8 }]}>
          Your AI Growth Coach
        </Text>
        <Text style={[commonStyles.textSmall, { textAlign: 'center', color: colors.textSecondary }]}>
          Let&apos;s personalize your experience in just a few steps
        </Text>
      </View>

      <TouchableOpacity
        style={[commonStyles.primaryButton, { marginBottom: 16 }]}
        onPress={() => setStep(1)}
      >
        <Text style={commonStyles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>

      {existingProfile && (
        <TouchableOpacity
          style={[commonStyles.secondaryButton]}
          onPress={() => router.replace('/tabs/chat')}
        >
          <Text style={commonStyles.secondaryButtonText}>Continue with Existing Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <Text style={[commonStyles.headerTitle, { marginBottom: 8 }]}>
        Which platforms do you create for?
      </Text>
      <Text style={[commonStyles.subtitle, { marginBottom: 32, color: colors.textSecondary }]}>
        Select all that apply
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {PLATFORMS.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={[
              commonStyles.chip,
              platforms.includes(platform.id) && commonStyles.chipSelected
            ]}
            onPress={() => togglePlatform(platform.id)}
          >
            <Ionicons 
              name={platform.icon} 
              size={20} 
              color={platforms.includes(platform.id) ? colors.background : colors.text} 
            />
            <Text style={[
              commonStyles.chipText,
              platforms.includes(platform.id) && commonStyles.chipTextSelected
            ]}>
              {platform.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <Text style={[commonStyles.headerTitle, { marginBottom: 8 }]}>
        What&apos;s your niche?
      </Text>
      <Text style={[commonStyles.subtitle, { marginBottom: 32, color: colors.textSecondary }]}>
        This helps us personalize your content
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {NICHES.map((nicheOption) => (
          <TouchableOpacity
            key={nicheOption}
            style={[
              commonStyles.chip,
              niche === nicheOption && commonStyles.chipSelected
            ]}
            onPress={() => selectNiche(nicheOption)}
          >
            <Text style={[
              commonStyles.chipText,
              niche === nicheOption && commonStyles.chipTextSelected
            ]}>
              {nicheOption}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[commonStyles.label, { marginBottom: 8 }]}>
        Or enter your own:
      </Text>
      <TextInput
        style={commonStyles.input}
        placeholder="e.g., Sustainable Living, Crypto Trading..."
        placeholderTextColor={colors.textSecondary}
        value={customNiche}
        onChangeText={setCustomNiche}
        onFocus={() => setNiche('')}
      />
    </ScrollView>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={[commonStyles.headerTitle, { marginBottom: 8 }]}>
        How many followers do you have?
      </Text>
      <Text style={[commonStyles.subtitle, { marginBottom: 32, color: colors.textSecondary }]}>
        Across all platforms combined
      </Text>

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={[commonStyles.headerTitle, { fontSize: 48, color: colors.neonTeal, marginBottom: 16 }]}>
          {formatFollowers(followers)}
        </Text>
        <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
          Followers
        </Text>
      </View>

      <Slider
        style={{ width: '100%', height: 40, marginBottom: 32 }}
        minimumValue={0}
        maximumValue={10000000}
        value={followers}
        onValueChange={setFollowers}
        minimumTrackTintColor={colors.neonTeal}
        maximumTrackTintColor={colors.backgroundSecondary}
        thumbStyle={{ backgroundColor: colors.neonTeal, width: 24, height: 24 }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        {[100, 1000, 10000, 100000, 1000000].map((value) => (
          <TouchableOpacity
            key={value}
            style={[commonStyles.chip, { flex: 1 }]}
            onPress={() => setFollowers(value)}
          >
            <Text style={[commonStyles.chipText, { fontSize: 12 }]}>
              {formatFollowers(value)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={[commonStyles.headerTitle, { marginBottom: 8 }]}>
        What&apos;s your main goal?
      </Text>
      <Text style={[commonStyles.subtitle, { marginBottom: 32, color: colors.textSecondary }]}>
        This helps us tailor our advice
      </Text>

      <TextInput
        style={[commonStyles.input, { height: 120, textAlignVertical: 'top' }]}
        placeholder="e.g., Grow my audience to 100K followers, monetize my content, build a personal brand..."
        placeholderTextColor={colors.textSecondary}
        value={goal}
        onChangeText={setGoal}
        multiline
        numberOfLines={4}
      />
    </View>
  );

  if (showConfetti) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />
        <Text style={[commonStyles.headerTitle, { textAlign: 'center', marginBottom: 16 }]}>
          🎉 Welcome to VIRALYZE!
        </Text>
        <Text style={[commonStyles.subtitle, { textAlign: 'center', color: colors.textSecondary }]}>
          Your personalized AI coach is ready
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary + '40', colors.background]}
        style={{ flex: 1 }}
      >
        {/* Header */}
        {step > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 0 }}>
            <TouchableOpacity
              onPress={() => setStep(Math.max(0, step - 1))}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, height: 4, backgroundColor: colors.backgroundSecondary, borderRadius: 2 }}>
              <View 
                style={{ 
                  width: `${(step / 4) * 100}%`, 
                  height: '100%', 
                  backgroundColor: colors.neonTeal, 
                  borderRadius: 2 
                }} 
              />
            </View>
            <Text style={[commonStyles.textSmall, { marginLeft: 16, color: colors.textSecondary }]}>
              {step}/4
            </Text>
          </View>
        )}

        {/* Content */}
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </Animated.View>

        {/* Footer */}
        {step > 0 && (
          <View style={{ padding: 24 }}>
            {step === 4 ? (
              <View>
                <TouchableOpacity
                  style={[commonStyles.primaryButton, { marginBottom: 16 }]}
                  onPress={handleSignIn}
                  disabled={!canProceed() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={commonStyles.primaryButtonText}>Sign In & Complete</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={commonStyles.secondaryButton}
                  onPress={handleContinueAsGuest}
                  disabled={!canProceed() || loading}
                >
                  <Text style={commonStyles.secondaryButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  commonStyles.primaryButton,
                  !canProceed() && { opacity: 0.5 }
                ]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={commonStyles.primaryButtonText}>
                  {step === 4 ? 'Complete Setup' : 'Continue'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Auth Sheet */}
        <AuthSheet
          visible={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
