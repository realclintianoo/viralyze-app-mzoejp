
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { storage } from '../../utils/storage';
import { aiComplete, aiImage } from '../../utils/ai';
import { commonStyles, colors, spacing, borderRadius } from '../../styles/commonStyles';
import { OnboardingData } from '../../types';

const TOOL_CONFIG = {
  script: {
    title: 'Script Generator',
    description: 'Generate viral 30-60 second scripts',
    icon: 'document-text',
    color: colors.accent,
    fields: [
      { key: 'topic', label: 'Topic/Theme', placeholder: 'e.g., Morning routine tips' },
      { key: 'tone', label: 'Tone', placeholder: 'e.g., Energetic, Professional, Casual' },
      { key: 'cta', label: 'Call to Action', placeholder: 'e.g., Follow for more tips' },
    ],
  },
  hook: {
    title: 'Hook Generator',
    description: 'Create 10 attention-grabbing hooks',
    icon: 'flash',
    color: '#F59E0B',
    fields: [
      { key: 'topic', label: 'Content Topic', placeholder: 'e.g., Productivity hacks' },
      { key: 'audience', label: 'Target Audience', placeholder: 'e.g., Entrepreneurs, Students' },
    ],
  },
  caption: {
    title: 'Caption Generator',
    description: 'Write compelling captions in 5 styles',
    icon: 'text',
    color: '#8B5CF6',
    fields: [
      { key: 'content', label: 'Content Description', placeholder: 'Describe your post content' },
      { key: 'style', label: 'Preferred Style', placeholder: 'e.g., Playful, Professional, Inspiring' },
    ],
  },
  calendar: {
    title: 'Content Calendar',
    description: 'Plan your week with strategic content',
    icon: 'calendar',
    color: '#06B6D4',
    fields: [
      { key: 'niche', label: 'Content Niche', placeholder: 'e.g., Fitness, Business, Lifestyle' },
      { key: 'goals', label: 'Goals', placeholder: 'e.g., Increase engagement, Drive sales' },
    ],
  },
  image: {
    title: 'AI Image Generator',
    description: 'Create custom visuals for your content',
    icon: 'image',
    color: '#F97316',
    fields: [
      { key: 'prompt', label: 'Image Description', placeholder: 'Describe the image you want to create' },
      { key: 'style', label: 'Style', placeholder: 'e.g., Minimalist, Vibrant, Professional' },
    ],
  },
};

