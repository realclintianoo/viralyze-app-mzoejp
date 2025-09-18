
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { getPersonalizedRecommendations } from '../../utils/personalization';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';
import { QuotaUsage } from '../../types';
import PremiumFeatureLock from '../../components/PremiumFeatureLock';

const { width } = Dimensions.get('window');

interface PremiumToolCardProps {
  tool: typeof TOOLS[0];
  index: number;
  onPress: () => void;
  quota: QuotaUsage | null;
}

interface PremiumStatsCardProps {
  quota: QuotaUsage | null;
}

const TOOLS = [
  {
    id: 'script-generator',
    title: 'Script Generator',
    description: 'Create 30-60s viral scripts with hook, value, and CTA',
    icon: 'document-text',
    gradient: ['#22C55E', '#16A34A'],
    isPremium: false,
    quotaType: 'text' as const,
  },
  {
    id: 'hook-generator',
    title: 'Hook Generator',
    description: 'Generate 10 viral hooks under 12 words each',
    icon: 'fish',
    gradient: ['#3B82F6', '#1D4ED8'],
    isPremium: false,
    quotaType: 'text' as const,
  },
  {
    id: 'caption-generator',
    title: 'Caption Generator',
    description: '5 caption styles: playful, persuasive, professional',
    icon: 'text',
    gradient: ['#8B5CF6', '#7C3AED'],
    isPremium: false,
    quotaType: 'text' as const,
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day content plan with optimal posting times',
    icon: 'calendar',
    gradient: ['#F59E0B', '#D97706'],
    isPremium: false,
    quotaType: 'text' as const,
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Adapt content for TikTok, IG, YouTube, X, LinkedIn',
    icon: 'refresh',
    gradient: ['#EF4444', '#DC2626'],
    isPremium: false,
    quotaType: 'text' as const,
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Detect risky content and get safe rewrites',
    icon: 'shield-checkmark',
    gradient: ['#06B6D4', '#0891B2'],
    isPremium: true,
    quotaType: 'text' as const,
  },
  {
    id: 'ai-image',
    title: 'AI Image Maker',
    description: 'Generate images in 16:9, 4:5, 1:1 formats',
    icon: 'image',
    gradient: ['#EC4899', '#DB2777'],
    isPremium: false,
    quotaType: 'image' as const,
  },
];

