
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storage } from '../../utils/storage';
import { aiComplete } from '../../utils/ai';
import { commonStyles, colors, spacing, borderRadius } from '../../styles/commonStyles';
import { ChatMessage, QuotaUsage, OnboardingData } from '../../types';

const QUICK_ACTIONS = [
  { id: 'hooks', title: 'Hooks', icon: 'flash', prompt: 'Generate 5 viral hooks for my content' },
  { id: 'ideas', title: 'Ideas', icon: 'bulb', prompt: 'Give me 3 content ideas for my niche' },
  { id: 'captions', title: 'Captions', icon: 'text', prompt: 'Write a compelling caption for my post' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar', prompt: 'Create a 7-day content calendar' },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [quotaData, profileData, chatHistory] = await Promise.all([
        storage.getQuotaUsage(),
        storage.getOnboardingData(),
        storage.getChatHistory?.() || [],
      ]);
      
      setQuota(quotaData);
      setProfile(profileData);
      if (chatHistory.length > 0) {
        setMessages(chatHistory);
      }
    } catch (error) {
      console.log('Error loading initial data:', error);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendMessage(action.prompt);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check quota
    if (quota && quota.textRequests >= quota.maxTextRequests) {
      showUpgradeModal();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await aiComplete('chat', profile, text.trim());
      
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const showUpgradeModal = () => {
    Alert.alert(
      'Daily Limit Reached',
      'You\'ve used all your free messages for today. Upgrade to Pro for unlimited access!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => console.log('Navigate to upgrade') },
      ]
    );
  };

  const copyMessage = async (content: string) => {
    // In a real app, you'd use Clipboard API
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const saveMessage = async (message: ChatMessage) => {
    try {
      await storage.addSavedItem({
        id: Date.now().toString(),
        type: 'hook', // Default type, could be determined by content
        title: message.content.substring(0, 50) + '...',
        payload: { content: message.content },
        created_at: new Date().toISOString(),
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Message saved to your collection');
    } catch (error) {
      console.log('Error saving message:', error);
      Alert.alert('Error', 'Failed to save message');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.type === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.content}
          </Text>
          
          {!isUser && (
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => copyMessage(item.content)}
              >
                <Ionicons name="copy-outline" size={16} color={colors.grey} />
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => saveMessage(item)}
              >
                <Ionicons name="bookmark-outline" size={16} color={colors.grey} />
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <View style={[styles.messageBubble, styles.aiBubble]}>
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
            <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={commonStyles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[commonStyles.h1, styles.headerTitle]}>VIRALYZE</Text>
            <View style={commonStyles.row}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerButton, styles.avatar]}>
                <Ionicons name="person" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quota Pill */}
          {quota && (
            <View style={styles.quotaPill}>
              <Text style={styles.quotaText}>
                {quota.maxTextRequests - quota.textRequests} free left today
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action.id)}
              >
                <Ionicons name={action.icon as any} size={16} color={colors.accent} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Messages */}
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={[
                styles.messagesContent,
                { paddingBottom: Platform.OS === 'ios' ? 120 : 100 }
              ]}
              ListFooterComponent={renderTypingIndicator}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            />

            {/* Input Container */}
            <View style={[
              styles.inputContainer,
              { paddingBottom: insets.bottom > 0 ? 0 : spacing.md }
            ]}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask me anything..."
                  placeholderTextColor={colors.grey}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
                
                <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                    ]}
                    onPress={() => sendMessage(inputText)}
                    disabled={!inputText.trim() || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Ionicons name="send" size={20} color={colors.white} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.accent,
  },
  quotaPill: {
    alignSelf: 'center' as const,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  quotaText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  quickActions: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
    marginLeft: spacing.xs,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end' as const,
  },
  aiMessageContainer: {
    alignItems: 'flex-start' as const,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  userBubble: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  aiBubble: {
    backgroundColor: colors.card,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: colors.text,
  },
  aiMessageText: {
    color: colors.text,
  },
  messageActions: {
    flexDirection: 'row' as const,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: spacing.md,
  },
  actionText: {
    fontSize: 13,
    color: colors.grey,
    marginLeft: spacing.xs,
  },
  typingIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grey,
    marginRight: spacing.xs,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 80,
    paddingVertical: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.grey,
  },
};
