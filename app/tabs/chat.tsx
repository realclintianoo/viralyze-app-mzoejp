
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { commonStyles, colors } from '../../styles/commonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { aiComplete } from '../../lib/ai';
import { supabase } from '../../lib/supabase';
import { storage } from '../../utils/storage';
import QuotaPill from '../../components/QuotaPill';
import TypingIndicator from '../../components/TypingIndicator';
import UpgradeModal from '../../components/UpgradeModal';
import AnimatedButton from '../../components/AnimatedButton';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  kind?: string;
}

const QUICK_ACTIONS = [
  { id: 'hooks', title: 'Hooks', icon: 'flash' as const },
  { id: 'ideas', title: 'Ideas', icon: 'bulb' as const },
  { id: 'captions', title: 'Captions', icon: 'text' as const },
  { id: 'calendar', title: 'Calendar', icon: 'calendar' as const },
];

export default function ChatScreen() {
  const { user, isGuest } = useAuth();
  const { showToast } = useToast();
  const { quota, canUseFeature, incrementUsage, getRemainingUsage } = useQuota();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, streamingContent]);

  const loadInitialData = async () => {
    try {
      if (isGuest) {
        const localProfile = await storage.getOnboardingData();
        setProfile(localProfile);
      } else if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile({
            platforms: profileData.platforms,
            niche: profileData.niche,
            followers: profileData.followers,
            goal: profileData.goal,
          });
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleQuickAction = async (actionId: string) => {
    if (!canUseFeature('text')) {
      setShowUpgradeModal(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const prompts = {
      hooks: 'Generate 5 viral hooks for my niche',
      ideas: 'Give me 5 content ideas for this week',
      captions: 'Create 3 engaging captions for my latest post',
      calendar: 'Create a 7-day content calendar for my niche',
    };

    const prompt = prompts[actionId as keyof typeof prompts];
    if (prompt) {
      await sendMessage(prompt, actionId);
    }
  };

  const sendMessage = async (text: string, kind?: string) => {
    if (!text.trim() || isTyping) return;

    if (!canUseFeature('text')) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
      kind,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setStreamingContent('');

    try {
      const controller = new AbortController();
      setAbortController(controller);

      let fullResponse = '';
      
      const responses = await aiComplete({
        kind: kind || 'general',
        profile,
        input: text,
        n: 1,
        stream: true,
        onChunk: (chunk) => {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        },
        signal: controller.signal,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: fullResponse || responses[0],
        timestamp: new Date().toISOString(),
        kind,
      };

      setMessages(prev => [...prev, aiMessage]);
      await incrementUsage('text');
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        showToast('Failed to generate response. Please try again.', 'error');
      }
    } finally {
      setIsTyping(false);
      setStreamingContent('');
      setAbortController(null);
    }
  };

  const cancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
      setStreamingContent('');
    }
  };

  const copyMessage = async (content: string) => {
    await Clipboard.setStringAsync(content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Copied to clipboard!', 'success');
  };

  const saveMessage = async (message: ChatMessage) => {
    try {
      const savedItem = {
        id: Date.now().toString(),
        user_id: user?.id,
        type: (message.kind || 'caption') as any,
        title: message.content.substring(0, 50) + '...',
        payload: { content: message.content, kind: message.kind },
        created_at: new Date().toISOString(),
      };

      if (isGuest) {
        const currentItems = await storage.getSavedItems();
        await storage.setSavedItems([...currentItems, savedItem]);
      } else if (user) {
        await supabase.from('saved_items').insert({
          user_id: user.id,
          type: savedItem.type,
          title: savedItem.title,
          payload: savedItem.payload,
        });
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast('Saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving message:', error);
      showToast('Failed to save. Please try again.', 'error');
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={styles.messageText}>{message.content}</Text>
      
      {message.type === 'ai' && (
        <View style={styles.messageActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => copyMessage(message.content)}
          >
            <Ionicons name="copy" size={16} color={colors.grey} />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => saveMessage(message)}
          >
            <Ionicons name="bookmark" size={16} color={colors.grey} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VIRALYZE</Text>
        <View style={styles.headerRight}>
          <QuotaPill
            remaining={getRemainingUsage('text')}
            total={quota.maxTextRequests}
            type="text"
          />
          <TouchableOpacity style={styles.avatarButton}>
            <Ionicons name="person-circle" size={32} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles" size={64} color={colors.grey} />
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Ask me anything about growing your social media presence
              </Text>
            </View>
          )}

          {messages.map(renderMessage)}

          {isTyping && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              {streamingContent ? (
                <Text style={styles.messageText}>{streamingContent}</Text>
              ) : (
                <TypingIndicator visible={true} />
              )}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelGeneration}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

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
                <Ionicons name={action.icon} size={16} color={colors.accent} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.grey}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={(!inputText.trim() || isTyping) ? colors.grey : colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="text"
      />
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatarButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end' as const,
    backgroundColor: colors.accent,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  aiMessage: {
    alignSelf: 'flex-start' as const,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  messageActions: {
    flexDirection: 'row' as const,
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.grey,
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: 'flex-start' as const,
  },
  cancelText: {
    fontSize: 14,
    color: colors.error,
  },
  quickActions: {
    paddingVertical: 12,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
};
