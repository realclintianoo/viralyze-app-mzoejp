
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
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
import * as Haptics from 'expo-haptics';
import { OnboardingData } from '../types';
import { storage } from '../utils/storage';

const { width, height } = Dimensions.get('window');

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: () => void;
  username?: string;
}

const QUESTIONS = [
  {
    id: 'platforms',
    title: 'Which platforms do you create for?',
    subtitle: 'Select all that apply',
    type: 'multiselect',
    options: [
      { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' },
      { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
      { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
      { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' },
      { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin' },
      { id: 'all', name: 'All Platforms', icon: 'globe-outline' },
    ]
  },
  {
    id: 'niche',
    title: 'What\'s your niche?',
    subtitle: 'This helps us personalize your content',
    type: 'select',
    options: [
      'Business & Finance', 'Health & Fitness', 'Technology', 'Lifestyle',
      'Education', 'Entertainment', 'Travel', 'Food & Cooking',
      'Fashion & Beauty', 'Gaming', 'Sports', 'Music'
    ]
  },
  {
    id: 'followers',
    title: 'How many followers do you have?',
    subtitle: 'Across all platforms combined',
    type: 'slider',
    min: 0,
    max: 10000000,
    default: 1000
  },
  {
    id: 'goal',
    title: 'What\'s your main goal?',
    subtitle: 'This helps us tailor our advice',
    type: 'text',
    placeholder: 'e.g., Grow my audience to 100K followers, monetize my content...'
  }
];

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 20, 0.95)',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EAF0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    minWidth: (width - 72) / 2,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
  },
  optionText: {
    fontSize: 14,
    color: '#E6EAF0',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0F14',
  },
  sliderContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 32,
  },
});

export default function OnboardingFlow({ visible, onComplete, username }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  const animateStepContent = useCallback(() => {
    cardOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 400 })
    );
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 200 }),
      withSpring(1, { tension: 300, friction: 8 })
    );
  }, [cardOpacity, cardScale]);

  const updateProgress = useCallback(() => {
    // Progress update logic here
    console.log('Progress updated');
  }, []);

  useEffect(() => {
    if (visible) {
      backgroundOpacity.value = withTiming(1, { duration: 400 });
      cardScale.value = withSpring(1, { tension: 300, friction: 8 });
      cardOpacity.value = withTiming(1, { duration: 600 });
    }
  }, [visible, animateStepContent, backgroundOpacity, cardOpacity, cardScale]);

  useEffect(() => {
    if (currentStep > 0 && visible) {
      animateStepContent();
      updateProgress();
    }
  }, [currentStep, visible, animateStepContent, updateProgress]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const showConfettiAnimation = () => {
    // Confetti animation logic
    console.log('Showing confetti');
  };

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const handleSliderChange = (value: number) => {
    setAnswers(prev => ({ ...prev, followers: Math.round(value) }));
  };

  const handleQuickSelect = (value: number) => {
    setAnswers(prev => ({ ...prev, followers: value }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAnswer = (value: string) => {
    const question = QUESTIONS[currentStep];
    
    if (question.type === 'multiselect') {
      const current = answers[question.id] || [];
      const updated = current.includes(value)
        ? current.filter((item: string) => item !== value)
        : [...current, value];
      setAnswers(prev => ({ ...prev, [question.id]: updated }));
    } else {
      setAnswers(prev => ({ ...prev, [question.id]: value }));
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSliderNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete(answers);
    }
  };

  const handleComplete = async (finalAnswers: Record<string, any>) => {
    setLoading(true);
    
    try {
      const profileData: OnboardingData = {
        platforms: finalAnswers.platforms || [],
        niche: finalAnswers.niche || '',
        followers: finalAnswers.followers || 1000,
        goal: finalAnswers.goal || '',
        completedAt: new Date().toISOString(),
      };

      await storage.saveProfile(profileData);
      showConfettiAnimation();
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const currentQuestion = QUESTIONS[currentStep];
  const canProceed = answers[currentQuestion?.id];

  return (
    <Modal visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, backgroundAnimatedStyle]}>
        <SafeAreaView style={styles.container}>
          {/* Header with progress */}
          <View style={styles.header}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
              {currentStep + 1} of {QUESTIONS.length}
            </Text>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, cardAnimatedStyle]}>
            <Text style={styles.title}>{currentQuestion?.title}</Text>
            <Text style={styles.subtitle}>{currentQuestion?.subtitle}</Text>

            {/* Render question content based on type */}
            {currentQuestion?.type === 'multiselect' && (
              <View style={styles.optionGrid}>
                {currentQuestion.options?.map((option: any) => (
                  <TouchableOpacity
                    key={option.id || option}
                    style={[
                      styles.option,
                      (answers[currentQuestion.id] || []).includes(option.id || option) && styles.optionSelected
                    ]}
                    onPress={() => handleAnswer(option.id || option)}
                  >
                    {option.icon && (
                      <Ionicons 
                        name={option.icon as keyof typeof Ionicons.glyphMap} 
                        size={24} 
                        color="#E6EAF0" 
                      />
                    )}
                    <Text style={styles.optionText}>{option.name || option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {currentQuestion?.type === 'select' && (
              <View style={styles.optionGrid}>
                {currentQuestion.options?.map((option: any) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      answers[currentQuestion.id] === option && styles.optionSelected
                    ]}
                    onPress={() => handleAnswer(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {currentQuestion?.type === 'slider' && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>
                  {formatFollowers(answers[currentQuestion.id] || currentQuestion.default)}
                </Text>
                <Text style={styles.sliderLabel}>Followers</Text>
                
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={currentQuestion.min}
                  maximumValue={currentQuestion.max}
                  value={answers[currentQuestion.id] || currentQuestion.default}
                  onValueChange={handleSliderChange}
                  minimumTrackTintColor="#22C55E"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                  thumbStyle={{ backgroundColor: '#22C55E', width: 24, height: 24 }}
                />
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                !canProceed && styles.buttonDisabled
              ]}
              onPress={handleSliderNext}
              disabled={!canProceed || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : currentStep === QUESTIONS.length - 1 ? 'Complete' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
