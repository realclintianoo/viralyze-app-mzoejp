
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
import { router } from 'expo-router';
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

interface PremiumSuggestionTileProps {
  action: any;
  index: number;
  onPress: () => void;
  disabled: boolean;
}

interface PremiumQuotaPillProps {
  remaining: number;
  total: number;
}

interface WelcomeBlockProps {
  visible: boolean;
  profile: OnboardingData | null;
  welcomeMessage: string;
  recommendations: string[];
}

interface SuggestionTilesProps {
  visible: boolean;
  actions: any[];
  onActionPress: (actionId: string) => void;
  disabled: boolean;
}

const { width } = Dimensions.get('window');

// Premium Quota Pill Component
const PremiumQuotaPill: React.FC<PremiumQuotaPillProps> = ({ remaining, total }) => {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    shadowOpacity: glowAnim.value,
  }));

  useEffect(() => {
    // Gentle glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );

    // Pulse when low quota
    if (remaining <= 1) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [remaining, glowAnim, pulseAnim]);

  const getColor = () => {
    if (remaining === 0) return '#EF4444';
    if (remaining === 1) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <Animated.View style={[animatedStyle, {
      shadowColor: getColor(),
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 8,
      elevation: 8,
    }]}>
      <BlurView intensity={20} style={{
        backgroundColor: `${getColor()}15`,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${getColor()}40`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        overflow: 'hidden',
      }}>
        <Text style={{
          color: getColor(),
          fontSize: 12,
          fontWeight: '600',
          textAlign: 'center',
        }}>
          {remaining} Free Left Today
        </Text>
      </BlurView>
    </Animated.View>
  );
};

// Welcome Block Component
const WelcomeBlock: React.FC<WelcomeBlockProps> = ({ visible, profile, welcomeMessage, recommendations }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 600 });
      slideAnim.value = withTiming(0, { duration: 600 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 400 });
      slideAnim.value = withTiming(-30, { duration: 400 });
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  const getNicheEmoji = (niche?: string): string => {
    const emojis: Record<string, string> = {
      'fitness': '💪',
      'tech': '💻',
      'music': '🎵',
      'food': '🍕',
      'fashion': '👗',
      'travel': '✈️',
      'business': '💼',
      'lifestyle': '✨',
    };
    return emojis[niche?.toLowerCase() || ''] || '👋';
  };

  return (
    <Animated.View style={[animatedStyle, { margin: 16, marginBottom: 8 }]}>
      <BlurView intensity={20} style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        overflow: 'hidden',
      }}>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.1)', 'rgba(6, 182, 212, 0.1)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, marginRight: 8 }}>
            {getNicheEmoji(profile?.niche)}
          </Text>
          <Text style={[commonStyles.textBold, { fontSize: 16, flex: 1 }]}>
            {welcomeMessage}
          </Text>
        </View>
        
        {recommendations.length > 0 && (
          <View>
            <Text style={[commonStyles.textSmall, { marginBottom: 8, opacity: 0.8 }]}>
              Personalized suggestions:
            </Text>
            {recommendations.slice(0, 2).map((rec, index) => (
              <Text key={index} style={[commonStyles.textSmall, { marginBottom: 4, opacity: 0.9 }]}>
                • {rec}
              </Text>
            ))}
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
};

// Suggestion Tile Component
const PremiumSuggestionTile: React.FC<PremiumSuggestionTileProps> = ({ action, index, onPress, disabled }) => {
  const scale = useSharedValue(1);
  const shimmerAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-100, 100]) }],
  }));

  useEffect(() => {
    // Gentle bounce on load
    scale.value = withDelay(
      index * 150,
      withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 200 })
      )
    );

    // Subtle shimmer effect
    shimmerAnim.value = withDelay(
      index * 300,
      withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      )
    );
  }, [index, scale, shimmerAnim]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Animated.View style={[animatedStyle, { flex: 1, marginHorizontal: 4 }]}>
      <TouchableOpacity
        style={{
          opacity: disabled ? 0.5 : 1,
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <BlurView intensity={20} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.3)',
          padding: 12,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 80,
          overflow: 'hidden',
        }}>
          {/* Shimmer overlay */}
          <Animated.View style={[shimmerStyle, {
            position: 'absolute',
            top: 0,
            left: -50,
            right: -50,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            width: 50,
          }]} />
          
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(6, 182, 212, 0.15)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          <Text style={{ fontSize: 20, marginBottom: 4 }}>
            {action.icon}
          </Text>
          
          <Text style={[commonStyles.textBold, { 
            fontSize: 11, 
            textAlign: 'center',
            color: colors.text,
          }]}>
            {action.title}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Suggestion Tiles Row Component
const SuggestionTiles: React.FC<SuggestionTilesProps> = ({ visible, actions, onActionPress, disabled }) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 500 });
      slideAnim.value = withTiming(0, { duration: 500 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(20, { duration: 300 });
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[animatedStyle, { paddingHorizontal: 16, marginBottom: 16 }]}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {actions.slice(0, 3).map((action, index) => (
          <PremiumSuggestionTile
            key={action.id}
            action={action}
            index={index}
            onPress={() => onActionPress(action.id)}
            disabled={disabled}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  console.log('💬 Premium Chat screen rendered');
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);
  
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

  // Activity tracking and idle behavior
  const resetIdleTimer = () => {
    setLastActivityTime(Date.now());
    
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    // Hide welcome and suggestions when user is active
    if (messages.length > 0) {
      setShowWelcome(false);
      setShowSuggestions(false);
    }
    
    // Set new idle timer for 5 minutes
    const newTimer = setTimeout(() => {
      console.log('💤 User idle for 5 minutes, showing welcome elements');
      if (!currentConversation || messages.length === 0) {
        setShowWelcome(true);
        setShowSuggestions(true);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    setIdleTimer(newTimer);
  };

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadInitialData();
    checkSystemHealth();
    
    // Initialize idle timer
    resetIdleTimer();
    
    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    };
  }, [fadeAnim]);

  useEffect(() => {
    // Show/hide welcome based on conversation state
    if (!currentConversation || messages.length === 0) {
      setShowWelcome(true);
      setShowSuggestions(true);
    } else {
      setShowWelcome(false);
      setShowSuggestions(false);
    }
  }, [currentConversation, messages.length]);

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
    resetIdleTimer(); // Reset idle timer on action
    
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

    resetIdleTimer(); // Reset idle timer on message send

    // Check quota
    if (quota.text >= 10) {
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
      'You\'ve used all 10 of your free AI requests for today. Upgrade to Pro for unlimited access!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => console.log('Navigate to paywall') },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    resetIdleTimer();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Copy message:', content);
  };

  const saveMessage = async (messageContent: string) => {
    resetIdleTimer();
    
    try {
      // Save the message content
      await storage.addSavedItem({
        id: Date.now().toString(),
        type: 'caption', // Default to caption for chat messages
        title: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
        payload: { content: messageContent },
        created_at: new Date().toISOString(),
      });
      
      // Provide haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success alert with option to view saved items
      Alert.alert(
        '💾 Saved Successfully!',
        'Your content has been saved to your collection.',
        [
          { text: 'Continue Chatting', style: 'cancel' },
          { 
            text: 'View Saved Items', 
            onPress: () => {
              // Navigate to the Saved tab
              router.push('/(tabs)/saved');
            }
          },
        ]
      );
      
      console.log('✅ Message saved successfully:', messageContent.substring(0, 50));
    } catch (error) {
      console.error('❌ Error saving message:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save content. Please try again.');
    }
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
        maxWidth: '85%',
        marginVertical: 8,
      }}
    >
      <BlurView intensity={20} style={{
        backgroundColor: message.role === 'user' 
          ? 'rgba(34, 197, 94, 0.2)' 
          : 'rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: message.role === 'user' 
          ? 'rgba(34, 197, 94, 0.4)' 
          : 'rgba(255, 255, 255, 0.15)',
        padding: 16,
        overflow: 'hidden',
      }}>
        {message.role === 'user' && (
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.3)', 'rgba(6, 182, 212, 0.2)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}
        
        <Text
          style={[
            commonStyles.text,
            {
              color: colors.text,
              lineHeight: 20,
            }
          ]}
        >
          {message.content}
        </Text>
      </BlurView>

      {message.role === 'assistant' && (
        <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'flex-start' }}>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
            onPress={() => copyMessage(message.content)}
          >
            <Text style={[commonStyles.textSmall, { color: colors.text }]}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: 'rgba(34, 197, 94, 0.4)',
            }}
            onPress={() => saveMessage(message.content)}
          >
            <Text style={[commonStyles.textSmall, { color: colors.success }]}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Get personalized quick actions
  const personalizedActions = getPersonalizedQuickActions(profile);

  return (
    <View style={{ flex: 1 }}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#000000', '#0F172A', '#1E293B']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {/* Header with Usage Counter */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Sidebar Toggle Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  padding: 10,
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowSidebar(true);
                }}
              >
                <Ionicons name="menu" size={18} color={colors.text} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.headerTitle, { fontSize: 20, fontWeight: '700' }]}>
                  {currentConversation?.title || 'VIRALYZE'}
                </Text>
                {isPersonalized && (
                  <Text style={[commonStyles.textSmall, { color: theme.primary, fontSize: 11 }]}>
                    Chatting as {profile?.niche || 'Content'} Creator
                  </Text>
                )}
              </View>
            </View>
            
            {/* Usage Counter Pill */}
            <PremiumQuotaPill remaining={10 - quota.text} total={10} />
          </View>

          {/* Welcome Block */}
          <WelcomeBlock
            visible={showWelcome && isPersonalized}
            profile={profile}
            welcomeMessage={welcomeMessage}
            recommendations={recommendations}
          />

          {/* Suggestion Tiles */}
          <SuggestionTiles
            visible={showSuggestions}
            actions={personalizedActions}
            onActionPress={handleQuickAction}
            disabled={quota.text >= 10}
          />

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingTop: showWelcome || showSuggestions ? 8 : 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onScrollBeginDrag={resetIdleTimer}
          >
            {messages.map(renderMessage)}
            
            {isLoading && (
              <View style={{ alignSelf: 'flex-start', marginVertical: 8 }}>
                <BlurView intensity={20} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}>
                  <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[commonStyles.textSmall, { color: colors.text }]}>AI is thinking...</Text>
                </BlurView>
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
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
            }}>
              <BlurView intensity={20} style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                marginRight: 12,
                overflow: 'hidden',
              }}>
                <TextInput
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    maxHeight: 100,
                  }}
                  placeholder={isPersonalized 
                    ? `Ask me anything about ${profile?.niche || 'content'} creation...`
                    : "Ask me anything about content creation..."
                  }
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={inputText}
                  onChangeText={(text) => {
                    setInputText(text);
                    resetIdleTimer();
                  }}
                  multiline
                  onSubmitEditing={() => sendMessage(inputText)}
                  editable={!isLoading}
                />
              </BlurView>
              
              <TouchableOpacity
                style={{
                  backgroundColor: theme.primary,
                  borderRadius: 20,
                  padding: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: (!inputText.trim() || isLoading) ? 0.5 : 1,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons 
                  name={isLoading ? 'hourglass' : 'arrow-forward'} 
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
    </View>
  );
}
