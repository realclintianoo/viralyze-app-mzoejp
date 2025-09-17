
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, QuotaUsage, OnboardingData } from '../../types';
import { quickHealthCheck } from '../../utils/systemCheck';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { aiComplete, checkOpenAIConfig } from '../../lib/ai';

const QUICK_ACTIONS = [
  { id: 'hooks', title: 'Hooks', icon: 'fish' as keyof typeof Ionicons.glyphMap },
  { id: 'ideas', title: 'Ideas', icon: 'bulb' as keyof typeof Ionicons.glyphMap },
  { id: 'captions', title: 'Captions', icon: 'text' as keyof typeof Ionicons.glyphMap },
  { id: 'calendar', title: 'Calendar', icon: 'calendar' as keyof typeof Ionicons.glyphMap },
  { id: 'rewriter', title: 'Rewriter', icon: 'refresh' as keyof typeof Ionicons.glyphMap },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadInitialData();
    checkSystemHealth();
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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
      rewriter: 'Help me rewrite content for different social media platforms',
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
      'OpenAI Configuration Required',
      `AI features are not working because:\n\n${configError}\n\nCurrent API key: "${currentApiKey}"\n\nTo fix this:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Open the .env file in your project\n4. Replace the placeholder with your actual key\n5. Restart the app\n6. Make sure billing is set up in OpenAI`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const showUpgradeModal = () => {
    Alert.alert(
      'Daily Limit Reached',
      'You\'ve used all your free AI requests for today. Upgrade to Pro for unlimited access!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', style: 'default' },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    // Copy functionality would be implemented here
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const saveMessage = async (message: ChatMessage) => {
    // Save functionality would be implemented here
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Saved', 'Message saved to your collection');
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        commonStyles.card,
        {
          alignSelf: message.isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          marginBottom: 12,
          backgroundColor: message.isUser 
            ? colors.primary 
            : message.isError 
              ? '#FEE2E2' 
              : colors.card,
        },
      ]}
    >
      <Text
        style={[
          commonStyles.text,
          {
            color: message.isUser 
              ? 'white' 
              : message.isError 
                ? '#DC2626' 
                : colors.text,
          },
        ]}
      >
        {message.content}
      </Text>

      {!message.isUser && !message.isError && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => copyMessage(message.content)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="copy" size={14} color={colors.textSecondary} />
            <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
              Copy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => saveMessage(message)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="bookmark" size={14} color={colors.textSecondary} />
            <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderConfigurationWarning = () => {
    if (systemHealthy) return null;

    return (
      <View
        style={[
          commonStyles.card,
          {
            backgroundColor: '#FFF3CD',
            borderColor: '#F59E0B',
            borderWidth: 1,
            marginBottom: 16,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="warning" size={24} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.textBold, { color: '#D97706' }]}>
              AI Not Configured
            </Text>
            <Text style={[commonStyles.textSmall, { color: '#B45309', marginTop: 4 }]}>
              Your OpenAI API key needs to be set up for AI features to work.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={showConfigurationError}
          style={{
            backgroundColor: '#D97706',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <Text style={[commonStyles.textBold, { color: 'white', textAlign: 'center' }]}>
            Fix Configuration
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>VIRALYZE</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity>
            <Ionicons name="notifications" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="person-circle" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quota */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
          {2 - quota.text} free left today
        </Text>
      </View>

      {/* Configuration Warning */}
      <View style={{ paddingHorizontal: 20 }}>
        {renderConfigurationWarning()}
      </View>

      {/* Quick Actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handleQuickAction(action.id)}
            style={[
              commonStyles.card,
              {
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                opacity: systemHealthy ? 1 : 0.5,
              },
            ]}
            disabled={!systemHealthy}
          >
            <Ionicons name={action.icon} size={16} color={colors.primary} />
            <Text style={[commonStyles.textBold, { color: colors.text }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="chatbubbles" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textLarge, { marginTop: 16, textAlign: 'center' }]}>
              Welcome to VIRALYZE
            </Text>
            <Text style={[commonStyles.text, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              {systemHealthy 
                ? 'Ask me anything about growing your social media presence!'
                : 'Configure your OpenAI API key to start chatting with AI'
              }
            </Text>
          </View>
        )}

        {messages.map(renderMessage)}

        {isLoading && (
          <View style={[commonStyles.card, { alignSelf: 'flex-start', maxWidth: '85%' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[commonStyles.textSmall, { color: colors.textSecondary, marginTop: 8 }]}>
              AI is thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ paddingHorizontal: 20, paddingBottom: 20 }}
      >
        <View
          style={[
            commonStyles.card,
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
            },
          ]}
        >
          <TextInput
            style={[
              commonStyles.text,
              {
                flex: 1,
                color: colors.text,
                maxHeight: 100,
              },
            ]}
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
              backgroundColor: (!inputText.trim() || isLoading || !systemHealthy) 
                ? colors.textSecondary 
                : colors.primary,
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Ionicons name="send" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
