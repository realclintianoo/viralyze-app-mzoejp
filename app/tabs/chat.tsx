
import { useConversations } from '../../contexts/ConversationsContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
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
import { storage } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPersonalizedQuickActions } from '../../utils/personalization';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ChatMessage, QuotaUsage, OnboardingData } from '../../types';
import { quickHealthCheck } from '../../utils/systemCheck';
import PremiumSidebar from '../../components/PremiumSidebar';

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

const PremiumQuotaPill: React.FC<PremiumQuotaPillProps> = ({ remaining, total }) => {
  const glowAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
    shadowRadius: 8 + glowAnim.value * 4,
  }));

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [remaining]);

  const getColor = () => {
    const percentage = remaining / total;
    if (percentage > 0.6) return colors.success;
    if (percentage > 0.3) return colors.warning;
    return colors.error;
  };

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        top: 60,
        right: 16,
        zIndex: 1000,
        backgroundColor: colors.glassBackgroundStrong,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: colors.glassBorderStrong,
        shadowColor: getColor(),
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
      },
      animatedStyle
    ]}>
      <Text style={[
        commonStyles.textBold,
        { color: getColor(), fontSize: 12 }
      ]}>
        {remaining}/{total} Free Left Today
      </Text>
    </Animated.View>
  );
};

