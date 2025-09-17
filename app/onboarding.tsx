
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
import { commonStyles, colors } from '../styles/commonStyles';
import { storage } from '../utils/storage';
import { OnboardingData } from '../types';
import AuthSheet from '../components/AuthSheet';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

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

export default function Onboarding() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [step, setStep] = useState(0); // Start with step 0 for auth
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [followers, setFollowers] = useState(1000);
  const [goal, setGoal] = useState('');
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const { user, session, loading: authLoading } = useAuth();

  // Check if user should skip onboarding on component mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;
      
      try {
        setIsInitializing(true);
        
        // Check if user has completed onboarding and is logged in
        const onboardingData = await storage.getOnboardingData();
        console.log('Checking onboarding status:', {
          hasOnboardingData: !!onboardingData,
          hasSession: !!session,
          hasUser: !!user
        });
        
        // If user has completed onboarding and has a session, skip to main app
        if (onboardingData && (session || user)) {
          console.log('User has completed onboarding and is logged in, redirecting to main app');
          router.replace('/tabs/chat');
          return;
        }
        
        // If user has onboarding data but no session (guest mode), also skip to main app
        if (onboardingData) {
          console.log('User has completed onboarding in guest mode, redirecting to main app');
          router.replace('/tabs/chat');
          return;
        }
        
        // Otherwise, show the welcome screen (step 0)
        console.log('Showing welcome screen for new user');
        setStep(0);
        
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, show welcome screen
        setStep(0);
      } finally {
        setIsInitializing(false);
      }
    };

    checkOnboardingStatus();
  }, [authLoading, session, user]);

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const togglePlatform = (platform: string) => {
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

  const selectNiche = (niche: string) => {
    setSelectedNiche(niche);
    if (niche !== 'Other') {
      setCustomNiche('');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true; // Auth step always allows proceeding
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

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSignIn = () => {
    setShowAuthSheet(true);
  };

  const handleContinueAsGuest = () => {
    console.log('User chose to continue as guest');
    setStep(1); // Move to platform selection
  };

  const handleAuthSuccess = () => {
    console.log('Authentication successful');
    setShowAuthSheet(false);
    setStep(1); // Move to platform selection after successful auth
  };

  const handleComplete = async () => {
    try {
      const onboardingData: OnboardingData = {
        platforms: selectedPlatforms,
        niche: selectedNiche === 'Other' ? customNiche : selectedNiche,
        followers,
        goal,
      };

      await storage.saveOnboardingData(onboardingData);
      console.log('Onboarding data saved successfully:', onboardingData);
      
      // Navigate to tabs with replace to prevent going back to onboarding
      router.replace('/tabs/chat');
    } catch (error) {
      console.log('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  const renderStep0 = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ 
        width: 120, 
        height: 120, 
        borderRadius: 30, 
        backgroundColor: colors.accent, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 32,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
      }}>
        <Ionicons name="trending-up" size={60} color={colors.white} />
      </View>
      
      <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 16 }]}>
        Welcome to VIRALYZE
      </Text>
      <Text style={[commonStyles.smallText, { textAlign: 'center', marginBottom: 48, lineHeight: 20 }]}>
        Your AI growth coach for social media success.{'\n'}
        Let&apos;s get you set up in just a few steps.
      </Text>

      <View style={{ width: '100%', gap: 16 }}>
        <TouchableOpacity
          style={[commonStyles.button, { backgroundColor: colors.accent }]}
          onPress={handleSignIn}
        >
          <Text style={[commonStyles.buttonText, { color: colors.white }]}>
            SIGN IN / CREATE ACCOUNT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.secondaryButton]}
          onPress={handleContinueAsGuest}
        >
          <Text style={commonStyles.secondaryButtonText}>
            Continue as Guest
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[commonStyles.smallText, { 
        textAlign: 'center', 
        marginTop: 24, 
        opacity: 0.7,
        fontSize: 12,
        lineHeight: 16 
      }]}>
        Guest mode stores data locally only.{'\n'}
        Sign in to sync across devices.
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.title}>Which platforms do you create for?</Text>
      <Text style={commonStyles.smallText}>Select all that apply</Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 24 }}>
        {PLATFORMS.map(platform => (
          <TouchableOpacity
            key={platform}
            style={[
              commonStyles.chip,
              selectedPlatforms.includes(platform) && commonStyles.chipSelected,
            ]}
            onPress={() => togglePlatform(platform)}
          >
            <Text
              style={[
                commonStyles.chipText,
                selectedPlatforms.includes(platform) && commonStyles.chipTextSelected,
              ]}
            >
              {platform}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.title}>What&apos;s your niche?</Text>
      <Text style={commonStyles.smallText}>This helps us personalize your content</Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 24 }}>
        {NICHES.map(niche => (
          <TouchableOpacity
            key={niche}
            style={[
              commonStyles.chip,
              selectedNiche === niche && commonStyles.chipSelected,
            ]}
            onPress={() => selectNiche(niche)}
          >
            <Text
              style={[
                commonStyles.chipText,
                selectedNiche === niche && commonStyles.chipTextSelected,
              ]}
            >
              {niche}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedNiche === 'Other' && (
        <TextInput
          style={[commonStyles.input, { marginTop: 16 }]}
          placeholder="Enter your niche"
          placeholderTextColor={colors.grey}
          value={customNiche}
          onChangeText={setCustomNiche}
        />
      )}

      <View style={{ marginTop: 32 }}>
        <Text style={commonStyles.subtitle}>Current followers: {formatFollowers(followers)}</Text>
        <Slider
          style={{ width: '100%', height: 40, marginTop: 16 }}
          minimumValue={0}
          maximumValue={10000000}
          value={followers}
          onValueChange={setFollowers}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbStyle={{ backgroundColor: colors.accent }}
        />
        <View style={[commonStyles.row, commonStyles.spaceBetween, { marginTop: 8 }]}>
          <Text style={commonStyles.smallText}>0</Text>
          <Text style={commonStyles.smallText}>10M+</Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <Text style={commonStyles.title}>What&apos;s your main goal?</Text>
      <Text style={commonStyles.smallText}>Tell us what you want to achieve</Text>
      
      <TextInput
        style={[commonStyles.input, { marginTop: 24, height: 120, textAlignVertical: 'top' }]}
        placeholder="e.g., Grow to 100K followers, increase engagement, monetize my content..."
        placeholderTextColor={colors.grey}
        value={goal}
        onChangeText={setGoal}
        multiline
      />
    </View>
  );

  // Show loading screen while initializing
  if (isInitializing || authLoading) {
    return (
      <SafeAreaView style={[commonStyles.safeArea, commonStyles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[commonStyles.text, { marginTop: 16 }]}>
          Loading VIRALYZE...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 40, paddingBottom: 120 }}>
            {step > 0 && (
              <View style={[commonStyles.row, commonStyles.spaceBetween, { marginBottom: 32 }]}>
                <Text style={[commonStyles.text, { color: colors.accent }]}>
                  Step {step} of 3
                </Text>
                <View style={[commonStyles.row, { gap: 8 }]}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i <= step ? colors.accent : colors.border,
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </ScrollView>

        {step > 0 && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.background,
            padding: 16,
            paddingBottom: 32,
          }}>
            <View style={[commonStyles.row, { gap: 12 }]}>
              {step > 1 && (
                <TouchableOpacity
                  style={[commonStyles.secondaryButton, { flex: 1 }]}
                  onPress={() => setStep(step - 1)}
                >
                  <Text style={commonStyles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  commonStyles.button,
                  { flex: 1, opacity: canProceed() ? 1 : 0.5 },
                ]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={commonStyles.buttonText}>
                  {step === 3 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Auth Sheet */}
      <AuthSheet
        visible={showAuthSheet}
        onClose={() => setShowAuthSheet(false)}
        onContinueAsGuest={handleAuthSuccess}
      />
    </SafeAreaView>
  );
}
