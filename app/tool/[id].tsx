
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { aiComplete, aiImage } from '../../lib/ai';
import { OnboardingData } from '../../types';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const TOOL_CONFIG = {
  'script-generator': {
    title: 'Script Generator',
    description: 'Generate 30-60 second scripts with Hook → Value → CTA structure',
    placeholder: 'What topic do you want to create a script about?',
    type: 'text',
    icon: 'document-text' as keyof typeof Ionicons.glyphMap,
    gradient: colors.scriptGradient,
  },
  'hook-generator': {
    title: 'Hook Generator',
    description: 'Generate 10 viral hooks under 12 words each',
    placeholder: 'What topic do you need hooks for?',
    type: 'text',
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    gradient: colors.hookGradient,
  },
  'caption-generator': {
    title: 'Caption Generator',
    description: 'Generate 5 different caption styles for your content',
    placeholder: 'Describe your content or what you want to caption',
    type: 'text',
    icon: 'text' as keyof typeof Ionicons.glyphMap,
    gradient: colors.captionGradient,
  },
  'calendar': {
    title: 'Content Calendar',
    description: 'Generate a 7-day content calendar with optimal posting times',
    placeholder: 'What type of content calendar do you need?',
    type: 'text',
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    gradient: colors.calendarGradient,
  },
  'rewriter': {
    title: 'Cross-Post Rewriter',
    description: 'Adapt your content for different platforms',
    placeholder: 'Paste your original caption or content here',
    type: 'text',
    icon: 'repeat' as keyof typeof Ionicons.glyphMap,
    gradient: colors.rewriterGradient,
  },
  'image-maker': {
    title: 'AI Image Maker',
    description: 'Generate images in different aspect ratios',
    placeholder: 'Describe the image you want to create',
    type: 'image',
    icon: 'image' as keyof typeof Ionicons.glyphMap,
    gradient: colors.imageGradient,
  },
};

const IMAGE_SIZES = [
  { id: '1024x1024', label: '1:1 Square', width: 1024, height: 1024, icon: 'square' },
  { id: '1792x1024', label: '16:9 YouTube', width: 1792, height: 1024, icon: 'tv' },
  { id: '1024x1792', label: '4:5 Instagram', width: 1024, height: 1792, icon: 'phone-portrait' },
];

interface PremiumResultCardProps {
  result: string;
  index: number;
  type: 'text' | 'image';
  onCopy: () => void;
  onSave: () => void;
  onRefine?: () => void;
  gradient: string[];
}

