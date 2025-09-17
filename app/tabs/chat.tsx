
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
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
  withRepeat,
  interpolate,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import { ChatMessage, QuotaUsage, OnboardingData } from '../../types';
import { quickHealthCheck } from '../../utils/systemCheck';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { aiComplete, checkOpenAIConfig } from '../../lib/ai';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const QUICK_ACTIONS = [
  { 
    id: 'hooks', 
    title: 'Hooks', 
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    gradient: colors.hookGradient,
    description: 'Viral hooks',
    category: 'Engagement'
  },
  { 
    id: 'ideas', 
    title: 'Ideas', 
    icon: 'bulb' as keyof typeof Ionicons.glyphMap,
    gradient: [colors.warning, '#D97706'],
    description: 'Content ideas',
    category: 'Inspiration'
  },
  { 
    id: 'captions', 
    title: 'Captions', 
    icon: 'text' as keyof typeof Ionicons.glyphMap,
    gradient: colors.captionGradient,
    description: 'Engaging captions',
    category: 'Content'
  },
  { 
    id: 'calendar', 
    title: 'Calendar', 
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    gradient: colors.calendarGradient,
    description: '7-day plan',
    category: 'Planning'
  },
];

interface PremiumQuickActionCardProps {
  action: typeof QUICK_ACTIONS[0];
  index: number;
  onPress: () => void;
  disabled: boolean;
}

