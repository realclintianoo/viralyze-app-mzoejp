
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { storage } from '../../utils/storage';
import { aiComplete, aiImage } from '../../lib/ai';
import { commonStyles, colors } from '../../styles/commonStyles';

import AnimatedButton from '../../components/AnimatedButton';
import SkeletonLoader from '../../components/SkeletonLoader';
import UpgradeModal from '../../components/UpgradeModal';

const TOOL_CONFIG = {
  script: {
    title: 'Script Generator',
    description: 'Generate 30-60 second scripts with Hook → Value → CTA structure',
    icon: 'videocam',
    placeholder: 'Describe your video topic...',
    type: 'text' as const,
  },
  hook: {
    title: 'Hook Generator',
    description: 'Create compelling opening lines under 12 words',
    icon: 'flash',
    placeholder: 'What topic do you want hooks for?',
    type: 'text' as const,
  },
  caption: {
    title: 'Caption Generator',
    description: 'Write engaging captions for your posts',
    icon: 'text',
    placeholder: 'Describe your post content...',
    type: 'text' as const,
  },
  calendar: {
    title: 'Content Calendar',
    description: 'Get a 7-day content plan with posting times',
    icon: 'calendar',
    placeholder: 'What type of content calendar do you need?',
    type: 'text' as const,
  },
  rewriter: {
    title: 'Cross-Post Rewriter',
    description: 'Adapt content for different platforms',
    icon: 'repeat',
    placeholder: 'Paste your content to rewrite...',
    type: 'text' as const,
  },
  guardian: {
    title: 'Guideline Guardian',
    description: 'Check content for platform guidelines (Pro)',
    icon: 'shield-checkmark',
    placeholder: 'Paste your content to check...',
    type: 'text' as const,
    isPro: true,
  },
  image: {
    title: 'AI Image Maker',
    description: 'Generate images with AI',
    icon: 'image',
    placeholder: 'Describe the image you want...',
    type: 'image' as const,
  },
};

const IMAGE_SIZES = [
  { label: 'Square (1:1)', value: '1024x1024' as const },
  { label: 'Portrait (4:5)', value: '1024x1792' as const },
  { label: 'Landscape (16:9)', value: '1792x1024' as const },
];

const ToolScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [input, setInput] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedImageSize, setSelectedImageSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');

  const { user } = useAuth();
  const { quota, incrementUsage, canUseFeature } = useQuota();
  const { showToast } = useToast();

  const tool = TOOL_CONFIG[id as keyof typeof TOOL_CONFIG];

  const loadProfile = useCallback(async () => {
    try {
      const userProfile = await storage.getOnboardingData();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!tool) {
      router.back();
      return;
    }

    // Check if Pro tool and user doesn't have Pro
    if (tool.isPro && !quota.isPro) {
      // Allow access but show upgrade modal when trying to use
    }
  }, [tool, quota.isPro]);

  if (!tool) {
    return null;
  }

  const handleGenerate = async () => {
    if (!input.trim()) {
      showToast('Please enter some input', 'error');
      return;
    }

    // Check quota
    if (!canUseFeature(tool.type)) {
      setShowUpgradeModal(true);
      return;
    }

    // Check Pro requirement
    if (tool.isPro && !quota.isPro) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setResults([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await incrementUsage(tool.type);

      if (tool.type === 'image') {
        const imageUrl = await aiImage({
          prompt: input.trim(),
          size: selectedImageSize,
        });
        setResults([imageUrl]);
      } else {
        const responses = await aiComplete({
          kind: id,
          profile,
          input: input.trim(),
          n: 3,
        });
        setResults(responses);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Generation error:', error);
      showToast(error.message || 'Failed to generate content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      showToast('Copied to clipboard', 'success');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  const handleSave = async (content: string, index: number) => {
    try {
      const savedItem = {
        id: `${id}-${Date.now()}-${index}`,
        user_id: user?.id || 'guest',
        type: id as any,
        title: `${tool.title}: ${input.substring(0, 50)}...`,
        payload: {
          content,
          input,
          generated_at: new Date().toISOString(),
          tool: id,
          ...(tool.type === 'image' && { imageSize: selectedImageSize }),
        },
        created_at: new Date().toISOString(),
      };

      await storage.addSavedItem(savedItem);
      showToast('Saved successfully', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving item:', error);
      showToast('Failed to save', 'error');
    }
  };

  const handleRefine = async (content: string) => {
    const refinements = [
      'Make this shorter and more punchy',
      'Add more hype and excitement',
      'Include a stronger call-to-action',
    ];

    Alert.alert(
      'Refine Content',
      'How would you like to refine this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        ...refinements.map((refinement, index) => ({
          text: refinement,
          onPress: () => refineContent(content, refinement),
        })),
      ]
    );
  };

  const refineContent = async (originalContent: string, refinement: string) => {
    if (!canUseFeature('text')) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await incrementUsage('text');

      const refinedResponses = await aiComplete({
        kind: 'refine',
        profile,
        input: `Original content: "${originalContent}"\n\nRefinement request: ${refinement}`,
        n: 1,
      });

      if (refinedResponses[0]) {
        setResults(prev => [refinedResponses[0], ...prev]);
        showToast('Content refined successfully', 'success');
      }
    } catch (error: any) {
      console.error('Refinement error:', error);
      showToast(error.message || 'Failed to refine content', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name={tool.icon as any} size={24} color={colors.primary} />
          <Text style={styles.title}>{tool.title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>{tool.description}</Text>

        {tool.isPro && !quota.isPro && (
          <View style={styles.proNotice}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={styles.proNoticeText}>Pro feature - Upgrade for unlimited access</Text>
          </View>
        )}

        {/* Image size selector for image tool */}
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

        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Input</Text>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={tool.placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* Generate Button */}
        <AnimatedButton
          title={loading ? 'Generating...' : 'Generate'}
          onPress={handleGenerate}
          disabled={loading || !input.trim()}
          style={styles.generateButton}
        />

        {/* Results */}
        {loading && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Generating Results...</Text>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} style={styles.skeletonResult} />
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
                    <Text style={styles.resultNumber}>Result {index + 1}</Text>
                    <View style={styles.imageContainer}>
                      <Text style={styles.imageUrl}>{result}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultNumber}>Result {index + 1}</Text>
                    </View>
                    <Text style={styles.resultText}>{result}</Text>
                  </>
                )}

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCopy(result)}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSave(result, index)}
                  >
                    <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Save</Text>
                  </TouchableOpacity>

                  {tool.type !== 'image' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRefine(result)}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Refine</Text>
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
        type={tool.type}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 24,
  },
  proNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning + '40',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  proNoticeText: {
    fontSize: 14,
    color: colors.warning,
    marginLeft: 8,
    fontWeight: '500',
  },
  imageSizeSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  sizeOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  sizeOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    marginBottom: 32,
  },
  resultsSection: {
    marginBottom: 32,
  },
  skeletonResult: {
    height: 120,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  imageResult: {
    marginBottom: 16,
  },
  imageContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  imageUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  resultActions: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default ToolScreen;
