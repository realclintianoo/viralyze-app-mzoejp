
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { commonStyles, colors } from '../styles/commonStyles';
import { storage } from '../utils/storage';
import { OnboardingData } from '../types';

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
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [followers, setFollowers] = useState(1000);
  const [goal, setGoal] = useState('');

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

  const handleComplete = async () => {
    try {
      const onboardingData: OnboardingData = {
        platforms: selectedPlatforms,
        niche: selectedNiche === 'Other' ? customNiche : selectedNiche,
        followers,
        goal,
      };

      await storage.saveOnboardingData(onboardingData);
      router.replace('/tabs');
    } catch (error) {
      console.log('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

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

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 40, paddingBottom: 120 }}>
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

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </ScrollView>

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
      </View>
    </SafeAreaView>
  );
}
