
import AuthSheet from '../components/AuthSheet';
import Slider from '@react-native-community/slider';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors, animations } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../utils/storage';
import React, { useState, useEffect, useCallback } from 'react';
import { usePersonalization } from '../contexts/PersonalizationContext';
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
import { OnboardingData } from '../types';
import { router } from 'expo-router';

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' as const },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' as const },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' as const },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' as const },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin' as const },
  { id: 'all', name: 'All Platforms', icon: 'globe' as const },
];

const NICHES = [
  'Fitness & Health',
  'Technology',
  'Fashion & Beauty',
  'Music & Entertainment',
  'Food & Cooking',
  'Travel & Lifestyle',
  'Gaming',
  'Business & Finance',
  'Education',
  'Art & Design',
];

export default function Onboarding() {
  console.log('🎯 Onboarding screen rendered');
  
  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [followers, setFollowers] = useState(1000);
  const [goal, setGoal] = useState('');
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [existingProfile, setExistingProfile] = useState<OnboardingData | null>(null);
  
  const { session, user, loading: authContextLoading } = useAuth();
  const { updatePersonalization } = usePersonalization();
  
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  // Check for existing profile on mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const profile = await storage.getOnboardingData();
        if (profile) {
          console.log('🎯 Found existing profile, redirecting to main app');
          setExistingProfile(profile);
          updatePersonalization(profile);
          router.replace('/tabs');
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      }
    };
    
    checkExistingProfile();
  }, [updatePersonalization]);

  // Handle auth state changes
  useEffect(() => {
    console.log('🎯 Auth state changed:', { session: !!session, user: !!user, loading: authContextLoading });
    
    if (session && user && !authContextLoading && !existingProfile) {
      console.log('🎯 User authenticated, checking for existing profile');
      // User is authenticated, we can proceed with onboarding or check for existing data
    }
  }, [session, user, authContextLoading, existingProfile]);

  // Animation effect for step changes
  useEffect(() => {
    slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    fadeAnim.value = withTiming(1, { duration: 300 });
  }, [step, slideAnim, fadeAnim]);

  const formatFollowers = useCallback((value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }, []);

  const togglePlatform = useCallback((platform: string) => {
    console.log('🎯 Toggling platform:', platform);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (platform === 'all') {
      setPlatforms(prev => prev.includes('all') ? [] : ['all']);
    } else {
      setPlatforms(prev => {
        const newPlatforms = prev.includes(platform)
          ? prev.filter(p => p !== platform && p !== 'all')
          : [...prev.filter(p => p !== 'all'), platform];
        return newPlatforms;
      });
    }
  }, []);

  const selectNiche = useCallback((selectedNiche: string) => {
    console.log('🎯 Selecting niche:', selectedNiche);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNiche(selectedNiche);
    setCustomNiche('');
  }, []);

  const canProceed = useCallback(() => {
    switch (step) {
      case 0: return true; // Welcome step
      case 1: return platforms.length > 0;
      case 2: return niche || customNiche;
      case 3: return goal.trim().length > 0;
      default: return false;
    }
  }, [step, platforms.length, niche, customNiche, goal]);

  const handleNext = useCallback(() => {
    console.log('🎯 Next button pressed, current step:', step);
    
    if (!canProceed()) {
      console.log('🎯 Cannot proceed from current step');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (step < 3) {
      slideAnim.value = withSequence(
        withTiming(-50, { duration: 150 }),
        withTiming(50, { duration: 0 }),
        withTiming(0, { duration: 150 })
      );
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }, [step, canProceed, slideAnim, handleComplete]);

  const handleSignIn = useCallback(() => {
    console.log('🎯 Sign in button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAuthSheet(true);
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    console.log('🎯 Continue as guest pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    console.log('🎯 Auth success, closing sheet and proceeding');
    setShowAuthSheet(false);
    setStep(1);
  }, []);

  const handleComplete = useCallback(async () => {
    console.log('🎯 Completing onboarding...');
    
    try {
      const finalNiche = customNiche || niche;
      const onboardingData: OnboardingData = {
        platforms,
        niche: finalNiche,
        followers,
        goal,
        completedAt: new Date().toISOString(),
      };

      console.log('🎯 Saving onboarding data:', onboardingData);
      
      // Save to local storage
      await storage.saveOnboardingData(onboardingData);
      
      // Update personalization context
      updatePersonalization(onboardingData);
      
      // Show success animation
      setShowConfetti(true);
      
      // Navigate to main app after a short delay
      setTimeout(() => {
        console.log('🎯 Navigating to main app');
        router.replace('/tabs');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    }
  }, [platforms, niche, customNiche, followers, goal, updatePersonalization]);

  const renderStep0 = () => (
    <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
      <View style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.glassBackgroundStrong,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 2,
        borderColor: colors.accent,
      }}>
        <Text style={{ fontSize: 48 }}>🚀</Text>
      </View>
      
      <Text style={[commonStyles.title, { fontSize: 32, marginBottom: 16, textAlign: 'center' }]}>
        Welcome to VIRALYZE
      </Text>
      
      <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 40, lineHeight: 24 }]}>
        Your AI-powered growth coach for social media success. Let&apos;s personalize your experience in just a few steps.
      </Text>
      
      <TouchableOpacity
        style={[commonStyles.primaryButton, { marginBottom: 16 }]}
        onPress={handleSignIn}
      >
        <Text style={commonStyles.primaryButtonText}>Sign In / Sign Up</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={commonStyles.secondaryButton}
        onPress={handleContinueAsGuest}
      >
        <Text style={commonStyles.secondaryButtonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={[commonStyles.title, { marginBottom: 8, textAlign: 'center' }]}>
        Which platforms do you create for?
      </Text>
      <Text style={[commonStyles.textSmall, { textAlign: 'center', marginBottom: 32, color: colors.textSecondary }]}>
        Select all that apply to get personalized content suggestions
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {PLATFORMS.map((platform, index) => (
          <TouchableOpacity
            key={platform.id}
            style={[
              commonStyles.chip,
              platforms.includes(platform.id) && commonStyles.chipSelected,
              { margin: 8, minWidth: 120 }
            ]}
            onPress={() => togglePlatform(platform.id)}
          >
            <Ionicons 
              name={platform.icon} 
              size={20} 
              color={platforms.includes(platform.id) ? colors.white : colors.accent}
              style={{ marginRight: 8 }}
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
    </View>
  );

  const renderStep2 = () => (
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={[commonStyles.title, { marginBottom: 8, textAlign: 'center' }]}>
        What&apos;s your niche?
      </Text>
      <Text style={[commonStyles.textSmall, { textAlign: 'center', marginBottom: 32, color: colors.textSecondary }]}>
        This helps us tailor content suggestions to your audience
      </Text>
      
      <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {NICHES.map((nicheOption, index) => (
            <TouchableOpacity
              key={nicheOption}
              style={[
                commonStyles.chip,
                niche === nicheOption && commonStyles.chipSelected,
                { margin: 4 }
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
      </ScrollView>
      
      <TextInput
        style={[commonStyles.input, { marginTop: 16 }]}
        placeholder="Or enter your own niche..."
        placeholderTextColor={colors.textSecondary}
        value={customNiche}
        onChangeText={setCustomNiche}
        onFocus={() => setNiche('')}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={[commonStyles.title, { marginBottom: 8, textAlign: 'center' }]}>
        What&apos;s your main goal?
      </Text>
      <Text style={[commonStyles.textSmall, { textAlign: 'center', marginBottom: 32, color: colors.textSecondary }]}>
        Tell us what you want to achieve with your content
      </Text>
      
      <TextInput
        style={[commonStyles.input, { height: 120, textAlignVertical: 'top' }]}
        placeholder="e.g., Grow my following to 100K, increase engagement, monetize my content..."
        placeholderTextColor={colors.textSecondary}
        value={goal}
        onChangeText={setGoal}
        multiline
        numberOfLines={4}
      />
      
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Text style={[commonStyles.textSmall, { color: colors.textSecondary, marginBottom: 16 }]}>
          Current followers: {formatFollowers(followers)}
        </Text>
        
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={10000000}
          value={followers}
          onValueChange={setFollowers}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.glassBackgroundStrong}
          thumbStyle={{ backgroundColor: colors.accent }}
        />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
          <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>0</Text>
          <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>10M+</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{ x: -10, y: 0 }}
            fadeOut={true}
          />
        )}
        
        {/* Progress Bar */}
        {step > 0 && (
          <View style={{
            height: 4,
            backgroundColor: colors.glassBackgroundStrong,
            marginHorizontal: 20,
            marginTop: 20,
            borderRadius: 2,
          }}>
            <View style={{
              height: '100%',
              backgroundColor: colors.accent,
              width: `${(step / 3) * 100}%`,
              borderRadius: 2,
            }} />
          </View>
        )}
        
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center',
            paddingVertical: 40 
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={animatedStyle}>
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </Animated.View>
        </ScrollView>
        
        {/* Navigation */}
        {step > 0 && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}>
            <TouchableOpacity
              style={[commonStyles.secondaryButton, { flex: 0.4 }]}
              onPress={() => setStep(Math.max(0, step - 1))}
            >
              <Text style={commonStyles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                commonStyles.primaryButton,
                { flex: 0.4 },
                !canProceed() && { opacity: 0.5 }
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={commonStyles.primaryButtonText}>
                {step === 3 ? 'Complete' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <AuthSheet
          visible={showAuthSheet}
          onClose={() => setShowAuthSheet(false)}
          onSuccess={handleAuthSuccess}
        />
      </View>
    </SafeAreaView>
  );
}