const PremiumToolCard: React.FC<PremiumToolCardProps> = ({ tool, index, onPress, quota }) => {
  const { profile } = usePersonalization();
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);

  useEffect(() => {
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    scaleAnim.value = withDelay(index * 100, withSpring(1, { tension: 300, friction: 8 }));
  }, [index, fadeAnim, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    onPress();
  };

  const handlePress = () => {
    onPress();
  };

  const isLowQuota = (): boolean => {
    if (!quota) return false;
    if (tool.quotaType === 'text') {
      return quota.used_text >= quota.text * 0.8;
    }
    return quota.used_image >= quota.image * 0.8;
  };

  const getRemainingUses = (): number => {
    if (!quota) return 0;
    if (tool.quotaType === 'text') {
      return Math.max(0, quota.text - quota.used_text);
    }
    return Math.max(0, quota.image - quota.used_image);
  };

  const getUsageColor = (): string => {
    const remaining = getRemainingUses();
    if (remaining === 0) return colors.neonRed;
    if (isLowQuota()) return colors.neonYellow;
    return colors.neonGreen;
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View style={[
        {
          marginBottom: 16,
          shadowColor: tool.gradient[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        animatedStyle
      ]}>
        <BlurView intensity={30} style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: tool.isPremium ? colors.neonTeal + '40' : colors.glassBorder,
        }}>
          <LinearGradient
            colors={[
              colors.glassBackground + 'F0',
              colors.background + 'E6',
            ]}
            style={{
              padding: 20,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: tool.gradient[0] + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}>
                <Ionicons 
                  name={tool.icon as keyof typeof Ionicons.glyphMap} 
                  size={24} 
                  color={tool.gradient[0]} 
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[
                    commonStyles.subtitle,
                    {
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: '700',
                      flex: 1,
                    }
                  ]}>
                    {tool.title}
                  </Text>
                  
                  {tool.isPremium && (
                    <View style={{
                      backgroundColor: colors.neonTeal + '20',
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}>
                      <Text style={{
                        color: colors.neonTeal,
                        fontSize: 10,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}>
                        PRO
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={[
                  commonStyles.text,
                  {
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 20,
                  }
                ]}>
                  {tool.description}
                </Text>
              </View>
            </View>

            {/* Usage Info */}
            {!tool.isPremium && quota && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.glassBorder,
              }}>
                <Text style={[
                  commonStyles.textSmall,
                  {
                    color: colors.textSecondary,
                    fontSize: 12,
                  }
                ]}>
                  {getRemainingUses()} uses remaining
                </Text>
                
                <View style={{
                  width: 60,
                  height: 4,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${(getRemainingUses() / (tool.quotaType === 'text' ? quota.text : quota.image)) * 100}%`,
                    height: '100%',
                    backgroundColor: getUsageColor(),
                  }} />
                </View>
              </View>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
};

const PremiumStatsCard: React.FC<PremiumStatsCardProps> = ({ quota }) => {
  const { profile } = usePersonalization();
  const fadeAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.98, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [quota, fadeAnim, glowAnim, pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: pulseAnim.value }],
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
  }));

  const getUsagePercentage = (): number => {
    if (!quota) return 0;
    return Math.round((quota.used_text / quota.text) * 100);
  };

  const getUsageColor = (): string => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return colors.neonRed;
    if (percentage >= 70) return colors.neonYellow;
    return colors.neonGreen;
  };

  const getGlowColor = (): string => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return colors.glowNeonRed;
    if (percentage >= 70) return colors.glowNeonYellow;
    return colors.glowNeonGreen;
  };

  if (!quota) return null;

  return (
    <Animated.View style={[
      {
        marginBottom: 24,
        shadowColor: getGlowColor(),
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 15,
        elevation: 12,
      },
      animatedStyle
    ]}>
      <BlurView intensity={40} style={{
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.glassBorderUltra,
      }}>
        <LinearGradient
          colors={[
            colors.glassBackgroundUltra + 'F0',
            colors.background + 'E6',
          ]}
          style={{
            padding: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: getUsageColor() + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}>
              <Ionicons name="flash" size={24} color={getUsageColor()} />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={[
                commonStyles.subtitle,
                {
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 4,
                }
              ]}>
                Daily Usage
              </Text>
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  fontSize: 12,
                }
              ]}>
                Resets at midnight
              </Text>
            </View>
            
            <Text style={[
              commonStyles.headerTitle,
              {
                fontSize: 24,
                color: getUsageColor(),
                fontWeight: '700',
              }
            ]}>
              {getUsagePercentage()}%
            </Text>
          </View>

          {/* Usage Bars */}
          <View style={{ gap: 16 }}>
            {/* Text Usage */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[
                  commonStyles.textSmall,
                  { color: colors.textSecondary, fontSize: 12 }
                ]}>
                  Text Generation
                </Text>
                <Text style={[
                  commonStyles.textSmall,
                  { color: colors.text, fontSize: 12, fontWeight: '600' }
                ]}>
                  {quota.used_text}/{quota.text}
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <View style={{
                  width: `${(quota.used_text / quota.text) * 100}%`,
                  height: '100%',
                  backgroundColor: getUsageColor(),
                }} />
              </View>
            </View>

            {/* Image Usage */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[
                  commonStyles.textSmall,
                  { color: colors.textSecondary, fontSize: 12 }
                ]}>
                  Image Generation
                </Text>
                <Text style={[
                  commonStyles.textSmall,
                  { color: colors.text, fontSize: 12, fontWeight: '600' }
                ]}>
                  {quota.used_image}/{quota.image}
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <View style={{
                  width: `${(quota.used_image / quota.image) * 100}%`,
                  height: '100%',
                  backgroundColor: colors.neonTeal,
                }} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

export default function ToolsScreen() {
  const { profile } = usePersonalization();
  const [quota, setQuota] = useState<QuotaUsage | null>(null);

  // Animation values
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    loadQuota();
  }, [fadeAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const loadQuota = async () => {
    try {
      const savedQuota = await storage.getQuota();
      if (savedQuota) {
        setQuota(savedQuota);
      } else {
        // Default quota
        const defaultQuota: QuotaUsage = {
          text: 10,
          image: 1,
          used_text: 0,
          used_image: 0,
        };
        setQuota(defaultQuota);
        await storage.saveQuota(defaultQuota);
      }
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    if (tool.isPremium) {
      showProModal();
      return;
    }

    if (!quota) {
      Alert.alert('Error', 'Unable to check usage quota');
      return;
    }

    // Check quota
    if (tool.quotaType === 'text' && quota.used_text >= quota.text) {
      showUpgradeModal('text');
      return;
    }

    if (tool.quotaType === 'image' && quota.used_image >= quota.image) {
      showUpgradeModal('image');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/tool/${tool.id}`);
  };

  const showProModal = () => {
    Alert.alert(
      'Premium Feature',
      'This tool is available with VIRALYZE Pro. Upgrade to unlock all premium features.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          onPress: () => router.push('/paywall'),
          style: 'default'
        }
      ]
    );
  };

  const showUpgradeModal = (type: 'text' | 'image') => {
    const message = type === 'text' 
      ? 'You\'ve reached your daily text generation limit. Upgrade to Pro for unlimited access.'
      : 'You\'ve reached your daily image generation limit. Upgrade to Pro for unlimited access.';

    Alert.alert(
      'Daily Limit Reached',
      message,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          onPress: () => router.push('/paywall'),
          style: 'default'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundSecondary + '40',
          colors.background,
        ]}
        style={{ flex: 1 }}
      >
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 24,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.glassBorder,
          }}>
            <Text style={[
              commonStyles.headerTitle,
              {
                fontSize: 28,
                marginBottom: 8,
                color: colors.text,
              }
            ]}>
              AI Tools
            </Text>
            <Text style={[
              commonStyles.subtitle,
              {
                color: colors.textSecondary,
                fontSize: 16,
              }
            ]}>
              Powerful tools to grow your audience
            </Text>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Card */}
            <PremiumStatsCard quota={quota} />

            {/* Tools Grid */}
            <View>
              <Text style={[
                commonStyles.subtitle,
                {
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: '700',
                  marginBottom: 20,
                }
              ]}>
                Available Tools
              </Text>

              {TOOLS.map((tool, index) => (
                <PremiumToolCard
                  key={tool.id}
                  tool={tool}
                  index={index}
                  onPress={() => handleToolPress(tool)}
                  quota={quota}
                />
              ))}
            </View>

            {/* Premium Feature Lock for Guardian */}
            <PremiumFeatureLock
              title="Unlock Premium Tools"
              description="Get access to Guideline Guardian and unlimited AI generation with VIRALYZE Pro."
              onUpgrade={() => router.push('/paywall')}
              style={{ marginTop: 20 }}
            />
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}
