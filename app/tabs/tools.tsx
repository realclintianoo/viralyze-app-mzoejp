
import { QuotaUsage } from '../../types';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { BlurView } from 'expo-blur';
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
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { getPersonalizedRecommendations } from '../../utils/personalization';
import { router } from 'expo-router';
import PremiumFeatureLock from '../../components/PremiumFeatureLock';

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
    description: 'Create 30-60s video scripts with hooks, value, and CTAs',
    icon: 'document-text',
    gradient: ['rgba(34, 197, 94, 0.1)', 'rgba(22, 163, 74, 0.1)'],
    glowColor: 'rgba(34, 197, 94, 0.6)',
    isPremium: false,
  },
  {
    id: 'hook-generator',
    title: 'Hook Generator',
    description: 'Generate 10 viral hooks under 12 words each',
    icon: 'fish',
    gradient: ['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.1)'],
    glowColor: 'rgba(59, 130, 246, 0.6)',
    isPremium: false,
  },
  {
    id: 'caption-generator',
    title: 'Caption Generator',
    description: 'Create captions in 5 different styles and tones',
    icon: 'chatbubble-ellipses',
    gradient: ['rgba(168, 85, 247, 0.1)', 'rgba(147, 51, 234, 0.1)'],
    glowColor: 'rgba(168, 85, 247, 0.6)',
    isPremium: false,
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: 'Generate a 7-day posting schedule with optimal times',
    icon: 'calendar',
    gradient: ['rgba(245, 158, 11, 0.1)', 'rgba(217, 119, 6, 0.1)'],
    glowColor: 'rgba(245, 158, 11, 0.6)',
    isPremium: false,
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Adapt content for TikTok, Instagram, YouTube, X, and LinkedIn',
    icon: 'repeat',
    gradient: ['rgba(6, 182, 212, 0.1)', 'rgba(8, 145, 178, 0.1)'],
    glowColor: 'rgba(6, 182, 212, 0.6)',
    isPremium: false,
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Detect risky content and get safe rewrites',
    icon: 'shield-checkmark',
    gradient: ['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.1)'],
    glowColor: 'rgba(239, 68, 68, 0.6)',
    isPremium: true, // This is now a premium feature
  },
  {
    id: 'ai-image',
    title: 'AI Image Maker',
    description: 'Generate images in 16:9, 4:5, and 1:1 formats',
    icon: 'image',
    gradient: ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)'],
    glowColor: 'rgba(139, 92, 246, 0.6)',
    isPremium: false,
  },
  {
    id: 'analytics',
    title: 'Content Analytics',
    description: 'Advanced insights and performance tracking',
    icon: 'analytics',
    gradient: ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.1)'],
    glowColor: 'rgba(16, 185, 129, 0.6)',
    isPremium: true, // This is now a premium feature
  },
  {
    id: 'competitor',
    title: 'Competitor Analysis',
    description: 'Analyze competitor content and strategies',
    icon: 'search',
    gradient: ['rgba(251, 146, 60, 0.1)', 'rgba(249, 115, 22, 0.1)'],
    glowColor: 'rgba(251, 146, 60, 0.6)',
    isPremium: true, // This is now a premium feature
  }
];

