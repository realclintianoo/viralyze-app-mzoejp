
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { storage } from '../../utils/storage';
import { aiComplete } from '../../lib/ai';
import { commonStyles, colors } from '../../styles/commonStyles';

import AnimatedButton from '../../components/AnimatedButton';
import TypingIndicator from '../../components/TypingIndicator';
import UpgradeModal from '../../components/UpgradeModal';
import QuotaPill from '../../components/QuotaPill';
import AuthSheet from '../../components/AuthSheet';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  kind?: string;
}

const QUICK_ACTIONS = [
  { id: 'hooks', title: 'Hooks', icon: 'flash', prompt: 'Create 3 engaging hooks for my content' },
  { id: 'ideas', title: 'Ideas', icon: 'bulb', prompt: 'Give me 5 content ideas for this week' },
  { id: 'captions', title: 'Captions', icon: 'text', prompt: 'Write captions for my latest post' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar', prompt: 'Create a 7-day content calendar' },
];

const ChatScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [profile, setProfile] = useState(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { user, isGuest } = useAuth();
  const { quota, incrementUsage, canUseFeature, getRemainingUsage } = useQuota();
  const { showToast } = useToast();

  const loadInitialData = useCallback(async () => {
    try {
      // Load saved messages
      const savedMessages = await storage.getChatMessages();
      
      if (savedMessages.length === 0) {
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'system',
          content: `Welcome to VIRALYZE! 🚀

I'm your AI growth coach, ready to help you create viral content. Here's what I can do:

• Generate engaging hooks and scripts
• Write platform-specific captions  
• Create content calendars
• Rewrite content for different platforms
• Generate AI images for your posts

${isGuest ? `As a guest, you have ${getRemainingUsage('text')} text requests and ${getRemainingUsage('image')} image request remaining today.` : 'You have unlimited requests as a signed-in user!'}

Try the quick actions below or ask me anything!`,
          timestamp: new Date().toISOString(),
        };
        
        setMessages([welcomeMessage]);
        await storage.setChatMessages([welcomeMessage]);
      } else {
        setMessages(savedMessages);
      }

      // Load user profile
      const userProfile = await storage.getOnboardingData();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [isGuest, getRemainingUsage]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamingContent]);

  const handleQuickAction = (actionId: string) => {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
      setInputText(action.prompt);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    // Check quota
    if (!canUseFeature('text')) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsGenerating(true);
    setStreamingContent('');

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Increment usage
      await incrementUsage('text');

      // Generate AI response
      const aiResponses = await aiComplete({
        kind: 'chat',
        profile,
        input: text.trim(),
        n: 1,
        stream: true,
        onChunk: (chunk) => {
          setStreamingContent(prev => prev + chunk);
        },
        signal: abortControllerRef.current.signal,
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponses[0] || streamingContent,
        timestamp: new Date().toISOString(),
        kind: 'chat',
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await storage.setChatMessages(finalMessages);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      if (error.name !== 'AbortError') {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: 'system',
          content: `Sorry, I encountered an error: ${error.message}`,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        await storage.setChatMessages(finalMessages);
        
        showToast(error.message, 'error');
      }
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setStreamingContent('');
      showToast('Generation cancelled', 'info');
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      showToast('Copied to clipboard', 'success');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  const saveMessage = async (message: ChatMessage) => {
    if (!message.content.trim()) return;

    try {
      const savedItem = {
        id: `saved-${Date.now()}`,
        user_id: user?.id || 'guest',
        type: (message.kind as any) || 'caption',
        title: `Chat: ${message.content.substring(0, 50)}...`,
        payload: {
          content: message.content,
          generated_at: message.timestamp,
          source: 'chat',
        },
        created_at: new Date().toISOString(),
      };

      await storage.addSavedItem(savedItem);
      showToast('Saved successfully', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving message:', error);
      showToast('Failed to save', 'error');
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser && styles.userMessageContainer,
          isSystem && styles.systemMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser && styles.userMessageBubble,
            isSystem && styles.systemMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser && styles.userMessageText,
              isSystem && styles.systemMessageText,
            ]}
          >
            {message.content}
          </Text>

          {/* Action buttons for AI messages */}
          {message.type === 'ai' && (
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => copyMessage(message.content)}
              >
                <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => saveMessage(message)}
              >
                <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>VIRALYZE</Text>
            <QuotaPill />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowAuthSheet(true)}
            >
              <Ionicons
                name={isGuest ? "person-add" : "person"}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action.id)}
              >
                <Ionicons name={action.icon as any} size={16} color={colors.primary} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}

          {/* Streaming message */}
          {isGenerating && streamingContent && (
            <View style={styles.messageContainer}>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{streamingContent}</Text>
              </View>
            </View>
          )}

          {/* Typing indicator */}
          {isGenerating && !streamingContent && <TypingIndicator />}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              editable={!isGenerating}
            />
            {isGenerating ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelGeneration}
              >
                <Ionicons name="stop" size={24} color={colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || !canUseFeature('text')) && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || !canUseFeature('text')}
              >
                <Ionicons name="send" size={20} color={colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="text"
      />

      <AuthSheet
        visible={showAuthSheet}
        onClose={() => setShowAuthSheet(false)}
        onContinueAsGuest={() => {}}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  quickActions: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickActionsContent: {
    paddingHorizontal: 20,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  quickActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  systemMessageContainer: {
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  systemMessageBubble: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning + '40',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.background,
  },
  systemMessageText: {
    color: colors.text,
    textAlign: 'center',
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  cancelButton: {
    padding: 8,
  },
});

export default ChatScreen;