function PremiumResultCard({ result, index, type, onCopy, onSave, onRefine, gradient }: PremiumResultCardProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(30);

  useEffect(() => {
    const delay = index * 200;
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={[{ marginBottom: 20 }, animatedStyle]}>
      <BlurView intensity={25} style={{ borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={[`${gradient[0]}08`, `${gradient[1]}12`]}
          style={[
            commonStyles.premiumCard,
            { margin: 0, borderColor: colors.glassBorderStrong }
          ]}
        >
          {type === 'image' ? (
            <View>
              <View style={{
                width: '100%',
                height: 200,
                backgroundColor: colors.glassBackground,
                borderRadius: 16,
                marginBottom: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.glassBorder,
                shadowColor: colors.neuDark,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}>
                <LinearGradient
                  colors={gradient}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="image" size={32} color={colors.white} />
                </LinearGradient>
                <Text style={[commonStyles.textBold, { marginBottom: 4 }]}>
                  Generated Image
                </Text>
                <Text style={[commonStyles.textSmall, { textAlign: 'center', paddingHorizontal: 20 }]}>
                  {result.substring(0, 60)}...
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <Text style={[commonStyles.text, { lineHeight: 26, fontWeight: '500' }]}>
                {result}
              </Text>
            </View>
          )}
          
          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.glassBackground,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                shadowColor: colors.neuDark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={onCopy}
            >
              <Ionicons name="copy-outline" size={16} color={colors.text} />
              <Text style={[commonStyles.textSmall, { color: colors.text, fontWeight: '600' }]}>
                Copy
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.glassBackground,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                shadowColor: colors.neuDark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={onSave}
            >
              <Ionicons name="bookmark-outline" size={16} color={colors.success} />
              <Text style={[commonStyles.textSmall, { color: colors.success, fontWeight: '600' }]}>
                Save
              </Text>
            </TouchableOpacity>
            
            {type !== 'image' && onRefine && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.glassBackground,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.neuDark,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={onRefine}
              >
                <Ionicons name="create-outline" size={16} color={colors.warning} />
                <Text style={[commonStyles.textSmall, { color: colors.warning, fontWeight: '600' }]}>
                  Refine
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [input, setInput] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<OnboardingData | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  const config = TOOL_CONFIG[id as keyof typeof TOOL_CONFIG];

  useEffect(() => {
    loadProfile();
    
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    contentTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 120 }));
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

    // Button animation
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    buttonGlow.value = withTiming(1, { duration: 200 });

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setIsLoading(true);
    setResults([]);

    try {
      if (config.type === 'image') {
        await storage.updateQuotaUsage(0, 1);
        
        const imageUrl = await aiImage({
          prompt: input,
          size: selectedSize as '1024x1024' | '1792x1024' | '1024x1792'
        });
        setResults([imageUrl]);
      } else {
        await storage.updateQuotaUsage(1, 0);
        
        const responses = await aiComplete({
          kind: id || 'hook',
          profile,
          input,
          n: 3
        });
        
        setResults(responses);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.log('Error generating content:', error);
      Alert.alert('Error', error.message || 'Failed to generate content. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      buttonGlow.value = withTiming(0, { duration: 500 });
    }
  };

  const handleCopy = async (content: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('✅ Copied', 'Content copied to clipboard');
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
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('💾 Saved', 'Content saved to your collection');
    } catch (error) {
      console.log('Error saving content:', error);
      Alert.alert('Error', 'Failed to save content');
    }
  };

  const handleRefine = (content: string) => {
    setInput(`Refine this: ${content}`);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    opacity: buttonGlow.value,
  }));

  if (!config) {
    return (
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Premium Header */}
        <Animated.View style={[headerAnimatedStyle]}>
          <BlurView intensity={25} style={{ borderBottomWidth: 1, borderBottomColor: colors.glassBorder }}>
            <View style={[commonStyles.header, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.glassBackground,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.neuDark,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <LinearGradient
                  colors={config.gradient}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    shadowColor: config.gradient[0],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Ionicons name={config.icon} size={18} color={colors.white} />
                </LinearGradient>
                <Text style={[commonStyles.subtitle, { marginBottom: 0, fontSize: 18 }]}>
                  {config.title}
                </Text>
              </View>
              
              <View style={{ width: 44 }} />
            </View>
          </BlurView>
        </Animated.View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={[{ padding: 20 }, contentAnimatedStyle]}>
            {/* Description Card */}
            <BlurView intensity={20} style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
              <LinearGradient
                colors={[`${config.gradient[0]}08`, `${config.gradient[1]}12`]}
                style={[
                  commonStyles.premiumCard,
                  { margin: 0, borderColor: colors.glassBorderStrong }
                ]}
              >
                <Text style={[commonStyles.text, { lineHeight: 24, fontWeight: '500' }]}>
                  {config.description}
                </Text>
              </LinearGradient>
            </BlurView>

            {/* Image Size Selection */}
            {config.type === 'image' && (
              <View style={{ marginBottom: 24 }}>
                <Text style={[commonStyles.subtitle, { marginBottom: 16, fontSize: 18 }]}>
                  Image Size
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                  {IMAGE_SIZES.map(size => (
                    <TouchableOpacity
                      key={size.id}
                      style={[
                        {
                          backgroundColor: selectedSize === size.id ? config.gradient[0] : colors.glassBackground,
                          borderWidth: 1,
                          borderColor: selectedSize === size.id ? config.gradient[0] : colors.glassBorder,
                          paddingHorizontal: 20,
                          paddingVertical: 14,
                          borderRadius: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          shadowColor: selectedSize === size.id ? config.gradient[0] : colors.neuDark,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: selectedSize === size.id ? 0.4 : 0.2,
                          shadowRadius: 8,
                          elevation: 6,
                        }
                      ]}
                      onPress={() => setSelectedSize(size.id)}
                    >
                      <Ionicons 
                        name={size.icon as keyof typeof Ionicons.glyphMap} 
                        size={16} 
                        color={selectedSize === size.id ? colors.white : colors.text} 
                      />
                      <Text
                        style={{
                          color: selectedSize === size.id ? colors.white : colors.text,
                          fontSize: 14,
                          fontWeight: selectedSize === size.id ? '700' : '600',
                          letterSpacing: 0.2,
                        }}
                      >
                        {size.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Premium Input */}
            <View style={{ marginBottom: 24 }}>
              <BlurView intensity={20} style={{ borderRadius: 20, overflow: 'hidden' }}>
                <View
                  style={{
                    backgroundColor: colors.glassBackgroundStrong,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                    borderRadius: 20,
                    padding: 4,
                    shadowColor: colors.neuDark,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <TextInput
                    style={[
                      commonStyles.premiumInput,
                      { 
                        height: 120, 
                        textAlignVertical: 'top',
                        margin: 0,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        shadowOpacity: 0,
                        elevation: 0,
                      }
                    ]}
                    placeholder={config.placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={input}
                    onChangeText={setInput}
                    multiline
                  />
                </View>
              </BlurView>
            </View>

            {/* Premium Generate Button */}
            <View style={{ position: 'relative', marginBottom: 32 }}>
              {/* Button glow */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    right: -4,
                    bottom: -4,
                    borderRadius: 20,
                    backgroundColor: config.gradient[0],
                    shadowColor: config.gradient[0],
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    elevation: 16,
                  },
                  buttonGlowStyle,
                ]}
              />
              
              <AnimatedTouchableOpacity
                style={[
                  {
                    borderRadius: 16,
                    overflow: 'hidden',
                    opacity: input.trim() && !isLoading ? 1 : 0.6,
                  },
                  buttonAnimatedStyle,
                ]}
                onPress={handleGenerate}
                disabled={!input.trim() || isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={config.gradient}
                  style={[
                    commonStyles.premiumButton,
                    { margin: 0 }
                  ]}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={[commonStyles.buttonText, { textTransform: 'none' }]}>
                        Generating...
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="sparkles" size={20} color={colors.white} />
                      <Text style={[commonStyles.buttonText, { textTransform: 'none' }]}>
                        Generate {config.type === 'image' ? 'Image' : 'Content'}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </AnimatedTouchableOpacity>
            </View>

            {/* Premium Results */}
            {results.length > 0 && (
              <View>
                <Text style={[commonStyles.subtitle, { marginBottom: 20, fontSize: 20 }]}>
                  ✨ Results
                </Text>
                
                {results.map((result, index) => (
                  <PremiumResultCard
                    key={index}
                    result={result}
                    index={index}
                    type={config.type as 'text' | 'image'}
                    gradient={config.gradient}
                    onCopy={() => handleCopy(result)}
                    onSave={() => handleSave(result, index)}
                    onRefine={config.type !== 'image' ? () => handleRefine(result) : undefined}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
