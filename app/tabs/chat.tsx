
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
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { aiComplete } from '../../utils/ai';
import { ChatMessage, QuotaUsage, OnboardingData } from '../../types';

const QUICK_ACTIONS = [
  { id: 'hooks', label: 'Hooks', icon: 'flash' as keyof typeof Ionicons.glyphMap },
  { id: 'ideas', label: 'Ideas', icon: 'bulb' as keyof typeof Ionicons.glyphMap },
  { id: 'captions', label: 'Captions', icon: 'text' as keyof typeof Ionicons.glyphMap },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' as keyof typeof Ionicons.glyphMap },
  { id: 'rewriter', label: 'Rewriter', icon: 'repeat' as keyof typeof Ionicons.glyphMap },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [quotaData, profileData] = await Promise.all([
        storage.getQuotaUsage(),
        storage.getOnboardingData(),
      ]);
      setQuota(quotaData);
      setProfile(profileData);
    } catch (error) {
      console.log('Error loading initial data:', error);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    if (!quota || quota.textRequests >= quota.maxTextRequests) {
      showUpgradeModal();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const prompts = {
      hooks: 'Generate 5 viral hooks for my content',
      ideas: 'Give me 5 content ideas for this week',
      captions: 'Write a engaging caption for my next post',
      calendar: 'Create a 7-day content calendar for me',
      rewriter: 'Help me rewrite my caption for different platforms',
    };

    const prompt = prompts[actionId as keyof typeof prompts] || prompts.hooks;
    await sendMessage(prompt, actionId);
  };

  const sendMessage = async (text: string, actionType?: string) => {
    if (!text.trim() || isLoading) return;

    if (!quota || quota.textRequests >= quota.maxTextRequests) {
      showUpgradeModal();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiComplete(actionType || 'chat', profile, text);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update quota
      const updatedQuota = await storage.updateQuotaUsage(1, 0);
      setQuota(updatedQuota);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error sending message:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showUpgradeModal = () => {
    Alert.alert(
      'Upgrade to Pro',
      'You&apos;ve reached your daily limit. Upgrade to Pro for unlimited AI requests!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => console.log('Upgrade pressed') },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    // In a real app, you'd use Clipboard API
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const saveMessage = async (message: ChatMessage) => {
    try {
      await storage.addSavedItem({
        id: Date.now().toString(),
        type: 'hook', // Default type, could be determined by context
        title: message.content.substring(0, 50) + '...',
        payload: { content: message.content },
        created_at: new Date().toISOString(),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Message saved to your collection');
    } catch (error) {
      console.log('Error saving message:', error);
      Alert.alert('Error', 'Failed to save message');
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={{
        alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginVertical: 4,
      }}
    >
      <View
        style={[
          commonStyles.card,
          {
            backgroundColor: message.type === 'user' ? colors.accent : colors.card,
            marginVertical: 4,
          },
        ]}
      >
        <Text
          style={[
            commonStyles.text,
            { color: message.type === 'user' ? colors.white : colors.text },
          ]}
        >
          {message.content}
        </Text>
      </View>
      
      {message.type === 'ai' && (
        <View style={[commonStyles.row, { marginTop: 8, gap: 12 }]}>
          <TouchableOpacity
            style={[commonStyles.row, { alignItems: 'center', gap: 4 }]}
            onPress={() => copyMessage(message.content)}
          >
            <Ionicons name="copy-outline" size={16} color={colors.grey} />
            <Text style={[commonStyles.smallText, { color: colors.grey }]}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[commonStyles.row, { alignItems: 'center', gap: 4 }]}
            onPress={() => saveMessage(message)}
          >
            <Ionicons name="bookmark-outline" size={16} color={colors.grey} />
            <Text style={[commonStyles.smallText, { color: colors.grey }]}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[commonStyles.row, { alignItems: 'center', gap: 4 }]}
            onPress={() => setInputText(`Refine this: ${message.content}`)}
          >
            <Ionicons name="create-outline" size={16} color={colors.grey} />
            <Text style={[commonStyles.smallText, { color: colors.grey }]}>Refine</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[
          commonStyles.row,
          commonStyles.spaceBetween,
          { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }
        ]}>
          <Text style={[commonStyles.title, { fontSize: 20, marginBottom: 0 }]}>
            VIRALYZE
          </Text>
          <View style={[commonStyles.row, { gap: 16 }]}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: colors.white, fontWeight: '600' }}>U</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quota Display */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>
            {quota ? `${quota.maxTextRequests - quota.textRequests} free left today` : 'Loading...'}
          </Text>
        </View>

        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 80 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[commonStyles.chip, { alignItems: 'center', minWidth: 80 }]}
              onPress={() => handleQuickAction(action.id)}
            >
              <Ionicons name={action.icon} size={20} color={colors.text} />
              <Text style={[commonStyles.chipText, { marginTop: 4, fontSize: 12 }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={[commonStyles.center, { flex: 1, paddingVertical: 60 }]}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.grey} />
              <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
                Welcome to VIRALYZE!
              </Text>
              <Text style={[commonStyles.smallText, { textAlign: 'center', marginTop: 8 }]}>
                Ask me anything about growing your social media presence
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
          
          {isLoading && (
            <View style={[commonStyles.row, { alignItems: 'center', gap: 8, marginTop: 16 }]}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={commonStyles.smallText}>AI is typing...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}>
          <View style={[commonStyles.row, { gap: 12 }]}>
            <TextInput
              style={[
                commonStyles.input,
                { flex: 1, marginVertical: 0 }
              ]}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.grey}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                commonStyles.button,
                { paddingHorizontal: 16, opacity: inputText.trim() ? 1 : 0.5 }
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
