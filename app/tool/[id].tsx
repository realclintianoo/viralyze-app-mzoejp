
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
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
  script: {
    title: 'Script Generator',
    description: 'Generate 30-60 second scripts with Hook → Value → CTA structure',
    placeholder: 'Describe your video topic or main message...',
    icon: 'document-text' as const,
    type: 'text' as const,
  },
  hook: {
    title: 'Hook Generator',
    description: 'Create compelling opening lines under 12 words',
    placeholder: 'What topic do you want to create hooks for?',
    icon: 'flash' as const,
    type: 'text' as const,
  },
  caption: {
    title: 'Caption Generator',
    description: 'Generate engaging captions for different platforms',
    placeholder: 'Describe your post or content...',
    icon: 'text' as const,
    type: 'text' as const,
  },
  calendar: {
    title: 'Content Calendar',
    description: 'Create a 7-day content plan with posting schedules',
    placeholder: 'What type of content calendar do you need?',
    icon: 'calendar' as const,
    type: 'text' as const,
  },
  rewrite: {
    title: 'Cross-Post Rewriter',
    description: 'Adapt your content for different social media platforms',
    placeholder: 'Paste your original content here...',
    icon: 'repeat' as const,
    type: 'text' as const,
  },
  guardian: {
    title: 'Guideline Guardian',
    description: 'Check content for platform guidelines and get safe alternatives',
    placeholder: 'Paste your content to check for potential issues...',
    icon: 'shield-checkmark' as const,
    type: 'text' as const,
    isPro: true,
  },
  image: {
    title: 'AI Image Maker',
    description: 'Generate custom images for your content',
    placeholder: 'Describe the image you want to create...',
    icon: 'image' as const,
    type: 'image' as const,
  },
};

const IMAGE_SIZES = [
  { label: 'Square (1:1)', value: '1024x1024', description: 'Perfect for Instagram posts' },
  { label: 'Portrait (4:5)', value: '1024x1792', description: 'Great for Instagram Stories' },
  { label: 'Landscape (16:9)', value: '1792x1024', description: 'Ideal for YouTube thumbnails' },
];

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isGuest } = useAuth();
  const { showToast } = useToast();
  const { quota, canUseFeature, incrementUsage } = useQuota();
  
  const [input, setInput] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const tool = TOOL_CONFIG[id as keyof typeof TOOL_CONFIG];

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (tool?.isPro && !quota.isPro) {
      setShowUpgradeModal(true);
    }
  }, [tool, quota.isPro]);

  const loadProfile = async () => {
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
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      showToast('Please enter some input first', 'warning');
      return;
    }

    if (tool?.isPro && !quota.isPro) {
      setShowUpgradeModal(true);
      return;
    }

    if (!canUseFeature(tool?.type || 'text')) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      if (tool?.type === 'image') {
        const imageUrl = await aiImage(input, selectedSize as any);
        setResults([imageUrl]);
        await incrementUsage('image');
      } else {
        const responses = await aiComplete({
          kind: id || 'general',
          profile,
          input,
          n: 3,
        });
        setResults(responses);
        await incrementUsage('text');
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      console.error('Error generating content:', error);
      showToast(error.message || 'Failed to generate content. Please try again.', 'error');
    } finally {
      setLoading(false);
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
        id: Date.now().toString(),
        user_id: user?.id,
        type: (tool?.type === 'image' ? 'image' : id) as any,
        title: tool?.type === 'image' 
          ? `Generated Image ${index + 1}` 
          : content.substring(0, 50) + '...',
        payload: { 
          content, 
          kind: id,
          ...(tool?.type === 'image' && { imageUrl: content, size: selectedSize })
        },
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

  const handleRefine = (content: string) => {
    setInput(`Refine this ${tool?.title.toLowerCase()}: ${content}`);
    setResults([]);
  };

  if (!tool) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={[commonStyles.container, commonStyles.center]}>
          <Text style={commonStyles.text}>Tool not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolInfo}>
          <View style={styles.toolIcon}>
            <Ionicons name={tool.icon} size={32} color={colors.accent} />
          </View>
          <Text style={styles.toolTitle}>{tool.title}</Text>
          <Text style={styles.toolDescription}>{tool.description}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Input</Text>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={tool.placeholder}
            placeholderTextColor={colors.grey}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />

          {tool.type === 'image' && (
            <View style={styles.sizeSelector}>
              <Text style={styles.sectionTitle}>Image Size</Text>
              {IMAGE_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.value}
                  style={[
                    styles.sizeOption,
                    selectedSize === size.value && styles.sizeOptionSelected,
                  ]}
                  onPress={() => setSelectedSize(size.value)}
                >
                  <View style={styles.sizeInfo}>
                    <Text style={[
                      styles.sizeLabel,
                      selectedSize === size.value && styles.sizeTextSelected,
                    ]}>
                      {size.label}
                    </Text>
                    <Text style={[
                      styles.sizeDescription,
                      selectedSize === size.value && styles.sizeTextSelected,
                    ]}>
                      {size.description}
                    </Text>
                  </View>
                  {selectedSize === size.value && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <AnimatedButton
            title={loading ? 'Generating...' : 'Generate'}
            onPress={handleGenerate}
            disabled={loading || !input.trim()}
            style={styles.generateButton}
          />
        </View>

        {loading && (
          <View style={styles.loadingSection}>
            <Text style={styles.sectionTitle}>Generating Results...</Text>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <SkeletonLoader height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader height={60} />
              </View>
            ))}
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Results</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                {tool.type === 'image' ? (
                  <View style={styles.imageResult}>
                    <Text style={styles.resultTitle}>Generated Image {index + 1}</Text>
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image" size={48} color={colors.grey} />
                      <Text style={styles.imageUrl}>{result}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.resultTitle}>Variant {index + 1}</Text>
                    <Text style={styles.resultContent}>{result}</Text>
                  </>
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
      </ScrollView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type={tool.type as 'text' | 'image'}
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  headerRight: {
    width: 32,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  toolInfo: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  toolIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  toolTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  toolDescription: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top' as const,
    minHeight: 100,
    marginBottom: 16,
  },
  sizeSelector: {
    marginBottom: 16,
  },
  sizeOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sizeOptionSelected: {
    backgroundColor: colors.accent + '20',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  sizeInfo: {
    flex: 1,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: 2,
  },
  sizeDescription: {
    fontSize: 14,
    color: colors.grey,
  },
  sizeTextSelected: {
    color: colors.accent,
  },
  generateButton: {
    width: '100%',
  },
  loadingSection: {
    marginBottom: 24,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  resultContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  imageResult: {
    alignItems: 'center' as const,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  imageUrl: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 8,
    textAlign: 'center' as const,
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
};
