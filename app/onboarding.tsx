
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
import { LinearGradient } from 'expo-linear-gradient';

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
      <Text style={styles.title}>Which platforms do you create for?</Text>
      <Text style={styles.subtitle}>Select all that apply</Text>
      
      <View style={styles.chipsContainer}>
        {PLATFORMS.map(platform => (
          <TouchableOpacity
            key={platform}
            style={[
              styles.chip,
              selectedPlatforms.includes(platform) && styles.chipSelected,
            ]}
            onPress={() => togglePlatform(platform)}
          >
            <Text
              style={[
                styles.chipText,
                selectedPlatforms.includes(platform) && styles.chipTextSelected,
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
      <Text style={styles.title}>What&apos;s your niche?</Text>
      <Text style={styles.subtitle}>This helps us personalize your content</Text>
      
      <View style={styles.chipsContainer}>
        {NICHES.map(niche => (
          <TouchableOpacity
            key={niche}
            style={[
              styles.chip,
              selectedNiche === niche && styles.chipSelected,
            ]}
            onPress={() => selectNiche(niche)}
          >
            <Text
              style={[
                styles.chipText,
                selectedNiche === niche && styles.chipTextSelected,
              ]}
            >
              {niche}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedNiche === 'Other' && (
        <TextInput
          style={styles.input}
          placeholder="Enter your niche"
          placeholderTextColor={colors.textSecondary}
          value={customNiche}
          onChangeText={setCustomNiche}
        />
      )}

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderTitle}>Current followers: {formatFollowers(followers)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={10000000}
          value={followers}
          onValueChange={setFollowers}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbStyle={{ backgroundColor: colors.primary }}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0</Text>
          <Text style={styles.sliderLabel}>10M+</Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>What&apos;s your main goal?</Text>
      <Text style={styles.subtitle}>Tell us what you want to achieve</Text>
      
      <TextInput
        style={styles.textArea}
        placeholder="e.g., Grow to 100K followers, increase engagement, monetize my content..."
        placeholderTextColor={colors.textSecondary}
        value={goal}
        onChangeText={setGoal}
        multiline
      />
    </View>
  );

  return (
    <LinearGradient
      colors={['#000000', '#0F172A', '#134E4A']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.innerContent}>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Step {step} of 3
                </Text>
                <View style={styles.progressDots}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.progressDot,
                        { backgroundColor: i <= step ? colors.primary : 'rgba(255, 255, 255, 0.2)' }
                      ]}
                    />
                  ))}
                </View>
              </View>

              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <View style={styles.buttonRow}>
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setStep(step - 1)}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { opacity: canProceed() ? 1 : 0.5 },
                ]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <LinearGradient
                  colors={['#22C55E', '#10B981']}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    {step === 3 ? 'Get Started' : 'Next'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  innerContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E6EAF0',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
  },
  chipText: {
    fontSize: 14,
    color: '#E6EAF0',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#22C55E',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#E6EAF0',
    marginTop: 24,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#E6EAF0',
    height: 120,
    textAlignVertical: 'top',
    marginTop: 24,
  },
  sliderContainer: {
    marginTop: 32,
  },
  sliderTitle: {
    fontSize: 18,
    color: '#E6EAF0',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 24,
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EAF0',
  },
};