function PremiumQuickActionCard({ action, index, onPress, disabled }: PremiumQuickActionCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const glowOpacity = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 80;
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 120 }));

    // Subtle idle animation
    setTimeout(() => {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 3000 }),
          withTiming(1, { duration: 3000 })
        ),
        -1,
        true
      );
    }, delay + 600);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` }
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
    glowOpacity.value = withTiming(0.6, { duration: 150 });
    rotateZ.value = withSpring(-1, { damping: 15, stiffness: 300 });
    iconScale.value = withSpring(1.1, { damping: 18, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    glowOpacity.value = withTiming(0, { duration: 300 });
    rotateZ.value = withSpring(0, { damping: 15, stiffness: 300 });
    iconScale.value = withSpring(1.05, { damping: 18, stiffness: 400 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    runOnJS(onPress)();
  };

  return (
    <View style={{ marginRight: 12, position: 'relative' }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: 18,
            backgroundColor: action.gradient[0],
            opacity: 0.15,
            shadowColor: action.gradient[0],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 12,
          },
          glowStyle,
        ]}
      />
      
      <AnimatedTouchableOpacity
        style={[
          {
            width: 120,
            height: 100,
            borderRadius: 14,
            overflow: 'hidden',
            opacity: disabled ? 0.5 : 1,
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={1}
      >
        <BlurView intensity={20} style={{ flex: 1 }}>
          <LinearGradient
            colors={[
              `${action.gradient[0]}12`,
              `${action.gradient[1]}20`,
            ]}
            style={[
              commonStyles.toolCardContent,
              {
                flex: 1,
                justifyContent: 'space-between',
                borderColor: colors.glassBorderStrong,
                padding: 12,
              }
            ]}
          >
            {/* Category Badge */}
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: `${action.gradient[0]}20`,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 0.5,
                borderColor: `${action.gradient[0]}30`,
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  fontWeight: '800',
                  color: action.gradient[0],
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                }}
              >
                {action.category}
              </Text>
            </View>

            {/* Icon */}
            <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
              <Animated.View
                style={[
                  {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                    overflow: 'hidden',
                  },
                  iconAnimatedStyle,
                ]}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: action.gradient[0],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Ionicons name={action.icon} size={18} color={colors.white} />
                </LinearGradient>
              </Animated.View>
            </View>
            
            {/* Content */}
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: colors.text,
                  marginBottom: 2,
                  letterSpacing: -0.1,
                }}
                numberOfLines={1}
              >
                {action.title}
              </Text>
              
              <Text
                style={{
                  fontSize: 9,
                  color: colors.textSecondary,
                  fontWeight: '500',
                }}
                numberOfLines={1}
              >
                {action.description}
              </Text>
            </View>
          </LinearGradient>
        </BlurView>
      </AnimatedTouchableOpacity>
    </View>
  );
}

interface PremiumQuotaPillProps {
  remaining: number;
  total: number;
}

function PremiumQuotaPill({ remaining, total }: PremiumQuotaPillProps) {
  const progress = remaining / total;
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (remaining <= 1) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500 }),
          withTiming(0.2, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [remaining]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getColor = () => {
    if (progress > 0.5) return colors.success;
    if (progress > 0.2) return colors.warning;
    return colors.error;
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -3,
            left: -3,
            right: -3,
            bottom: -3,
            borderRadius: 18,
            backgroundColor: getColor(),
            shadowColor: getColor(),
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 8,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={animatedStyle}>
        <BlurView intensity={20} style={{ borderRadius: 15, overflow: 'hidden' }}>
          <LinearGradient
            colors={[
              `${getColor()}12`,
              `${getColor()}20`,
            ]}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={[
                commonStyles.statusDot,
                {
                  backgroundColor: getColor(),
                  shadowColor: getColor(),
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                }
              ]}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: colors.text,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {remaining} FREE LEFT
            </Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const headerScale = useSharedValue(0.95);

  useEffect(() => {
    loadInitialData();
    checkSystemHealth();
    
    // Premium header animation
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 120 });
    headerScale.value = withSpring(1, { damping: 18, stiffness: 150 });
  }, []);

  const loadInitialData = async () => {
    try {
      const savedMessages = await storage.getItem('chat_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }

      const savedQuota = await storage.getItem('quota_usage');
      if (savedQuota) {
        setQuota(JSON.parse(savedQuota));
      }

      const savedProfile = await storage.getItem('onboarding_data');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const health = await quickHealthCheck();
      setSystemHealthy(health.healthy);
      
      if (!health.healthy) {
        const openaiConfig = checkOpenAIConfig();
        if (openaiConfig.initializationError) {
          setConfigError(openaiConfig.initializationError);
        } else if (!openaiConfig.hasApiKey) {
          setConfigError('OpenAI API key not found in environment variables');
        } else if (!openaiConfig.isValidKey) {
          setConfigError('OpenAI API key is still set to placeholder value');
        } else {
          setConfigError('OpenAI configuration error');
        }
      } else {
        setConfigError(null);
      }
    } catch (error) {
      console.error('System health check failed:', error);
      setSystemHealthy(false);
      setConfigError('System health check failed');
    }
  };

  const handleQuickAction = async (actionId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!systemHealthy) {
      showConfigurationError();
      return;
    }

    if (quota.text >= 2) {
      showUpgradeModal();
      return;
    }

    const prompts = {
      hooks: 'Generate 5 viral hooks for social media posts that grab attention in the first 3 seconds',
      ideas: 'Give me 5 creative content ideas for my niche that would engage my audience',
      captions: 'Write 3 engaging captions for a social media post with relevant hashtags',
      calendar: 'Create a 7-day content calendar with posting times and content types',
    };

    const prompt = prompts[actionId as keyof typeof prompts];
    if (prompt) {
      await sendMessage(prompt);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!systemHealthy) {
      showConfigurationError();
      return;
    }

    if (quota.text >= 2) {
      showUpgradeModal();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const responses = await aiComplete({
        kind: 'chat',
        profile,
        input: text,
        n: 1,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: responses[0] || 'Sorry, I couldn\'t generate a response. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);
      await storage.setItem('chat_messages', JSON.stringify(updatedMessages));

      // Update quota
      const newQuota = { ...quota, text: quota.text + 1 };
      setQuota(newQuota);
      await storage.setItem('quota_usage', JSON.stringify(newQuota));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('AI completion error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message?.includes('placeholder')) {
        errorMessage = 'OpenAI API key is not configured. Please check your .env file and replace the placeholder with your actual API key.';
      } else if (error.message?.includes('Invalid')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in the .env file.';
      } else if (error.message?.includes('quota') || error.message?.includes('billing')) {
        errorMessage = 'OpenAI API quota exceeded. Please add billing information to your OpenAI account.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      const errorAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };

      const updatedMessages = [...messages, userMessage, errorAiMessage];
      setMessages(updatedMessages);
      await storage.setItem('chat_messages', JSON.stringify(updatedMessages));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const showConfigurationError = () => {
    const currentApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'not set';
    
    Alert.alert(
      '⚙️ OpenAI Configuration Required',
      `AI features are not working because:\n\n${configError}\n\nCurrent API key: "${currentApiKey}"\n\nTo fix this:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Open the .env file in your project\n4. Replace the placeholder with your actual key\n5. Restart the app\n6. Make sure billing is set up in OpenAI`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const showUpgradeModal = () => {
    Alert.alert(
      '🚀 Daily Limit Reached',
      'You\'ve used all your free AI requests for today. Upgrade to Pro for unlimited access and premium features!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', style: 'default' },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('✅ Copied', 'Message copied to clipboard');
  };

  const saveMessage = async (message: ChatMessage) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('💾 Saved', 'Message saved to your collection');
  };

  const renderMessage = (message: ChatMessage) => (
    <Animated.View
      key={message.id}
      style={{
        alignSelf: message.isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginBottom: 16,
      }}
    >
      {message.isUser ? (
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={{
              padding: 16,
              shadowColor: colors.glowPrimary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 15, lineHeight: 22, fontWeight: '500' }}>
              {message.content}
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <BlurView intensity={20} style={{ borderRadius: 20, overflow: 'hidden' }}>
          <View
            style={{
              backgroundColor: message.isError ? 'rgba(239, 68, 68, 0.08)' : colors.glassBackgroundStrong,
              padding: 16,
              borderWidth: 1,
              borderColor: message.isError ? 'rgba(239, 68, 68, 0.25)' : colors.glassBorderStrong,
              shadowColor: colors.neuDark,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                color: message.isError ? colors.error : colors.text,
                fontSize: 15,
                lineHeight: 22,
                fontWeight: '500',
              }}
            >
              {message.content}
            </Text>

            {!message.isError && (
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => copyMessage(message.content)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.glassBackground,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                  }}
                >
                  <Ionicons name="copy" size={14} color={colors.text} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                    Copy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => saveMessage(message)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.glassBackground,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                  }}
                >
                  <Ionicons name="bookmark" size={14} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>
      )}
    </Animated.View>
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { translateY: headerTranslateY.value },
      { scale: headerScale.value }
    ],
  }));

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Premium Header */}
        <Animated.View style={[headerAnimatedStyle]}>
          <BlurView intensity={20} style={{ borderBottomWidth: 1, borderBottomColor: colors.glassBorder }}>
            <View style={[commonStyles.header, { backgroundColor: 'transparent', paddingVertical: 12 }]}>
              <View style={{ borderRadius: 14, overflow: 'hidden' }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    shadowColor: colors.glowPrimary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text style={[commonStyles.headerTitle, { color: colors.white, fontSize: 20 }]}>
                    VIRALYZE
                  </Text>
                </LinearGradient>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.glassBackground,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    shadowColor: colors.neuDark,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <Ionicons name="notifications" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.glassBackground,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    shadowColor: colors.neuDark,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <Ionicons name="person-circle" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Quota Display */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, alignItems: 'flex-end' }}>
          <PremiumQuotaPill remaining={2 - quota.text} total={2} />
        </View>

        {/* Premium Quick Actions */}
        <View style={{ paddingBottom: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {QUICK_ACTIONS.map((action, index) => (
              <PremiumQuickActionCard
                key={action.id}
                action={action}
                index={index}
                onPress={() => handleQuickAction(action.id)}
                disabled={!systemHealthy}
              />
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <BlurView intensity={20} style={{ borderRadius: 20, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['rgba(34, 197, 94, 0.06)', 'rgba(22, 163, 74, 0.12)']}
                  style={[
                    commonStyles.premiumCard,
                    { 
                      margin: 0, 
                      alignItems: 'center', 
                      borderColor: colors.glassBorderStrong,
                      padding: 20,
                      borderRadius: 20,
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      shadowColor: colors.glowPrimary,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    <Ionicons name="chatbubbles" size={28} color={colors.white} />
                  </LinearGradient>
                  
                  <Text style={[commonStyles.textLarge, { textAlign: 'center', marginBottom: 6, fontSize: 18 }]}>
                    Welcome to VIRALYZE
                  </Text>
                  <Text style={[commonStyles.textSmall, { textAlign: 'center', maxWidth: 260, lineHeight: 20, fontSize: 13 }]}>
                    {systemHealthy 
                      ? 'Ask me anything about growing your social media presence! I&apos;m here to help you create viral content.'
                      : 'Configure your OpenAI API key to start chatting with AI and unlock powerful content creation tools.'
                    }
                  </Text>
                </LinearGradient>
              </BlurView>
            </View>
          )}

          {messages.map(renderMessage)}

          {isLoading && (
            <View style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <BlurView intensity={20} style={{ borderRadius: 20, overflow: 'hidden' }}>
                <View
                  style={{
                    backgroundColor: colors.glassBackgroundStrong,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    shadowColor: colors.neuDark,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[commonStyles.text, { fontWeight: '500', fontSize: 14 }]}>
                    AI is thinking...
                  </Text>
                </View>
              </BlurView>
            </View>
          )}
        </ScrollView>

        {/* Premium Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ paddingHorizontal: 20, paddingBottom: 16 }}
        >
          <BlurView intensity={25} style={{ borderRadius: 20, overflow: 'hidden' }}>
            <View
              style={{
                backgroundColor: colors.glassBackgroundStrong,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
                shadowColor: colors.neuDark,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 15,
                  maxHeight: 80,
                  fontWeight: '500',
                }}
                placeholder={systemHealthy ? "Ask me anything..." : "Configure OpenAI API key first..."}
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                editable={systemHealthy && !isLoading}
              />
              <TouchableOpacity
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading || !systemHealthy}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={
                    (!inputText.trim() || isLoading || !systemHealthy)
                      ? [colors.textSecondary, colors.textSecondary]
                      : [colors.gradientStart, colors.gradientEnd]
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: (!inputText.trim() || isLoading || !systemHealthy) ? 'transparent' : colors.glowPrimary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Ionicons name="send" size={16} color={colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
