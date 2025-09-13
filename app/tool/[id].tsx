
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { commonStyles, colors } from '../../styles/commonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { aiComplete, aiImage } from '../../lib/ai';
import { supabase } from '../../lib/supabase';
import { storage } from '../../utils/storage';
import AnimatedButton from '../../components/AnimatedButton';
import SkeletonLoader from '../../components/SkeletonLoader';
import UpgradeModal from '../../components/UpgradeModal';

const TOOL_CONFIG = {
  'script-generator': {
    title: 'Script Generator',
    icon: 'videocam' as const,
    placeholder: 'Describe your video topic...',
    type: 'text' as const,
  },
  'hook-generator': {
    title: 'Hook Generator',
    icon: 'flash' as const,
    placeholder: 'What topic do you want hooks for?',
    type: 'text' as const,
  },
  'caption-generator': {
    title: 'Caption Generator',
    icon: 'text' as const,
    placeholder: 'Describe your post content...',
    type: 'text' as const,
  },
  'calendar': {
    title: 'Content Calendar',
    icon: 'calendar' as const,
    placeholder: 'What type of content calendar do you need?',
    type: 'text' as const,
  },
  'rewriter': {
    title: 'Cross-Post Rewriter',
    icon: 'repeat' as const,
    placeholder: 'Paste your content to rewrite for different platforms...',
    type: 'text' as const,
  },
  'ai-image': {
    title: 'AI Image Maker',
    icon: 'image' as const,
    placeholder: 'Describe the image you want to create...',
    type: 'image' as const,
  },
};

const IMAGE_SIZES = [
  { label: 'Square (1:1)', value: '1024x1024' as const },
  { label: 'Landscape (16:9)', value: '1792x1024' as const },
  { label: 'Portrait (9:16)', value: '1024x1792' as const },
];

