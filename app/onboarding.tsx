
import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
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
import { commonStyles, colors, animations } from '../styles/commonStyles';
import { storage } from '../utils/storage';
import { OnboardingData } from '../types';
import AuthSheet from '../components/AuthSheet';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const PLATFORMS = [
  'TikTok',
  'Instagram',
  'YouTube',
  'X (Twitter)',
  'LinkedIn',
  'All Platforms',
];

const NICHES = [
  'Business',
  'Lifestyle',
  'Tech',
  'Fitness',
  'Food',
  'Travel',
  'Fashion',
  'Education',
  'Entertainment',
  'Other',
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Onboarding() {
  console.log('🚀 Premium Onboarding component rendered');
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [followers, setFollowers] = useState(1000);
  const [goal, setGoal] = useState('');
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const { user, session, loading: authLoading } = useAuth();

  // Premium animation values
  const backgroundOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    // Premium entrance animations
    backgroundOpacity.value = withTiming(1, { duration: 800 });
    contentScale.value = withDelay(200, withSpring(1, animations.premiumStiffness));
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    headerScale.value = withDelay(400, withSpring(1, animations.bounceStiffness));
    headerOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(600, withSpring(1, animations.premiumStiffness));
    logoRotation.value = withDelay(600, withSpring(360, animations.gentleStiffness));
  }, []);

  useEffect(() => {
    console.log('Step changed to:', step);
    // Update progress animation
    const progress = step > 0 ? ((step - 1) / 3) * 100 : 0;
    progressWidth.value = withSpring(progress, animations.premiumStiffness);
  }, [step]);

  useEffect(() => {
    console.log('Auth sheet visibility changed to:', showAuthSheet);
  }, [showAuthSheet]);

  // Check if user should skip onboarding on component mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) {
        console.log('Auth still loading, waiting...');
        return;
      }
      
      try {
        setIsInitializing(true);
        console.log('Checking onboarding status...');
        
        const onboardingData = await storage.getOnboardingData();
        console.log('Checking onboarding status:', {
          hasOnboardingData: !!onboardingData,
          hasSession: !!session,
          hasUser: !!user
        });
        
        if (onboardingData && (session || user)) {
          console.log('User has completed onboarding and is logged in, redirecting to main app');
          router.replace('/tabs/chat');
          return;
        }
        
        if (onboardingData) {
          console.log('User has completed onboarding in guest mode, redirecting to main app');
          router.replace('/tabs/chat');
          return;
        }
        
        console.log('Showing welcome screen for new user');
        setStep(0);
        
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setStep(0);
      } finally {
        setIsInitializing(false);
      }
    };

    checkOnboardingStatus();
  }, [authLoading, session, user]);

  useEffect(() => {
    if (!authLoading && session && user && step === 0 && !showAuthSheet) {
      console.log('User authenticated successfully, moving to step 1');
      setTimeout(() => {
        setStep(1);
      }, 1000);
    }
  }, [session, user, authLoading, step, showAuthSheet]);

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const togglePlatform = async (platform: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (platform === 'All Platforms') {
      setSelectedPlatforms(['All Platforms']);
    } else {
      setSelectedPlatforms(prev => {
        const filtered = prev.filter(p => p !== 'All Platforms');
        if (filtered.includes(platform)) {
          return filtered.filter(p => p !== platform);
        } else {
          return [...filtered, platform];
        }
      });
    }
  };

  const selectNiche = async (niche: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNiche(niche);
    if (niche !== 'Other') {
      setCustomNiche('');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return selectedPlatforms.length > 0;
      case 2:
        return selectedNiche && (selectedNiche !== 'Other' || customNiche.trim());
      case 3:
        return goal.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log(`Moving from step ${step} to step ${step + 1}`);
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Opening auth sheet for sign in');
    setShowAuthSheet(true);
  };

  const handleContinueAsGuest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('User chose to continue as guest, moving to step 1');
    setStep(1);
  };

  const handleAuthSuccess = () => {
    console.log('Authentication successful, closing auth sheet');
    setShowAuthSheet(false);
  };

  const handleComplete = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      console.log('Completing onboarding with data:', {
        platforms: selectedPlatforms,
        niche: selectedNiche === 'Other' ? customNiche : selectedNiche,
        followers,
        goal,
      });

      const onboardingData: OnboardingData = {
        platforms: selectedPlatforms,
        niche: selectedNiche === 'Other' ? customNiche : selectedNiche,
        followers,
        goal,
      };

      await storage.saveOnboardingData(onboardingData);
      console.log('Onboarding data saved successfully, navigating to main app');
      
      router.replace('/tabs/chat');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  // Premium animated styles
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const renderStep0 = () => (
    <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, contentAnimatedStyle]}>
      {/* Premium Logo */}
      <Animated.View style={[logoAnimatedStyle, { marginBottom: 40 }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.glowTeal,
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.8,
            shadowRadius: 32,
            elevation: 24,
          }}
        >
          <Ionicons name="trending-up" size={70} color={colors.white} />
        </LinearGradient>
      </Animated.View>
      
      <Animated.View style={[headerAnimatedStyle, { alignItems: 'center', marginBottom: 48 }]}>
        <Text style={[commonStyles.headerTitle, { textAlign: 'center', marginBottom: 16 }]}>
          Welcome to VIRALYZE
        </Text>
        <Text style={[commonStyles.textSmall, { 
          textAlign: 'center', 
          lineHeight: 22, 
          maxWidth: 280,
          opacity: 0.9,
          fontSize: 15,
        }]}>
          Your AI growth coach for social media success.{'\n'}
          Let&apos;s get you set up in just a few steps.
        </Text>
      </Animated.View>

      <View style={{ width: '100%', gap: 20 }}>
        <AnimatedTouchableOpacity
          onPress={handleSignIn}
          style={{ borderRadius: 24, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              commonStyles.premiumButton,
              {
                margin: 0,
                shadowColor: colors.glowTeal,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.8,
                shadowRadius: 24,
                elevation: 20,
              }
            ]}
          >
            <Text style={[commonStyles.buttonText, { color: colors.white, fontSize: 17 }]}>
              SIGN IN / CREATE ACCOUNT
            </Text>
          </LinearGradient>
        </AnimatedTouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.secondaryButton, { 
            backgroundColor: colors.glassBackgroundUltra,
            borderColor: colors.glassBorderUltra,
            borderWidth: 2,
          }]}
          onPress={handleContinueAsGuest}
        >
          <Text style={[commonStyles.secondaryButtonText, { fontSize: 16 }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[commonStyles.textSmall, { 
        textAlign: 'center', 
        marginTop: 32, 
        opacity: 0.6,
        fontSize: 13,
        lineHeight: 18,
        maxWidth: 260,
      }]}>
        Guest mode stores data locally only.{'\n'}
        Sign in to sync across devices.
      </Text>
    </Animated.View>
  );

  const renderStep1 = () => (
    <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
      <Text style={[commonStyles.title, { marginBottom: 8 }]}>
        Which platforms do you create for?
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, opacity: 0.8 }]}>
        Select all that apply
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {PLATFORMS.map((platform, index) => (
          <AnimatedTouchableOpacity
            key={platform}
            onPress={() => togglePlatform(platform)}
            style={{ borderRadius: 32, overflow: 'hidden' }}
          >
            {selectedPlatforms.includes(platform) ? (
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  commonStyles.chip,
                  {
                    margin: 0,
                    backgroundColor: 'transparent',
                    shadowColor: colors.glowTeal,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 12,
                  }
                ]}
              >
                <Text style={[commonStyles.chipTextSelected, { fontSize: 15 }]}>
                  {platform}
                </Text>
              </LinearGradient>
            ) : (
              <BlurView intensity={20} style={[commonStyles.chip, { margin: 0, backgroundColor: 'transparent' }]}>
                <Text style={[commonStyles.chipText, { fontSize: 15 }]}>
                  {platform}
                </Text>
              </BlurView>
            )}
          </AnimatedTouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
      <Text style={[commonStyles.title, { marginBottom: 8 }]}>
        What&apos;s your niche?
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, opacity: 0.8 }]}>
        This helps us personalize your content
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {NICHES.map((niche, index) => (
          <AnimatedTouchableOpacity
            key={niche}
            onPress={() => selectNiche(niche)}
            style={{ borderRadius: 32, overflow: 'hidden' }}
          >
            {selectedNiche === niche ? (
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  commonStyles.chip,
                  {
                    margin: 0,
                    backgroundColor: 'transparent',
                    shadowColor: colors.glowTeal,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 12,
                  }
                ]}
              >
                <Text style={[commonStyles.chipTextSelected, { fontSize: 15 }]}>
                  {niche}
                </Text>
              </LinearGradient>
            ) : (
              <BlurView intensity={20} style={[commonStyles.chip, { margin: 0, backgroundColor: 'transparent' }]}>
                <Text style={[commonStyles.chipText, { fontSize: 15 }]}>
                  {niche}
                </Text>
              </BlurView>
            )}
          </AnimatedTouchableOpacity>
        ))}
      </View>

      {selectedNiche === 'Other' && (
        <BlurView intensity={20} style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 32 }}>
          <TextInput
            style={[commonStyles.premiumInput, { margin: 0, backgroundColor: 'transparent' }]}
            placeholder="Enter your niche"
            placeholderTextColor={colors.textSecondary}
            value={customNiche}
            onChangeText={setCustomNiche}
          />
        </BlurView>
      )}

      <BlurView intensity={20} style={{ borderRadius: 24, overflow: 'hidden', padding: 24 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 20, fontSize: 20 }]}>
          Current followers: {formatFollowers(followers)}
        </Text>
        
        <Slider
          style={{ width: '100%', height: 50, marginBottom: 16 }}
          minimumValue={0}
          maximumValue={10000000}
          value={followers}
          onValueChange={(value) => {
            setFollowers(Math.round(value));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          minimumTrackTintColor={colors.gradientStart}
          maximumTrackTintColor={colors.border}
          thumbStyle={{ 
            backgroundColor: colors.gradientEnd,
            width: 28,
            height: 28,
            shadowColor: colors.glowTeal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 8,
          }}
        />
        
        <View style={[commonStyles.row, commonStyles.spaceBetween]}>
          <Text style={[commonStyles.textSmall, { opacity: 0.7 }]}>0</Text>
          <Text style={[commonStyles.textSmall, { opacity: 0.7 }]}>10M+</Text>
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
      <Text style={[commonStyles.title, { marginBottom: 8 }]}>
        What&apos;s your main goal?
      </Text>
      <Text style={[commonStyles.textSmall, { marginBottom: 32, opacity: 0.8 }]}>
        Tell us what you want to achieve
      </Text>
      
      <BlurView intensity={20} style={{ borderRadius: 24, overflow: 'hidden' }}>
        <TextInput
          style={[
            commonStyles.premiumInput, 
            { 
              margin: 0, 
              backgroundColor: 'transparent',
              height: 140, 
              textAlignVertical: 'top',
              paddingTop: 24,
            }
          ]}
          placeholder="e.g., Grow to 100K followers, increase engagement, monetize my content..."
          placeholderTextColor={colors.textSecondary}
          value={goal}
          onChangeText={setGoal}
          multiline
        />
      </BlurView>
    </Animated.View>
  );

  // Show premium loading screen while initializing
  if (isInitializing || authLoading) {
    console.log('Showing loading screen - isInitializing:', isInitializing, 'authLoading:', authLoading);
    return (
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={[logoAnimatedStyle, { marginBottom: 32 }]}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.glowTeal,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.6,
                shadowRadius: 24,
                elevation: 16,
              }}
            >
              <Ionicons name="trending-up" size={50} color={colors.white} />
            </LinearGradient>
          </Animated.View>
          
          <ActivityIndicator size="large" color={colors.gradientEnd} style={{ marginBottom: 16 }} />
          <Text style={[commonStyles.text, { fontSize: 18, opacity: 0.8 }]}>
            Loading VIRALYZE...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  console.log('Rendering premium onboarding step:', step);

  return (
    <Animated.View style={[{ flex: 1 }, backgroundAnimatedStyle]}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingTop: 40, paddingBottom: 140 }}>
              {step > 0 && (
                <Animated.View style={[headerAnimatedStyle]}>
                  <BlurView intensity={20} style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 40 }}>
                    <View style={{ padding: 20 }}>
                      <View style={[commonStyles.row, commonStyles.spaceBetween, { marginBottom: 16 }]}>
                        <Text style={[commonStyles.text, { color: colors.gradientEnd, fontWeight: '700', fontSize: 16 }]}>
                          Step {step} of 3
                        </Text>
                        <View style={[commonStyles.row, { gap: 8 }]}>
                          {[1, 2, 3].map(i => (
                            <View
                              key={i}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: i <= step ? colors.gradientEnd : colors.border,
                                shadowColor: i <= step ? colors.glowTeal : 'transparent',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.6,
                                shadowRadius: 6,
                                elevation: i <= step ? 6 : 0,
                              }}
                            />
                          ))}
                        </View>
                      </View>
                      
                      {/* Premium Progress Bar */}
                      <View
                        style={{
                          height: 6,
                          backgroundColor: colors.border,
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <Animated.View
                          style={[
                            {
                              height: '100%',
                              borderRadius: 3,
                            },
                            progressAnimatedStyle,
                          ]}
                        >
                          <LinearGradient
                            colors={[colors.gradientStart, colors.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              height: '100%',
                              width: '100%',
                              shadowColor: colors.glowTeal,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.6,
                              shadowRadius: 6,
                              elevation: 6,
                            }}
                          />
                        </Animated.View>
                      </View>
                    </View>
                  </BlurView>
                </Animated.View>
              )}

              {step === 0 && renderStep0()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </View>
          </ScrollView>

          {step > 0 && (
            <BlurView intensity={25} style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 40,
            }}>
              <View style={[commonStyles.row, { gap: 16 }]}>
                {step > 1 && (
                  <TouchableOpacity
                    style={[commonStyles.secondaryButton, { 
                      flex: 1,
                      backgroundColor: colors.glassBackgroundUltra,
                      borderColor: colors.glassBorderUltra,
                      borderWidth: 2,
                    }]}
                    onPress={() => setStep(step - 1)}
                  >
                    <Text style={[commonStyles.secondaryButtonText, { fontSize: 16 }]}>
                      Back
                    </Text>
                  </TouchableOpacity>
                )}
                
                <AnimatedTouchableOpacity
                  style={[
                    { flex: 1, borderRadius: 24, overflow: 'hidden' },
                    { opacity: canProceed() ? 1 : 0.5 },
                  ]}
                  onPress={handleNext}
                  disabled={!canProceed()}
                >
                  <LinearGradient
                    colors={canProceed() 
                      ? [colors.gradientStart, colors.gradientEnd]
                      : [colors.textSecondary, colors.textSecondary]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      commonStyles.premiumButton,
                      {
                        margin: 0,
                        shadowColor: canProceed() ? colors.glowTeal : 'transparent',
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.6,
                        shadowRadius: 20,
                        elevation: canProceed() ? 16 : 0,
                      }
                    ]}
                  >
                    <Text style={[commonStyles.buttonText, { color: colors.white, fontSize: 16 }]}>
                      {step === 3 ? 'Get Started' : 'Next'}
                    </Text>
                  </LinearGradient>
                </AnimatedTouchableOpacity>
              </View>
            </BlurView>
          )}
        </SafeAreaView>

        {/* Auth Sheet */}
        <AuthSheet
          visible={showAuthSheet}
          onClose={() => {
            console.log('Auth sheet closed');
            setShowAuthSheet(false);
          }}
          onContinueAsGuest={handleAuthSuccess}
        />
      </LinearGradient>
    </Animated.View>
  );
}
