
import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import { storage } from '../utils/storage';
import { OnboardingData } from '../types';

const { width, height } = Dimensions.get('window');

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: () => void;
  username?: string;
}

const QUESTIONS = [
  {
    id: 'followers',
    title: 'How many followers do you have?',
    icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    type: 'slider' as const,
  },
  {
    id: 'niche',
    title: 'What\'s your niche?',
    icon: 'pricetag-outline' as keyof typeof Ionicons.glyphMap,
    type: 'options' as const,
    options: [
      { label: 'Fitness', value: 'fitness', emoji: '💪' },
      { label: 'Tech', value: 'tech', emoji: '💻' },
      { label: 'Fashion', value: 'fashion', emoji: '👗' },
      { label: 'Music', value: 'music', emoji: '🎵' },
      { label: 'Food', value: 'food', emoji: '🍕' },
      { label: 'Other', value: 'other', emoji: '✨' },
    ],
  },
  {
    id: 'goal',
    title: 'What\'s your goal?',
    icon: 'rocket-outline' as keyof typeof Ionicons.glyphMap,
    type: 'options' as const,
    options: [
      { label: 'Grow followers', value: 'grow_followers', emoji: '📈' },
      { label: 'Monetize', value: 'monetize', emoji: '💰' },
      { label: 'Improve content', value: 'improve_content', emoji: '🎯' },
    ],
  },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ visible, onComplete, username = 'Creator' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [followerCount, setFollowerCount] = useState(1000);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const sliderOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Entrance animations
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }));
      cardOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      animateStepContent();
    } else {
      // Reset animations
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.9, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      animateStepContent();
      updateProgress();
    }
  }, [currentStep, visible]);

  const animateStepContent = () => {
    // Reset animations
    titleOpacity.value = 0;
    titleTranslateY.value = 20;
    iconScale.value = 0;
    iconRotation.value = 0;
    sliderOpacity.value = 0;

    // Animate in
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    iconScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 150 }));
    iconRotation.value = withDelay(400, withSpring(360, { damping: 15, stiffness: 100 }));
    sliderOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
  };

  const updateProgress = () => {
    const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
    progressWidth.value = withSpring(progress, { damping: 15, stiffness: 100 });
  };

  const showConfettiAnimation = () => {
    setShowConfetti(true);
    confettiOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2000, withTiming(0, { duration: 500 }))
    );
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M+`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    } else {
      return value.toString();
    }
  };

  const handleSliderChange = (value: number) => {
    setFollowerCount(Math.round(value));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleQuickSelect = (value: number) => {
    setFollowerCount(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const sliderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sliderOpacity.value,
  }));

  const handleAnswer = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete(newAnswers);
      }
    }, 300);
  };

  const handleSliderNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newAnswers = { ...answers, followers: followerCount };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete(newAnswers);
      }
    }, 300);
  };

  const handleComplete = async (finalAnswers: Record<string, any>) => {
    try {
      // Show confetti
      showConfettiAnimation();

      // Save onboarding data
      const onboardingData: OnboardingData = {
        platforms: ['all'], // Default to all platforms
        niche: finalAnswers.niche || 'other',
        followers: finalAnswers.followers || followerCount,
        goal: finalAnswers.goal || 'grow_followers',
      };

      await storage.saveOnboardingData(onboardingData);

      // Complete after confetti animation
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  const currentQuestion = QUESTIONS[currentStep];
  const isComplete = currentStep >= QUESTIONS.length;

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="overFullScreen"
    >
      <Animated.View style={[styles.container, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['#000000', '#0F172A', '#134E4A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={{ flex: 1 }}>
          {!isComplete ? (
            <View style={styles.content}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
                </View>
                <Text style={styles.progressText}>
                  {currentStep + 1} of {QUESTIONS.length}
                </Text>
              </View>

              {/* Main Card */}
              <Animated.View style={[styles.card, cardAnimatedStyle]}>
                <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.cardGradient}
                  >
                    {/* Welcome Title */}
                    <Animated.Text style={[styles.welcomeTitle, titleAnimatedStyle]}>
                      Welcome, {username} 👋
                    </Animated.Text>

                    {/* Question Icon */}
                    <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
                      <LinearGradient
                        colors={['#22C55E', '#10B981']}
                        style={styles.iconBackground}
                      >
                        <Ionicons
                          name={currentQuestion.icon}
                          size={48}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </Animated.View>

                    {/* Question Title */}
                    <Animated.Text style={[styles.questionTitle, titleAnimatedStyle]}>
                      {currentQuestion.title}
                    </Animated.Text>

                    {/* Content based on question type */}
                    {currentQuestion.type === 'slider' ? (
                      <Animated.View style={[styles.sliderContainer, sliderAnimatedStyle]}>
                        {/* Current Value Display */}
                        <View style={styles.valueContainer}>
                          <LinearGradient
                            colors={['#22C55E', '#10B981']}
                            style={styles.valueBackground}
                          >
                            <Text style={styles.valueText}>
                              {formatFollowers(followerCount)} followers
                            </Text>
                          </LinearGradient>
                        </View>

                        {/* Slider */}
                        <View style={styles.sliderWrapper}>
                          <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={1000000}
                            value={followerCount}
                            onValueChange={handleSliderChange}
                            minimumTrackTintColor="#22C55E"
                            maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                            thumbStyle={styles.sliderThumb}
                            trackStyle={styles.sliderTrack}
                          />
                          
                          {/* Slider Labels */}
                          <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabel}>0</Text>
                            <Text style={styles.sliderLabel}>1M+</Text>
                          </View>
                        </View>

                        {/* Quick Select Buttons */}
                        <View style={styles.quickSelectContainer}>
                          {[100, 1000, 10000, 100000, 500000].map((value) => (
                            <TouchableOpacity
                              key={value}
                              style={[
                                styles.quickSelectButton,
                                followerCount === value && styles.quickSelectButtonActive
                              ]}
                              onPress={() => handleQuickSelect(value)}
                            >
                              <Text style={[
                                styles.quickSelectText,
                                followerCount === value && styles.quickSelectTextActive
                              ]}>
                                {formatFollowers(value)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Next Button */}
                        <TouchableOpacity
                          style={styles.nextButton}
                          onPress={handleSliderNext}
                        >
                          <LinearGradient
                            colors={['#22C55E', '#10B981']}
                            style={styles.nextButtonGradient}
                          >
                            <Text style={styles.nextButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    ) : (
                      /* Answer Options */
                      <View style={styles.optionsContainer}>
                        {currentQuestion.options?.map((option, index) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.optionButton,
                              { 
                                transform: [{ 
                                  translateY: withDelay(600 + index * 100, withSpring(0, { damping: 15, stiffness: 100 }))
                                }] 
                              }
                            ]}
                            onPress={() => handleAnswer(option.value)}
                          >
                            <LinearGradient
                              colors={['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.05)']}
                              style={styles.optionGradient}
                            >
                              <Text style={styles.optionEmoji}>{option.emoji}</Text>
                              <Text style={styles.optionText}>{option.label}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </LinearGradient>
                </BlurView>
              </Animated.View>

              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                {QUESTIONS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: index <= currentStep ? '#22C55E' : 'rgba(255, 255, 255, 0.2)',
                        transform: [{ scale: index === currentStep ? 1.2 : 1 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            // Completion Screen
            <View style={styles.completionContainer}>
              <Animated.View style={[styles.completionCard, cardAnimatedStyle]}>
                <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.completionGradient}
                  >
                    <View style={styles.completionIconContainer}>
                      <LinearGradient
                        colors={['#22C55E', '#10B981']}
                        style={styles.completionIconBackground}
                      >
                        <Text style={styles.completionEmoji}>🎉</Text>
                      </LinearGradient>
                    </View>

                    <Text style={styles.completionTitle}>You're all set!</Text>
                    <Text style={styles.completionSubtitle}>
                      Let's start creating viral content together
                    </Text>

                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={onComplete}
                    >
                      <LinearGradient
                        colors={['#22C55E', '#10B981']}
                        style={styles.continueButtonGradient}
                      >
                        <Text style={styles.continueButtonText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            </View>
          )}

          {/* Confetti Overlay */}
          {showConfetti && (
            <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
              <Text style={styles.confettiText}>🎉</Text>
              <Text style={styles.confettiText}>✨</Text>
              <Text style={styles.confettiText}>🚀</Text>
              <Text style={styles.confettiText}>💫</Text>
              <Text style={styles.confettiText}>🎊</Text>
            </Animated.View>
          )}
        </SafeAreaView>
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
  progressContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
  },
  cardBlur: {
    borderRadius: 24,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E6EAF0',
    textAlign: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E6EAF0',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  valueContainer: {
    marginBottom: 32,
  },
  valueBackground: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sliderWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#22C55E',
    width: 24,
    height: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  quickSelectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickSelectButtonActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
  },
  quickSelectText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quickSelectTextActive: {
    color: '#22C55E',
  },
  nextButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 16,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EAF0',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completionCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  completionGradient: {
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 24,
  },
  completionIconContainer: {
    marginBottom: 32,
  },
  completionIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 30,
  },
  completionEmoji: {
    fontSize: 64,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E6EAF0',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  continueButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  confettiText: {
    fontSize: 48,
    position: 'absolute',
  },
});

export default OnboardingFlow;
