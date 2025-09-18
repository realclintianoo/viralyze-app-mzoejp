
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../app/integrations/supabase/client';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  emoji: string;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ConversationsContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createConversation: (title: string, emoji?: string) => Promise<Conversation | null>;
  selectConversation: (conversationId: string) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, content: string, role: 'user' | 'assistant') => Promise<Message | null>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  clearCurrentConversation: () => void;
  clearAllData: () => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
};

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider: React.FC<ConversationsProviderProps> = ({ children }) => {
  console.log('💬 ConversationsProvider initialized');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Define loadConversations with useCallback to prevent dependency issues
  const loadConversations = useCallback(async () => {
    console.log('💬 Loading conversations for user:', user?.id);
    
    if (!user) {
      console.log('💬 No user found, skipping conversation load');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      console.log('💬 Loaded conversations:', data?.length || 0);
      setConversations(data || []);
    } catch (err: any) {
      console.error('❌ Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Clear all conversation data
  const clearAllData = useCallback(() => {
    console.log('💬 Clearing all conversation data');
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // Effect to handle user changes
  useEffect(() => {
    console.log('💬 User changed:', !!user);
    
    if (user) {
      // User logged in, load their conversations
      loadConversations();
    } else {
      // User logged out, clear all data
      clearAllData();
    }
  }, [user, loadConversations, clearAllData]);

  const createConversation = async (title: string, emoji = '💬'): Promise<Conversation | null> => {
    console.log('💬 Creating conversation:', title);
    
    if (!user) {
      console.log('❌ No user found for conversation creation');
      return null;
    }

    setError(null);

    try {
      // First, set all other conversations to inactive
      await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { data, error: supabaseError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title,
          emoji,
          is_active: true,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const newConversation = data as Conversation;
      console.log('✅ Conversation created:', newConversation.id);
      
      setConversations(prev => [newConversation, ...prev.map(c => ({ ...c, is_active: false }))]);
      setCurrentConversation(newConversation);
      setMessages([]);

      return newConversation;
    } catch (err: any) {
      console.error('❌ Error creating conversation:', err);
      setError(err.message || 'Failed to create conversation');
      return null;
    }
  };

  const selectConversation = async (conversationId: string) => {
    console.log('💬 Selecting conversation:', conversationId);
    
    if (!user) {
      console.log('❌ No user found for conversation selection');
      return;
    }

    setError(null);

    try {
      // Set all conversations to inactive
      await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Set selected conversation to active
      const { data, error: supabaseError } = await supabase
        .from('conversations')
        .update({ is_active: true })
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const updatedConversation = data as Conversation;
      setCurrentConversation(updatedConversation);
      
      // Update local state
      setConversations(prev => 
        prev.map(c => ({ 
          ...c, 
          is_active: c.id === conversationId 
        }))
      );

      // Load messages for this conversation
      await loadMessages(conversationId);
      
      console.log('✅ Conversation selected:', conversationId);
    } catch (err: any) {
      console.error('❌ Error selecting conversation:', err);
      setError(err.message || 'Failed to select conversation');
    }
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    console.log('💬 Updating conversation:', id);
    
    if (!user) return;

    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const updatedConversation = data as Conversation;
      
      setConversations(prev => 
        prev.map(c => c.id === id ? updatedConversation : c)
      );

      if (currentConversation?.id === id) {
        setCurrentConversation(updatedConversation);
      }
      
      console.log('✅ Conversation updated:', id);
    } catch (err: any) {
      console.error('❌ Error updating conversation:', err);
      setError(err.message || 'Failed to update conversation');
    }
  };

  const deleteConversation = async (id: string) => {
    console.log('💬 Deleting conversation:', id);
    
    if (!user) return;

    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (supabaseError) {
        throw supabaseError;
      }

      setConversations(prev => prev.filter(c => c.id !== id));
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      console.log('✅ Conversation deleted:', id);
    } catch (err: any) {
      console.error('❌ Error deleting conversation:', err);
      setError(err.message || 'Failed to delete conversation');
    }
  };

  const loadMessages = async (conversationId: string) => {
    console.log('💬 Loading messages for conversation:', conversationId);
    
    if (!user) return;

    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      console.log('💬 Loaded messages:', data?.length || 0);
      setMessages(data || []);
    } catch (err: any) {
      console.error('❌ Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  };

  const addMessage = async (conversationId: string, content: string, role: 'user' | 'assistant'): Promise<Message | null> => {
    console.log('💬 Adding message to conversation:', conversationId);
    
    if (!user) return null;

    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content,
          role,
        })
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const newMessage = data as Message;
      setMessages(prev => [...prev, newMessage]);

      // Update conversation's last_message_at
      await updateConversation(conversationId, {
        last_message_at: new Date().toISOString(),
      });

      console.log('✅ Message added:', newMessage.id);
      return newMessage;
    } catch (err: any) {
      console.error('❌ Error adding message:', err);
      setError(err.message || 'Failed to add message');
      return null;
    }
  };

  const clearCurrentConversation = () => {
    console.log('💬 Clearing current conversation');
    setCurrentConversation(null);
    setMessages([]);
  };

  const value: ConversationsContextType = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    loadConversations,
    loadMessages,
    clearCurrentConversation,
    clearAllData,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};