const WelcomeBlock: React.FC<WelcomeBlockProps> = ({ 
  visible, 
  profile, 
  welcomeMessage, 
  recommendations 
}) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(-20);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 600 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(-20, { duration: 300 });
    }
  }, [visible]);

  const getNicheEmoji = () => {
    if (!profile?.niche) return '👋';
    const niche = profile.niche.toLowerCase();
    const emojiMap: Record<string, string> = {
      fitness: '💪',
      tech: '💻',
      fashion: '👗',
      music: '🎵',
      food: '🍕',
      beauty: '💄',
      travel: '✈️',
      gaming: '🎮',
      business: '💼',
      lifestyle: '🌟',
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (niche.includes(key)) return emoji;
    }
    return '🚀';
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        margin: 16,
        marginTop: 100,
        padding: 24,
        backgroundColor: colors.glassBackground,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.glassBorder,
      },
      animatedStyle
    ]}>
      <BlurView intensity={20} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 24,
      }} />
      
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>
          {getNicheEmoji()}
        </Text>
        <Text style={[commonStyles.title, { textAlign: 'center', fontSize: 20 }]}>
          {welcomeMessage}
        </Text>
      </View>
      
      {recommendations.length > 0 && (
        <View>
          <Text style={[commonStyles.textBold, { marginBottom: 12, color: colors.accent }]}>
            Personalized for you:
          </Text>
          {recommendations.slice(0, 3).map((rec, index) => (
            <Text key={index} style={[
              commonStyles.textSmall,
              { marginBottom: 4, color: colors.textSecondary }
            ]}>
              • {rec}
            </Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const PremiumSuggestionTile: React.FC<PremiumSuggestionTileProps> = ({ 
  action, 
  index, 
  onPress, 
  disabled 
}) => {
  const scaleAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
  }, [index]);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Animated.View style={[{ flex: 1, margin: 4 }, animatedStyle]}>
      <TouchableOpacity
        style={[
          {
            backgroundColor: disabled ? colors.backgroundSecondary : colors.glassBackgroundStrong,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: disabled ? colors.backgroundTertiary : colors.glassBorderStrong,
            opacity: disabled ? 0.5 : 1,
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={action.icon} 
          size={20} 
          color={disabled ? colors.textTertiary : colors.accent} 
          style={{ marginBottom: 8 }}
        />
        <Text style={[
          commonStyles.textBold,
          { 
            fontSize: 12, 
            textAlign: 'center',
            color: disabled ? colors.textTertiary : colors.text
          }
        ]}>
          {action.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SuggestionTiles: React.FC<SuggestionTilesProps> = ({ 
  visible, 
  actions, 
  onActionPress, 
  disabled 
}) => {
  const slideAnim = useSharedValue(30);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
      fadeAnim.value = withTiming(1, { duration: 600 });
    } else {
      slideAnim.value = withTiming(30, { duration: 300 });
      fadeAnim.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
      },
      animatedStyle
    ]}>
      {actions.slice(0, 3).map((action, index) => (
        <PremiumSuggestionTile
          key={action.id}
          action={action}
          index={index}
          onPress={() => onActionPress(action.id)}
          disabled={disabled}
        />
      ))}
    </Animated.View>
  );
};

export default function ChatScreen() {
  console.log('💬 Chat screen rendered');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const fadeAnim = useSharedValue(0);
  
  const { profile, welcomeMessage, recommendations, chatContext } = usePersonalization();
  const { currentConversation, messages: conversationMessages, addMessage } = useConversations();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadInitialData();
    checkSystemHealth();
  }, []);

  useEffect(() => {
    if (currentConversation && conversationMessages.length > 0) {
      setMessages(conversationMessages);
      setShowWelcome(false);
      setShowSuggestions(false);
    }
  }, [currentConversation, conversationMessages.length]);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    setShowWelcome(false);
    setShowSuggestions(false);
    
    idleTimerRef.current = setTimeout(() => {
      if (messages.length === 0) {
        setShowWelcome(true);
        setShowSuggestions(true);
      }
    }, 300000); // 5 minutes
  };

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

  const handleQuickAction = (actionId: string) => {
    const actionPrompts: Record<string, string> = {
      hooks: `Generate 5 viral hooks for ${profile?.niche || 'general'} content`,
      ideas: `Give me 3 content ideas for ${profile?.niche || 'general'} creators`,
      captions: `Write 3 engaging captions for ${profile?.niche || 'general'} posts`,
      calendar: `Create a 7-day content calendar for ${profile?.niche || 'general'}`,
      rewriter: `Help me rewrite content for different platforms`,
    };

    const prompt = actionPrompts[actionId];
    if (prompt) {
      setInputText(prompt);
      sendMessage(prompt);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check quota - Updated to use 10 instead of 2
    if (quota.text >= 10) {
      showUpgradeModal();
      return;
    }

    // Check OpenAI configuration
    const configCheck = await checkOpenAIConfig();
    if (!configCheck.isValid) {
      showConfigurationError();
      return;
    }

    resetIdleTimer();
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Add message to conversation
      await addMessage(userMessage);

      // Generate AI response with personalized context
      const aiResponse = await aiComplete('chat', profile, text, chatContext);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      await addMessage(assistantMessage);

      // Update quota
      const newQuota = await storage.updateQuotaUsage(1, 0);
      setQuota(newQuota);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showConfigurationError = () => {
    Alert.alert(
      'Configuration Error',
      'AI features are not properly configured. Please check your OpenAI settings.',
      [{ text: 'OK' }]
    );
  };

  const showUpgradeModal = () => {
    Alert.alert(
      'Daily Limit Reached',
      'You\'ve used all 10 of your free AI requests today. Upgrade to Pro for unlimited access!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => console.log('Navigate to upgrade') },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    try {
      // In a real app, you'd use Clipboard API
      console.log('Copying message:', content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error copying message:', error);
    }
  };

  const saveMessage = async (messageContent: string) => {
    try {
      const savedItem = {
        id: Date.now().toString(),
        type: 'chat' as const,
        title: messageContent.slice(0, 50) + '...',
        payload: { content: messageContent },
        created_at: new Date().toISOString(),
      };
      
      await storage.addSavedItem(savedItem);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const getNicheEmoji = () => {
    if (!profile?.niche) return '🤖';
    const niche = profile.niche.toLowerCase();
    const emojiMap: Record<string, string> = {
      fitness: '💪',
      tech: '💻',
      fashion: '👗',
      music: '🎵',
      food: '🍕',
      beauty: '💄',
      travel: '✈️',
      gaming: '🎮',
      business: '💼',
      lifestyle: '🌟',
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (niche.includes(key)) return emoji;
    }
    return '🚀';
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          commonStyles.messageContainer,
          isUser ? commonStyles.userMessage : commonStyles.assistantMessage,
        ]}
      >
        {!isUser && (
          <View style={commonStyles.messageAvatar}>
            <Text style={{ fontSize: 16 }}>{getNicheEmoji()}</Text>
          </View>
        )}
        
        <View style={[
          commonStyles.messageBubble,
          isUser ? commonStyles.userBubble : commonStyles.assistantBubble,
        ]}>
          <Text style={[
            commonStyles.messageText,
            isUser ? commonStyles.userMessageText : commonStyles.assistantMessageText,
          ]}>
            {message.content}
          </Text>
          
          {!isUser && (
            <View style={commonStyles.messageActions}>
              <TouchableOpacity
                style={commonStyles.messageAction}
                onPress={() => copyMessage(message.content)}
              >
                <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={commonStyles.messageAction}
                onPress={() => saveMessage(message.content)}
              >
                <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const quickActions = getPersonalizedQuickActions(profile);
  const remainingQuota = 10 - quota.text; // Updated to use 10 instead of 2
  const isQuotaExceeded = quota.text >= 10; // Updated to use 10 instead of 2

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {/* Header */}
        <View style={commonStyles.header}>
          <TouchableOpacity
            style={commonStyles.headerButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={commonStyles.headerTitle}>VIRALYZE</Text>
          
          <View style={commonStyles.headerRight}>
            <TouchableOpacity style={commonStyles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={commonStyles.headerButton}>
              <Ionicons name="person-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quota Pill */}
        <PremiumQuotaPill remaining={remainingQuota} total={10} />

        {/* Chat Content */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome Block */}
            <WelcomeBlock
              visible={showWelcome}
              profile={profile}
              welcomeMessage={welcomeMessage}
              recommendations={recommendations}
            />

            {/* Messages */}
            {messages.map(renderMessage)}

            {/* Loading Indicator */}
            {isLoading && (
              <View style={commonStyles.messageContainer}>
                <View style={commonStyles.messageAvatar}>
                  <Text style={{ fontSize: 16 }}>{getNicheEmoji()}</Text>
                </View>
                <View style={[commonStyles.messageBubble, commonStyles.assistantBubble]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[commonStyles.messageText, { marginLeft: 8 }]}>
                    Thinking...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Suggestion Tiles */}
          <SuggestionTiles
            visible={showSuggestions}
            actions={quickActions}
            onActionPress={handleQuickAction}
            disabled={isQuotaExceeded}
          />

          {/* Input Area */}
          <View style={commonStyles.inputContainer}>
            <View style={commonStyles.inputWrapper}>
              <TextInput
                style={commonStyles.textInput}
                placeholder={`Ask me anything about ${profile?.niche || 'content creation'}...`}
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onFocus={resetIdleTimer}
              />
              
              <TouchableOpacity
                style={[
                  commonStyles.sendButton,
                  (!inputText.trim() || isLoading || isQuotaExceeded) && { opacity: 0.5 }
                ]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading || isQuotaExceeded}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={commonStyles.sendButtonGradient}
                >
                  <Ionicons name="arrow-up" size={20} color={colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Premium Sidebar */}
        <PremiumSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
