
import { quickHealthCheck } from '../../utils/systemCheck';
import { ChatMessage, QuotaUsage, OnboardingData } from '../../types';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { useConversations } from '../../contexts/ConversationsContext';
import { getPersonalizedQuickActions } from '../../utils/personalization';
import PremiumSidebar from '../../components/PremiumSidebar';
import * as Haptics from 'expo-haptics';
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
import { commonStyles, colors } from '../../styles/commonStyles';
import { aiComplete, checkOpenAIConfig } from '../../lib/ai';
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

interface PremiumQuickActionCardProps {
  action: typeof QUICK_ACTIONS[0];
  index: number;
  onPress: () => void;
  disabled: boolean;
}

interface PremiumQuotaPillProps {
  remaining: number;
  total: number;
}

const QUICK_ACTIONS = [
  { id: 'hooks', title: 'Hooks', icon: 'fish', description: 'Attention-grabbing openers' },
  { id: 'ideas', title: 'Ideas', icon: 'bulb', description: 'Fresh content concepts' },
  { id: 'captions', title: 'Captions', icon: 'create', description: 'Engaging post captions' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar', description: '7-day content plan' },
  { id: 'rewriter', title: 'Rewriter', icon: 'refresh', description: 'Adapt for platforms' },
];

const PremiumQuickActionCard: React.FC<PremiumQuickActionCardProps> = ({ action, index, onPress, disabled }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 300 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          commonStyles.glassCard,
          {
            padding: 16,
            margin: 6,
            opacity: disabled ? 0.5 : 1,
            minHeight: 100,
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.1)', 'rgba(6, 182, 212, 0.1)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
        
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View style={{
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderRadius: 20,
            padding: 12,
            marginBottom: 8,
          }}>
            <Ionicons name={action.icon as any} size={24} color={colors.accent} />
          </View>
          
          <Text style={[commonStyles.textBold, { fontSize: 14, textAlign: 'center', marginBottom: 4 }]}>
            {action.title}
          </Text>
          
          <Text style={[commonStyles.textSmall, { textAlign: 'center', fontSize: 11 }]}>
            {action.description}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumQuotaPill: React.FC<PremiumQuotaPillProps> = ({ remaining, total }) => {
  const pulseAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    if (remaining <= 1) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [remaining]);

  const getColor = () => {
    if (remaining === 0) return colors.error;
    if (remaining === 1) return colors.warning;
    return colors.accent;
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={[
        commonStyles.usageCounter,
        { 
          backgroundColor: `${getColor()}20`,
          borderColor: `${getColor()}40`,
        }
      ]}>
        <Text style={[
          commonStyles.usageCounterText,
          { color: getColor() }
        ]}>
          {remaining} free left today
        </Text>
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  console.log('💬 Chat screen rendered');
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { profile, theme, welcomeMessage, recommendations, chatContext, isPersonalized } = usePersonalization();
  const { 
    currentConversation, 
    messages, 
    addMessage, 
    createConversation,
  } = useConversations();
  
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadInitialData();
    checkSystemHealth();
  }, []);

  const loadInitialData = async () => {
    try {
      const quotaData = await storage.getQuotaUsage();
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      await quickHealthCheck();
    } catch (error) {
      console.error('System health check failed:', error);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    const prompts: Record<string, string> = {
      hooks: `Generate 5 attention-grabbing hooks for ${profile?.niche || 'general'} content`,
      ideas: `Suggest 5 trending content ideas for ${profile?.niche || 'general'} creators`,
      captions: `Create 3 engaging captions for ${profile?.niche || 'general'} posts`,
      calendar: `Create a 7-day content calendar for ${profile?.niche || 'general'} creators`,
      rewriter: 'Help me adapt my content for different social media platforms',
    };

    const prompt = prompts[actionId] || prompts.ideas;
    
    // Create a new conversation if none exists
    if (!currentConversation) {
      const title = `${actionId.charAt(0).toUpperCase() + actionId.slice(1)} Project`;
      await createConversation(title, getNicheEmoji(profile?.niche));
    }
    
    sendMessage(prompt);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !currentConversation) return;

    // Check quota
    if (quota.text >= 2) {
      showUpgradeModal();
      return;
    }

    // Check OpenAI configuration
    const config = checkOpenAIConfig();
    if (!config.isConfigured) {
      showConfigurationError();
      return;
    }

    setInputText('');
    setIsLoading(true);

    try {
      // Add user message to conversation
      await addMessage(currentConversation.id, text.trim(), 'user');

      // Enhanced system prompt with personalization context
      const enhancedProfile = profile ? {
        ...profile,
        chatContext: chatContext,
      } : null;

      console.log('🤖 Sending personalized AI request with context:', chatContext);

      const responses = await aiComplete({
        kind: 'chat',
        profile: enhancedProfile,
        input: text.trim(),
        n: 1,
      });

      const aiResponse = responses[0] || 'Sorry, I couldn\'t generate a response.';
      
      // Add AI response to conversation
      await addMessage(currentConversation.id, aiResponse, 'assistant');
      
      // Update quota
      const newQuota = await storage.updateQuotaUsage(1, 0);
      setQuota(newQuota);

    } catch (error: any) {
      console.error('AI completion error:', error);
      
      // Add error message to conversation
      await addMessage(
        currentConversation.id, 
        `Sorry, I encountered an error: ${error.message}`, 
        'assistant'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showConfigurationError = () => {
    Alert.alert(
      'Configuration Required',
      'OpenAI API is not properly configured. Please check your API key in the settings.',
      [{ text: 'OK' }]
    );
  };

  const showUpgradeModal = () => {
    Alert.alert(
      'Daily Limit Reached',
      'You\'ve used all your free AI requests for today. Upgrade to Pro for unlimited access!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => console.log('Navigate to paywall') },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    // Implementation for copying message
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Copy message:', content);
  };

  const saveMessage = async (messageContent: string) => {
    // Implementation for saving message
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Save message:', messageContent);
  };

  const getNicheEmoji = (niche?: string): string => {
    if (!niche) return '💬';
    const nicheEmojis: Record<string, string> = {
      'fitness': '💪',
      'tech': '💻',
      'music': '🎶',
      'food': '🍳',
      'fashion': '👗',
      'travel': '✈️',
      'business': '💼',
      'lifestyle': '✨',
    };
    return nicheEmojis[niche.toLowerCase()] || '💬';
  };

  const renderMessage = (message: any) => (
    <View
      key={message.id}
      style={{
        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginVertical: 8,
      }}
    >
      <View
        style={[
          {
            padding: 16,
            borderRadius: 20,
            backgroundColor: message.role === 'user' 
              ? theme.primary 
              : colors.glassBackgroundStrong,
            borderWidth: 1,
            borderColor: message.role === 'user' 
              ? 'transparent' 
              : colors.glassBorderStrong,
          }
        ]}
      >
        <Text
          style={[
            commonStyles.text,
            {
              color: message.role === 'user' 
                ? colors.white 
                : colors.text,
            }
          ]}
        >
          {message.content}
        </Text>
      </View>

      {message.role === 'assistant' && (
        <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'flex-start' }}>
          <TouchableOpacity
            style={[commonStyles.chip, { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6 }]}
            onPress={() => copyMessage(message.content)}
          >
            <Text style={[commonStyles.chipText, { fontSize: 12 }]}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[commonStyles.chip, { paddingHorizontal: 12, paddingVertical: 6 }]}
            onPress={() => saveMessage(message.content)}
          >
            <Text style={[commonStyles.chipText, { fontSize: 12 }]}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Get personalized quick actions
  const personalizedActions = getPersonalizedQuickActions(profile);

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {/* Header */}
        <View style={[commonStyles.header, { paddingBottom: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {/* Sidebar Toggle Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.glassBackgroundStrong,
                borderRadius: 16,
                padding: 12,
                marginRight: 16,
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSidebar(true);
              }}
            >
              <Ionicons name="menu" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.headerTitle, { fontSize: 24 }]}>
                {currentConversation?.title || 'VIRALYZE'}
              </Text>
              {isPersonalized && (
                <Text style={[commonStyles.textSmall, { color: theme.primary }]}>
                  Chatting as {profile?.niche || 'Content'} Creator
                </Text>
              )}
            </View>
          </View>
          
          <View style={{ alignItems: 'flex-end' }}>
            <PremiumQuotaPill remaining={2 - quota.text} total={2} />
          </View>
        </View>

        {/* Welcome Message */}
        {isPersonalized && !currentConversation && (
          <View style={[commonStyles.glassCard, { margin: 16, marginBottom: 8 }]}>
            <Text style={[commonStyles.textBold, { marginBottom: 8 }]}>
              {welcomeMessage}
            </Text>
            {recommendations.length > 0 && (
              <View>
                <Text style={[commonStyles.textSmall, { marginBottom: 8 }]}>
                  Personalized for you:
                </Text>
                {recommendations.slice(0, 2).map((rec, index) => (
                  <Text key={index} style={[commonStyles.textSmall, { marginBottom: 4 }]}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        {!currentConversation && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {personalizedActions.map((action, index) => (
                <PremiumQuickActionCard
                  key={action.id}
                  action={action}
                  index={index}
                  onPress={() => handleQuickAction(action.id)}
                  disabled={quota.text >= 2}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={{ alignSelf: 'flex-start', marginVertical: 8 }}>
              <View style={[
                commonStyles.glassCard,
                { padding: 16, flexDirection: 'row', alignItems: 'center' }
              ]}>
                <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={commonStyles.textSmall}>AI is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={{
            flexDirection: 'row',
            padding: 16,
            paddingBottom: Platform.OS === 'ios' ? 32 : 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.glassBorder,
          }}>
            <TextInput
              style={[
                commonStyles.premiumInput,
                {
                  flex: 1,
                  marginVertical: 0,
                  marginRight: 12,
                  maxHeight: 100,
                }
              ]}
              placeholder={isPersonalized 
                ? `Ask me anything about ${profile?.niche || 'content'} creation...`
                : "Ask me anything about content creation..."
              }
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={() => sendMessage(inputText)}
              editable={!isLoading}
            />
            
            <TouchableOpacity
              style={[
                {
                  backgroundColor: theme.primary,
                  borderRadius: 20,
                  padding: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: (!inputText.trim() || isLoading) ? 0.5 : 1,
                },
                commonStyles.glowEffect
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons 
                name={isLoading ? 'hourglass' : 'send'} 
                size={20} 
                color={colors.white} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Premium Sidebar */}
      <PremiumSidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
      />
    </SafeAreaView>
  );
}