const PremiumToolCard: React.FC<PremiumToolCardProps> = ({ tool, index, onPress, quota }) => {
  const { theme } = usePersonalization();
  const scaleAnim = useSharedValue(0.9);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    scaleAnim.value = withDelay(index * 100, withSpring(1, { tension: 300, friction: 8 }));
  }, [index, fadeAnim, scaleAnim]);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isLowQuota = () => {
    if (!quota) return false;
    return quota.text >= 8; // Show warning when 8/10 used
  };

  const getRemainingUses = () => {
    if (!quota) return 10;
    return Math.max(0, 10 - quota.text);
  };

  const getUsageColor = () => {
    const remaining = getRemainingUses();
    if (remaining <= 2) return colors.error;
    if (remaining <= 5) return colors.warning;
    return colors.success;
  };

  return (
    <Animated.View style={[{ margin: 8 }, animatedStyle]}>
      <TouchableOpacity
        style={[
          commonStyles.ultraCard,
          {
            padding: 20,
            borderColor: tool.isPremium ? 'rgba(139, 92, 246, 0.3)' : colors.glassBorderStrong,
            shadowColor: tool.glowColor,
            opacity: tool.isPremium ? 0.8 : 1,
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={tool.gradient}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
          }}
        />
        
        {/* Premium Badge */}
        {tool.isPremium && (
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: 'rgba(139, 92, 246, 0.4)',
          }}>
            <Text style={[
              commonStyles.textBold,
              { color: '#8B5CF6', fontSize: 10 }
            ]}>
              PRO
            </Text>
          </View>
        )}
        
        {/* Icon */}
        <View style={{
          backgroundColor: colors.glassBackgroundStrong,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: colors.glassBorderStrong,
        }}>
          <Ionicons 
            name={tool.icon as any} 
            size={28} 
            color={tool.isPremium ? '#8B5CF6' : colors.accent} 
          />
        </View>
        
        {/* Content */}
        <Text style={[
          commonStyles.textBold,
          { 
            fontSize: 18, 
            marginBottom: 8,
            color: tool.isPremium ? colors.textSecondary : colors.text
          }
        ]}>
          {tool.title}
        </Text>
        
        <Text style={[
          commonStyles.textSmall,
          { 
            color: colors.textSecondary, 
            lineHeight: 18,
            marginBottom: 16
          }
        ]}>
          {tool.description}
        </Text>
        
        {/* Usage Indicator for non-premium tools */}
        {!tool.isPremium && quota && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.glassBorder,
          }}>
            <Text style={[
              commonStyles.textSmall,
              { color: colors.textTertiary }
            ]}>
              Usage Today
            </Text>
            <Text style={[
              commonStyles.textBold,
              { color: getUsageColor(), fontSize: 12 }
            ]}>
              {getRemainingUses()} left
            </Text>
          </View>
        )}
        
        {/* Premium Lock Indicator */}
        {tool.isPremium && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(139, 92, 246, 0.2)',
          }}>
            <Ionicons name="lock-closed" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
            <Text style={[
              commonStyles.textBold,
              { color: '#8B5CF6', fontSize: 12 }
            ]}>
              Premium Feature
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumStatsCard: React.FC<PremiumStatsCardProps> = ({ quota }) => {
  const { theme, profile } = usePersonalization();
  const pulseAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: fadeAnim.value,
    shadowOpacity: 0.4 + glowAnim.value * 0.4,
    shadowRadius: 16 + glowAnim.value * 8,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 600 });
    
    // Glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
    
    if (quota && quota.text >= 8) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [quota, fadeAnim, glowAnim, pulseAnim]);

  const getUsagePercentage = () => {
    if (!quota) return 0;
    return (quota.text / 10) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 80) return colors.error;
    if (percentage >= 60) return colors.warning;
    return colors.neonGreen;
  };

  const getGlowColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 80) return 'rgba(239, 68, 68, 0.8)';
    if (percentage >= 60) return 'rgba(245, 158, 11, 0.8)';
    return colors.glowNeonGreen;
  };

  return (
    <Animated.View style={[
      commonStyles.ultraCard,
      { 
        margin: 16, 
        padding: 28,
        borderWidth: 2,
        borderColor: colors.glassBorderUltra,
        shadowColor: getGlowColor(),
      },
      animatedStyle
    ]}>
      <LinearGradient
        colors={[colors.neonTeal + '12', colors.neonGreen + '12']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 28,
        }}
      />
      
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 24 
      }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.neonTeal,
          marginRight: 12,
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 8,
        }} />
        
        <Text style={[
          commonStyles.subtitle, 
          { 
            color: colors.neonTeal,
            textShadowColor: colors.glowNeonTeal,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }
        ]}>
          Daily AI Usage
        </Text>
      </View>
      
      {/* Usage Circle */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.glassBackgroundStrong,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: getUsageColor() + '40',
          shadowColor: getGlowColor(),
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 16,
          marginBottom: 16,
        }}>
          <Text style={[
            commonStyles.title,
            { 
              fontSize: 32, 
              color: getUsageColor(),
              textShadowColor: getGlowColor(),
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            }
          ]}>
            {quota ? 10 - quota.text : 10}
          </Text>
          <Text style={[
            commonStyles.textBold,
            { 
              color: colors.textSecondary,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1
            }
          ]}>
            Left Today
          </Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={{
        height: 12,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}>
        <LinearGradient
          colors={[getUsageColor(), getUsageColor() + '80']}
          style={{
            height: '100%',
            width: `${getUsagePercentage()}%`,
            borderRadius: 6,
          }}
        />
      </View>
      
      {/* Stats Row */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[
            commonStyles.textBold,
            { color: colors.neonTeal, fontSize: 16 }
          ]}>
            {quota?.text || 0}/10
          </Text>
          <Text style={[
            commonStyles.textSmall,
            { color: colors.textTertiary, fontSize: 10 }
          ]}>
            Used
          </Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={[
            commonStyles.textBold,
            { color: colors.neonGreen, fontSize: 16 }
          ]}>
            {profile?.niche || 'Creator'}
          </Text>
          <Text style={[
            commonStyles.textSmall,
            { color: colors.textTertiary, fontSize: 10 }
          ]}>
            Mode
          </Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={[
            commonStyles.textBold,
            { color: colors.warning, fontSize: 16 }
          ]}>
            24h
          </Text>
          <Text style={[
            commonStyles.textSmall,
            { color: colors.textTertiary, fontSize: 10 }
          ]}>
            Reset
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function ToolsScreen() {
  console.log('🛠️ Tools screen rendered');
  
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const [showPremiumLock, setShowPremiumLock] = useState(false);
  
  const { profile, theme } = usePersonalization();
  
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadQuota();
  }, [fadeAnim]);

  const loadQuota = async () => {
    try {
      const quotaData = await storage.getQuotaUsage();
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    if (tool.isPremium) {
      setShowPremiumLock(true);
      return;
    }

    // Check quota for non-premium tools
    if (quota && quota.text >= 10) {
      showUpgradeModal('text');
      return;
    }

    // Navigate to tool
    router.push(`/tool/${tool.id}`);
  };

  const showProModal = () => {
    router.push('/paywall');
  };

  const showUpgradeModal = (type: 'text' | 'image') => {
    const message = type === 'text' 
      ? 'You\'ve used all 10 of your free AI requests today. Upgrade to Pro for unlimited access!'
      : 'You\'ve used your free image generation for today. Upgrade to Pro for unlimited images!';
    
    Alert.alert(
      'Daily Limit Reached',
      message,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: showProModal },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {/* Premium Header */}
        <View style={[
          commonStyles.header,
          {
            backgroundColor: colors.glassBackgroundUltra,
            borderBottomWidth: 1,
            borderBottomColor: colors.glassBorderStrong,
            shadowColor: colors.glowNeonTeal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }
        ]}>
          <View>
            <Text style={[
              commonStyles.headerTitle,
              {
                color: colors.neonTeal,
                textShadowColor: colors.glowNeonTeal,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              }
            ]}>
              AI Tools
            </Text>
            <Text style={[
              commonStyles.textSmall,
              { 
                color: colors.neonGreen, 
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginTop: -4
              }
            ]}>
              Creator Suite
            </Text>
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: colors.glassBackgroundStrong,
              borderRadius: 16,
              padding: 12,
              borderWidth: 2,
              borderColor: colors.neonPurple + '40',
              shadowColor: colors.glowNeonPurple,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={showProModal}
          >
            <LinearGradient
              colors={[colors.neonPurple + '20', colors.neonPurple + '10']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
            <Ionicons name="diamond" size={24} color={colors.neonPurple} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats Card */}
          <PremiumStatsCard quota={quota} />

          {/* Personalized Recommendations */}
          {profile && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={[
                commonStyles.subtitle,
                { marginBottom: 12, color: theme.primary }
              ]}>
                Recommended for {profile.niche} Creators
              </Text>
              <Text style={[
                commonStyles.textSmall,
                { color: colors.textSecondary, marginBottom: 16 }
              ]}>
                {getPersonalizedRecommendations(profile)[0]}
              </Text>
            </View>
          )}

          {/* Tools Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 8,
          }}>
            {TOOLS.map((tool, index) => (
              <View key={tool.id} style={{ width: '50%' }}>
                <PremiumToolCard
                  tool={tool}
                  index={index}
                  onPress={() => handleToolPress(tool)}
                  quota={quota}
                />
              </View>
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Premium Feature Lock Modal */}
        {showPremiumLock && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onPress={() => setShowPremiumLock(false)}
            />
            
            <PremiumFeatureLock
              title="Premium Feature"
              description="This advanced tool is available with VIRALYZE Pro. Upgrade now to unlock unlimited AI requests and premium features."
              onUpgrade={() => {
                setShowPremiumLock(false);
                showProModal();
              }}
              icon="diamond"
            />
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