export default function ToolScreen() {
  const { user, isGuest } = useAuth();
  const { showToast } = useToast();
  const { quota, canUseFeature, incrementUsage, getRemainingUsage } = useQuota();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [input, setInput] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedImageSize, setSelectedImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');

  const tool = TOOL_CONFIG[id as keyof typeof TOOL_CONFIG];

  const loadProfile = useCallback(async () => {
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
      console.error('Error loading profile:', error);
    }
  }, [isGuest, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!tool) {
      router.back();
      return;
    }

    const featureType = tool.type === 'image' ? 'image' : 'text';
    if (!canUseFeature(featureType)) {
      setShowUpgradeModal(true);
    }
  }, [tool, quota.isPro]);

  const handleGenerate = async () => {
    if (!input.trim() || isLoading) return;

    const featureType = tool.type === 'image' ? 'image' : 'text';
    if (!canUseFeature(featureType)) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (tool.type === 'image') {
        const imageUrl = await aiImage(input.trim(), selectedImageSize);
        setResults([imageUrl]);
      } else {
        const responses = await aiComplete({
          kind: id || 'general',
          profile,
          input: input.trim(),
          n: 3,
        });
        setResults(responses);
      }

      await incrementUsage(featureType);
    } catch (error: any) {
      console.error('Error generating content:', error);
      
      // Show specific error messages based on the error type
      if (error.message.includes('API key not configured')) {
        Alert.alert(
          'OpenAI API Key Required',
          'To use AI features, you need to add your OpenAI API key to the .env file. Get your API key from https://platform.openai.com/api-keys',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (error.message.includes('Invalid OpenAI API key')) {
        Alert.alert(
          'Invalid API Key',
          'Your OpenAI API key appears to be invalid. Please check your API key in the .env file.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (error.message.includes('rate limit')) {
        showToast('Rate limit exceeded. Please try again later.', 'error');
      } else if (error.message.includes('Network error')) {
        showToast('Network error. Please check your connection.', 'error');
      } else {
        showToast('Failed to generate content. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    await Clipboard.setStringAsync(content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Copied to clipboard!', 'success');
  };

  const handleSave = async (content: string, index: number) => {
    try {
      const savedItem = {
        id: Date.now().toString() + index,
        user_id: user?.id,
        type: (tool.type === 'image' ? 'image' : id) as any,
        title: tool.type === 'image' ? `Generated Image ${index + 1}` : content.substring(0, 50) + '...',
        payload: { content, tool: id },
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
      console.error('Error saving content:', error);
      showToast('Failed to save. Please try again.', 'error');
    }
  };

  const handleRefine = async (content: string) => {
    setInput(`Refine this: ${content}`);
    setResults([]);
  };

  if (!tool) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Tool not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const featureType = tool.type === 'image' ? 'image' : 'text';

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tool.title}</Text>
        <View style={styles.quotaContainer}>
          <Text style={styles.quotaText}>
            {getRemainingUsage(featureType)} left
          </Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={tool.placeholder}
            placeholderTextColor={colors.grey}
            multiline
            maxLength={500}
          />

          {tool.type === 'image' && (
            <View style={styles.imageSizeSelector}>
              <Text style={styles.sectionTitle}>Image Size</Text>
              <View style={styles.sizeOptions}>
                {IMAGE_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size.value}
                    style={[
                      styles.sizeOption,
                      selectedImageSize === size.value && styles.sizeOptionSelected,
                    ]}
                    onPress={() => setSelectedImageSize(size.value)}
                  >
                    <Text
                      style={[
                        styles.sizeOptionText,
                        selectedImageSize === size.value && styles.sizeOptionTextSelected,
                      ]}
                    >
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <AnimatedButton
            title={isLoading ? 'Generating...' : 'Generate'}
            onPress={handleGenerate}
            disabled={!input.trim() || isLoading}
            style={styles.generateButton}
          />
        </View>

        {isLoading && (
          <View style={styles.loadingSection}>
            <SkeletonLoader />
            <Text style={styles.loadingText}>
              {tool.type === 'image' ? 'Creating your image...' : 'Generating content...'}
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Results</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                {tool.type === 'image' ? (
                  <View style={styles.imageResult}>
                    <Text style={styles.resultText}>Image generated successfully!</Text>
                    <Text style={styles.imageUrl}>{result}</Text>
                  </View>
                ) : (
                  <Text style={styles.resultText}>{result}</Text>
                )}
                
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCopy(result)}
                  >
                    <Ionicons name="copy" size={16} color={colors.accent} />
                    <Text style={styles.actionText}>Copy</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSave(result, index)}
                  >
                    <Ionicons name="bookmark" size={16} color={colors.accent} />
                    <Text style={styles.actionText}>Save</Text>
                  </TouchableOpacity>
                  
                  {tool.type !== 'image' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRefine(result)}
                    >
                      <Ionicons name="refresh" size={16} color={colors.accent} />
                      <Text style={styles.actionText}>Refine</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {results.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name={tool.icon} size={64} color={colors.grey} />
            <Text style={styles.emptyTitle}>Ready to generate</Text>
            <Text style={styles.emptySubtitle}>
              Enter your prompt above and tap Generate to get started
            </Text>
            <Text style={styles.setupNote}>
              💡 Make sure to add your OpenAI API key to use AI features
            </Text>
          </View>
        )}
      </ScrollView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type={featureType}
      />
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    textAlign: 'center' as const,
  },
  quotaContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quotaText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top' as const,
    marginBottom: 16,
  },
  imageSizeSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  sizeOptions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  sizeOption: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
  },
  sizeOptionSelected: {
    backgroundColor: colors.accent,
  },
  sizeOptionText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center' as const,
  },
  sizeOptionTextSelected: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  generateButton: {
    marginTop: 8,
  },
  loadingSection: {
    alignItems: 'center' as const,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
    marginTop: 16,
  },
  resultsSection: {
    marginTop: 24,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  imageResult: {
    marginBottom: 12,
  },
  imageUrl: {
    fontSize: 12,
    color: colors.grey,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  resultActions: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  emptyState: {
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
    marginBottom: 16,
  },
  setupNote: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center' as const,
    marginTop: 50,
  },
};
