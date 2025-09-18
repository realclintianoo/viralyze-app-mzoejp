
import Slider from '@react-native-community/slider';
import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../utils/storage';
import { router } from 'expo-router';
import { OnboardingData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, animations } from '../styles/commonStyles';
import AuthSheet from '../components/AuthSheet';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
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
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin' },
  { id: 'all', name: 'All Platforms', icon: 'apps' },
];

const NICHES = [
  'Fitness', 'Tech', 'Fashion', 'Music', 'Food', 'Beauty', 
  'Travel', 'Gaming', 'Business', 'Lifestyle', 'Education', 'Comedy'
];

export default function Onboarding() {
  console.log('🎯 Onboarding component rendered');
  
  const [step, setStep] = useState(0);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [followers, setFollowers] = useState(0);
  const [goal, setGoal] = useState('');
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const { session, user, loading: authContextLoading } = useAuth();
  const { updateProfile, profile: existingProfile } = usePersonalization();
  
  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  // Check if user has existing profile and is returning
  useEffect(() => {
    const checkExistingUser = async () => {
      if (session && user) {
        console.log('🔍 Checking for existing user profile...');
        
        // Check if user has completed onboarding before
        const hasExistingProfile = !!existingProfile;
        setIsExistingUser(hasExistingProfile);
        
        if (hasExistingProfile) {
          console.log('👤 Existing user detected, pre-filling onboarding with current data');
          // Pre-fill with existing data for re-onboarding
          setPlatforms(existingProfile.platforms || []);
          setNiche(existingProfile.niche || '');
          setFollowers(existingProfile.followers || 0);
          setGoal(existingProfile.goal || '');
        }
      }
    };

    if (!authContextLoading) {
      checkExistingUser();
    }
  }, [session, user, authContextLoading, existingProfile]);

  useEffect(() => {
    // Animate step content
    slideAnim.value = withTiming(0, { duration: animations.normal });
    fadeAnim.value = withTiming(1, { duration: animations.normal });
  }, [step]);

  useEffect(() => {
    // Initial animation
    slideAnim.value = withSpring(0, animations.spring);
    fadeAnim.value = withTiming(1, { duration: animations.slow });
  }, []);

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const togglePlatform = (platform: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const selectNiche = (selectedNiche: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNiche(selectedNiche);
    setCustomNiche('');
  };

  const canProceed = () => {
    switch (step) {
      case 0: return platforms.length > 0;
      case 1: return niche || customNiche;
      case 2: return true; // Followers can be 0
      case 3: return goal.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (step < 3) {
      slideAnim.value = withSequence(
        withTiming(-50, { duration: animations.fast }),
        withTiming(0, { duration: animations.normal })
      );
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSignIn = () => {
    setShowAuthSheet(true);
  };

  const handleContinueAsGuest = () => {
    console.log('👤 Continuing as guest');
    handleComplete();
  };

  const handleAuthSuccess = () => {
    setShowAuthSheet(false);
    // Continue with onboarding after successful auth
  };

  const handleComplete = async () => {
    try {
      console.log('✅ Completing onboarding...');
      
      const finalNiche = customNiche || niche;
      const onboardingData: OnboardingData = {
        platforms,
        niche: finalNiche,
        followers,
        goal,
      };

      console.log('💾 Saving onboarding data:', onboardingData);
      
      // Save to local storage
      await storage.saveOnboardingData(onboardingData);
      
      // Update personalization context
      await updateProfile(onboardingData);
      
      // Show confetti animation
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to main app after a short delay
      setTimeout(() => {
        console.log('🎉 Onboarding complete, navigating to main app');
        router.replace('/tabs/chat');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    }
  };

  if (authContextLoading) {
    return (
      <View style={[commonStyles.container, commonStyles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[commonStyles.text, { marginTop: 16 }]}>
          Loading...
        </Text>
      </View>
    );
  }

  const renderStep0 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.headerTitle}>
        {isExistingUser ? 'Update Your Platforms' : 'Choose Your Platforms'}
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, textAlign: 'center' }]}>
        {isExistingUser 
          ? 'Let\'s make sure your platform preferences are up to date'
          : 'Where do you create content? Select all that apply.'
        }
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {PLATFORMS.map((platform, index) => (
          <TouchableOpacity
            key={platform.id}
            style={[
              commonStyles.chip,
              platforms.includes(platform.id) && commonStyles.chipSelected,
              { margin: 8 }
            ]}
            onPress={() => togglePlatform(platform.id)}
          >
            <View style={[commonStyles.row, { alignItems: 'center' }]}>
              <Ionicons 
                name={platform.icon as any} 
                size={20} 
                color={platforms.includes(platform.id) ? colors.white : colors.text} 
                style={{ marginRight: 8 }}
              />
              <Text style={[
                commonStyles.chipText,
                platforms.includes(platform.id) && commonStyles.chipTextSelected
              ]}>
                {platform.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.headerTitle}>
        {isExistingUser ? 'Update Your Niche' : 'What\'s Your Niche?'}
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, textAlign: 'center' }]}>
        {isExistingUser 
          ? 'Has your content focus changed? Update your niche below.'
          : 'This helps us personalize your content suggestions.'
        }
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
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
      
      <Text style={[commonStyles.textSmall, { marginBottom: 12, textAlign: 'center' }]}>
        Or enter your own:
      </Text>
      <TextInput
        style={commonStyles.premiumInput}
        placeholder="Enter your niche..."
        placeholderTextColor={colors.textSecondary}
        value={customNiche}
        onChangeText={setCustomNiche}
        onFocus={() => setNiche('')}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.headerTitle}>
        {isExistingUser ? 'Update Follower Count' : 'How Many Followers?'}
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, textAlign: 'center' }]}>
        {isExistingUser 
          ? 'Let\'s update your current follower count across all platforms.'
          : 'This helps us tailor advice to your audience size.'
        }
      </Text>
      
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={[commonStyles.title, { fontSize: 48, marginBottom: 16 }]}>
          {formatFollowers(followers)}
        </Text>
        <Text style={commonStyles.textSmall}>Followers</Text>
      </View>
      
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={10000000}
        value={followers}
        onValueChange={setFollowers}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.backgroundSecondary}
        thumbStyle={{ backgroundColor: colors.accent, width: 24, height: 24 }}
      />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        <Text style={commonStyles.textSmall}>0</Text>
        <Text style={commonStyles.textSmall}>10M+</Text>
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
        {[100, 1000, 10000, 100000, 1000000].map(count => (
          <TouchableOpacity
            key={count}
            style={[commonStyles.chip, { margin: 4 }]}
            onPress={() => setFollowers(count)}
          >
            <Text style={commonStyles.chipText}>{formatFollowers(count)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.headerTitle}>
        {isExistingUser ? 'Update Your Goal' : 'What\'s Your Goal?'}
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, textAlign: 'center' }]}>
        {isExistingUser 
          ? 'Have your goals evolved? Let us know what you\'re focusing on now.'
          : 'What do you want to achieve with your content?'
        }
      </Text>
      
      <TextInput
        style={[commonStyles.premiumInput, { height: 120, textAlignVertical: 'top' }]}
        placeholder="e.g., Grow to 100K followers, monetize my content, build a personal brand..."
        placeholderTextColor={colors.textSecondary}
        value={goal}
        onChangeText={setGoal}
        multiline
        numberOfLines={4}
      />
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
        {[
          'Grow my audience',
          'Monetize my content',
          'Build my brand',
          'Go viral',
          'Become an influencer',
          'Start a business'
        ].map(goalOption => (
          <TouchableOpacity
            key={goalOption}
            style={[commonStyles.chip, { margin: 4 }]}
            onPress={() => setGoal(goalOption)}
          >
            <Text style={commonStyles.chipText}>{goalOption}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={commonStyles.container}
      >
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{ x: -10, y: 0 }}
            fadeOut={true}
            explosionSpeed={350}
            fallSpeed={3000}
          />
        )}
        
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingHorizontal: 24, 
            paddingVertical: 40,
            justifyContent: 'center'
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[{ flex: 1, justifyContent: 'center' }, animatedStyle]}>
            {/* Progress indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 40 }}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: index <= step ? colors.accent : colors.backgroundTertiary,
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>

            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation buttons */}
            <View style={{ marginTop: 40 }}>
              {step < 3 ? (
                <TouchableOpacity
                  style={[
                    commonStyles.premiumButton,
                    !canProceed() && { opacity: 0.5 },
                  ]}
                  onPress={handleNext}
                  disabled={!canProceed()}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={[commonStyles.premiumButton, { margin: 0 }]}
                  >
                    <Text style={commonStyles.buttonText}>
                      Continue
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View>
                  {!session ? (
                    <View>
                      <TouchableOpacity
                        style={[commonStyles.premiumButton, { marginBottom: 16 }]}
                        onPress={handleSignIn}
                      >
                        <LinearGradient
                          colors={[colors.gradientStart, colors.gradientEnd]}
                          style={[commonStyles.premiumButton, { margin: 0 }]}
                        >
                          <Text style={commonStyles.buttonText}>
                            Sign In to Save Progress
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={commonStyles.secondaryButton}
                        onPress={handleContinueAsGuest}
                      >
                        <Text style={commonStyles.secondaryButtonText}>
                          Continue as Guest
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        commonStyles.premiumButton,
                        !canProceed() && { opacity: 0.5 },
                      ]}
                      onPress={handleComplete}
                      disabled={!canProceed()}
                    >
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        style={[commonStyles.premiumButton, { margin: 0 }]}
                      >
                        <Text style={commonStyles.buttonText}>
                          {isExistingUser ? 'Update Profile' : 'Complete Setup'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>

        <AuthSheet
          visible={showAuthSheet}
          onClose={() => setShowAuthSheet(false)}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