const IMAGE_SIZES = [
  { id: '1:1', label: 'Square (1:1)', description: 'Perfect for Instagram posts' },
  { id: '4:5', label: 'Portrait (4:5)', description: 'Great for Instagram Stories' },
  { id: '16:9', label: 'Landscape (16:9)', description: 'Ideal for YouTube thumbnails' },
];

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState('1:1');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tool = TOOL_CONFIG[id as keyof typeof TOOL_CONFIG];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await storage.getOnboardingData();
      setProfile(profileData);
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const handleGenerate = async () => {
    if (isLoading) return;

    // Validate required fields
    const missingFields = tool.fields.filter(field => !formData[field.key]?.trim());
    if (missingFields.length > 0) {
      Alert.alert('Missing Information', `Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let generatedResults: string[] = [];

      if (id === 'image') {
        // Generate single image
        const imageUrl = await aiImage(formData.prompt, selectedSize);
        generatedResults = [imageUrl];
        
        // Update image quota
        await storage.updateQuotaUsage(0, 1);
      } else {
        // Generate text content (3 variations)
        const promises = Array(3).fill(null).map(() => 
          aiComplete(id as string, profile, JSON.stringify(formData))
        );
        generatedResults = await Promise.all(promises);
        
        // Update text quota
        await storage.updateQuotaUsage(1, 0);
      }

      setResults(generatedResults);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error generating content:', error);
      Alert.alert('Error', 'Failed to generate content. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    // In a real app, you'd use Clipboard API
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Content copied to clipboard');
  };

  const handleSave = async (content: string, index: number) => {
    try {
      await storage.addSavedItem({
        id: Date.now().toString() + index,
        type: id === 'image' ? 'image' : (id as any),
        title: `${tool.title} - ${new Date().toLocaleDateString()}`,
        payload: { content, formData, size: selectedSize },
        created_at: new Date().toISOString(),
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Content saved to your collection');
    } catch (error) {
      console.log('Error saving content:', error);
      Alert.alert('Error', 'Failed to save content');
    }
  };

  const handleRefine = async (content: string) => {
    Alert.alert(
      'Refine Content',
      'How would you like to refine this?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Make Shorter', onPress: () => refineContent(content, 'shorter') },
        { text: 'More Hype', onPress: () => refineContent(content, 'hype') },
        { text: 'Add CTA', onPress: () => refineContent(content, 'cta') },
      ]
    );
  };

  const refineContent = async (content: string, type: string) => {
    setIsLoading(true);
    try {
      const refinedContent = await aiComplete('refine', profile, `${type}: ${content}`);
      // Replace the content in results
      const newResults = [...results];
      const index = results.indexOf(content);
      if (index !== -1) {
        newResults[index] = refinedContent;
        setResults(newResults);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error refining content:', error);
      Alert.alert('Error', 'Failed to refine content');
    } finally {
      setIsLoading(false);
    }
  };

  if (!tool) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={[commonStyles.container, commonStyles.center]}>
          <Text style={commonStyles.body}>Tool not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <KeyboardAvoidingView 
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={[styles.headerIcon, { backgroundColor: tool.color + '20' }]}>
              <Ionicons name={tool.icon as any} size={20} color={tool.color} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{tool.title}</Text>
              <Text style={styles.headerDescription}>{tool.description}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            
            {tool.fields.map((field) => (
              <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.grey}
                  value={formData[field.key] || ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, [field.key]: text }))}
                  multiline={field.key === 'content' || field.key === 'prompt'}
                  numberOfLines={field.key === 'content' || field.key === 'prompt' ? 3 : 1}
                />
              </View>
            ))}

            {/* Image Size Selection */}
            {id === 'image' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Image Size</Text>
                <View style={styles.sizeOptions}>
                  {IMAGE_SIZES.map((size) => (
                    <TouchableOpacity
                      key={size.id}
                      style={[
                        styles.sizeOption,
                        selectedSize === size.id && styles.sizeOptionSelected
                      ]}
                      onPress={() => setSelectedSize(size.id)}
                    >
                      <Text style={[
                        styles.sizeLabel,
                        selectedSize === size.id && styles.sizeLabelSelected
                      ]}>
                        {size.label}
                      </Text>
                      <Text style={[
                        styles.sizeDescription,
                        selectedSize === size.id && styles.sizeDescriptionSelected
                      ]}>
                        {size.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Generate Button */}
            <TouchableOpacity
              style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color={colors.white} />
                  <Text style={styles.generateButtonText}>Generate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Results */}
          {results.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Results</Text>
              
              {results.map((result, index) => (
                <View key={index} style={styles.resultCard}>
                  {id === 'image' ? (
                    <View style={styles.imageResult}>
                      <Text style={styles.imageUrl}>{result}</Text>
                      <Text style={styles.imagePlaceholder}>
                        🖼️ Image would be displayed here
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.resultText}>{result}</Text>
                  )}
                  
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleCopy(result)}
                    >
                      <Ionicons name="copy-outline" size={16} color={colors.accent} />
                      <Text style={styles.actionText}>Copy</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSave(result, index)}
                    >
                      <Ionicons name="bookmark-outline" size={16} color={colors.accent} />
                      <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>
                    
                    {id !== 'image' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRefine(result)}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.accent} />
                        <Text style={styles.actionText}>Refine</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  headerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  headerDescription: {
    fontSize: 13,
    color: colors.grey,
  },
  content: {
    flex: 1,
  },
  formSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top' as const,
  },
  sizeOptions: {
    gap: spacing.sm,
  },
  sizeOption: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sizeOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: 2,
  },
  sizeLabelSelected: {
    color: colors.accent,
  },
  sizeDescription: {
    fontSize: 13,
    color: colors.grey,
  },
  sizeDescriptionSelected: {
    color: colors.accent,
  },
  generateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  generateButtonDisabled: {
    backgroundColor: colors.grey,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  resultsSection: {
    padding: spacing.md,
    paddingTop: 0,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  imageResult: {
    alignItems: 'center' as const,
    paddingVertical: spacing.lg,
  },
  imageUrl: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  imagePlaceholder: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center' as const,
  },
  resultActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500' as const,
    marginLeft: spacing.xs,
  },
};
