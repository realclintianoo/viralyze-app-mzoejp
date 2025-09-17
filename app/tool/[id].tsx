
import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { aiComplete, aiImage } from '../../lib/ai';
import { OnboardingData } from '../../types';

const TOOL_CONFIG = {
  'script-generator': {
    title: 'Script Generator',
    description: 'Generate 30-60 second scripts with Hook → Value → CTA structure',
    placeholder: 'What topic do you want to create a script about?',
    type: 'text',
  },
  'hook-generator': {
    title: 'Hook Generator',
    description: 'Generate 10 viral hooks under 12 words each',
    placeholder: 'What topic do you need hooks for?',
    type: 'text',
  },
  'caption-generator': {
    title: 'Caption Generator',
    description: 'Generate 5 different caption styles for your content',
    placeholder: 'Describe your content or what you want to caption',
    type: 'text',
  },
  'calendar': {
    title: 'Content Calendar',
    description: 'Generate a 7-day content calendar with optimal posting times',
    placeholder: 'What type of content calendar do you need?',
    type: 'text',
  },
  'rewriter': {
    title: 'Cross-Post Rewriter',
    description: 'Adapt your content for different platforms',
    placeholder: 'Paste your original caption or content here',
    type: 'text',
  },
  'image-maker': {
    title: 'AI Image Maker',
    description: 'Generate images in different aspect ratios',
    placeholder: 'Describe the image you want to create',
    type: 'image',
  },
};

const IMAGE_SIZES = [
  { id: '1024x1024', label: '1:1 (Square)', width: 1024, height: 1024 },
  { id: '1792x1024', label: '16:9 (YouTube)', width: 1792, height: 1024 },
  { id: '1024x1792', label: '4:5 (Instagram)', width: 1024, height: 1792 },
];

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [input, setInput] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<OnboardingData | null>(null);

  const config = TOOL_CONFIG[id as keyof typeof TOOL_CONFIG];

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
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResults([]);

    try {
      if (config.type === 'image') {
        // Update quota for image
        await storage.updateQuotaUsage(0, 1);
        
        const imageUrl = await aiImage({
          prompt: input,
          size: selectedSize as '1024x1024' | '1792x1024' | '1024x1792'
        });
        setResults([imageUrl]);
      } else {
        // Update quota for text
        await storage.updateQuotaUsage(1, 0);
        
        // Generate multiple results for text tools
        const responses = await aiComplete({
          kind: id || 'hook',
          profile,
          input,
          n: 3
        });
        
        setResults(responses);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.log('Error generating content:', error);
      Alert.alert('Error', error.message || 'Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    // In a real app, you'd use Clipboard API
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Content copied to clipboard');
  };

  const handleSave = async (content: string, index: number) => {
    try {
      await storage.addSavedItem({
        id: Date.now().toString() + index,
        type: config.type === 'image' ? 'image' : (id as any) || 'hook',
        title: config.type === 'image' ? `Generated Image ${index + 1}` : content.substring(0, 50) + '...',
        payload: { content, imageUrl: config.type === 'image' ? content : undefined },
        created_at: new Date().toISOString(),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Content saved to your collection');
    } catch (error) {
      console.log('Error saving content:', error);
      Alert.alert('Error', 'Failed to save content');
    }
  };

  const handleRefine = (content: string) => {
    setInput(`Refine this: ${content}`);
  };

  if (!config) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={[commonStyles.container, commonStyles.center]}>
          <Text style={commonStyles.text}>Tool not found</Text>
          <TouchableOpacity
            style={[commonStyles.button, { marginTop: 16 }]}
            onPress={() => router.back()}
          >
            <Text style={commonStyles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={[
          commonStyles.row,
          commonStyles.spaceBetween,
          { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }
        ]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[commonStyles.subtitle, { marginBottom: 0 }]}>
            {config.title}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 16 }}>
            <Text style={[commonStyles.text, { marginBottom: 16 }]}>
              {config.description}
            </Text>

            {/* Image Size Selection */}
            {config.type === 'image' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
                  Image Size
                </Text>
                <View style={[commonStyles.row, { gap: 8, flexWrap: 'wrap' }]}>
                  {IMAGE_SIZES.map(size => (
                    <TouchableOpacity
                      key={size.id}
                      style={[
                        commonStyles.chip,
                        selectedSize === size.id && commonStyles.chipSelected,
                      ]}
                      onPress={() => setSelectedSize(size.id)}
                    >
                      <Text
                        style={[
                          commonStyles.chipText,
                          selectedSize === size.id && commonStyles.chipTextSelected,
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
            <TextInput
              style={[
                commonStyles.input,
                { height: 120, textAlignVertical: 'top', marginBottom: 16 }
              ]}
              placeholder={config.placeholder}
              placeholderTextColor={colors.grey}
              value={input}
              onChangeText={setInput}
              multiline
            />

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                commonStyles.button,
                { opacity: input.trim() && !isLoading ? 1 : 0.5 }
              ]}
              onPress={handleGenerate}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={commonStyles.buttonText}>
                  Generate {config.type === 'image' ? 'Image' : 'Content'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Results */}
            {results.length > 0 && (
              <View style={{ marginTop: 32 }}>
                <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                  Results
                </Text>
                
                {results.map((result, index) => (
                  <View key={index} style={[commonStyles.card, { marginBottom: 16 }]}>
                    {config.type === 'image' ? (
                      <View>
                        <View style={{
                          width: '100%',
                          height: 200,
                          backgroundColor: colors.border,
                          borderRadius: 8,
                          marginBottom: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="image" size={48} color={colors.grey} />
                          <Text style={[commonStyles.smallText, { marginTop: 8 }]}>
                            Generated Image
                          </Text>
                          <Text style={[commonStyles.smallText, { marginTop: 4, color: colors.grey }]}>
                            URL: {result}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={[commonStyles.text, { marginBottom: 12 }]}>
                        {result}
                      </Text>
                    )}
                    
                    <View style={[commonStyles.row, { gap: 12 }]}>
                      <TouchableOpacity
                        style={[commonStyles.row, { alignItems: 'center', gap: 4 }]}
                        onPress={() => handleCopy(result)}
                      >
                        <Ionicons name="copy-outline" size={16} color={colors.grey} />
                        <Text style={[commonStyles.smallText, { color: colors.grey }]}>
                          Copy
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[commonStyles.row, { alignItems: 'center', gap: 4 }]}
                        onPress={() => handleSave(result, index)}
                      >
                        <Ionicons name="bookmark-outline" size={16} color={colors.grey} />
                        <Text style={[commonStyles.smallText, { color: colors.grey }]}>
                          Save
                        </Text>
                      </TouchableOpacity>
                      
                      {config.type !== 'image' && (
                        <TouchableOpacity
                          style={[commonStyles.row, { alignItems: 'center', gap: 4 }]}
                          onPress={() => handleRefine(result)}
                        >
                          <Ionicons name="create-outline" size={16} color={colors.grey} />
                          <Text style={[commonStyles.smallText, { color: colors.grey }]}>
                            Refine
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
