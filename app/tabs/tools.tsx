
import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { QuotaUsage } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { getPersonalizedRecommendations } from '../../utils/personalization';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
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
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';

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
    id: 'script',
    title: 'Script Generator',
    description: '30-60s video scripts',
    icon: 'videocam',
    gradient: ['#22C55E', '#0891B2'],
    type: 'text' as const,
  },
  {
    id: 'hook',
    title: 'Hook Generator',
    description: 'Attention-grabbing openers',
    icon: 'fish',
    gradient: ['#F59E0B', '#06B6D4'],
    type: 'text' as const,
  },
  {
    id: 'caption',
    title: 'Caption Generator',
    description: 'Engaging post captions',
    icon: 'create',
    gradient: ['#8B5CF6', '#06B6D4'],
    type: 'text' as const,
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day posting plan',
    icon: 'calendar',
    gradient: ['#06B6D4', '#22C55E'],
    type: 'text' as const,
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Adapt for platforms',
    icon: 'refresh',
    gradient: ['#EC4899', '#06B6D4'],
    type: 'text' as const,
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Safe content checker',
    icon: 'shield-checkmark',
    gradient: ['#EF4444', '#F59E0B'],
    type: 'text' as const,
    isPro: true,
  },
  {
    id: 'image',
    title: 'AI Image Maker',
    description: 'Custom visuals',
    icon: 'image',
    gradient: ['#10B981', '#06B6D4'],
    type: 'image' as const,
  },
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
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
    scaleAnim.value = withDelay(index * 100, withSpring(1, { tension: 300, friction: 8 }));
  }, [index]);

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
    if (tool.type === 'text') return quota.text >= 2;
    if (tool.type === 'image') return quota.image >= 1;
    return false;
  };

  const getRemainingUses = () => {
    if (!quota) return 'N/A';
    if (tool.type === 'text') return `${2 - quota.text}/2`;
    if (tool.type === 'image') return `${1 - quota.image}/1`;
    return 'N/A';
  };

  const getUsageColor = () => {
    if (!quota) return colors.textSecondary;
    const remaining = tool.type === 'text' ? 2 - quota.text : 1 - quota.image;
    if (remaining === 0) return colors.error;
    if (remaining === 1 && tool.type === 'text') return colors.warning;
    return colors.accent;
  };

  return (
    <Animated.View style={[{ width: '48%', marginBottom: 16 }, animatedStyle]}>
      <TouchableOpacity
        style={[
          commonStyles.glassCard,
          {
            padding: 20,
            minHeight: 160,
            opacity: isLowQuota() ? 0.6 : 1,
            borderColor: isLowQuota() ? colors.error + '30' : colors.glassBorderStrong,
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isLowQuota()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[
            tool.gradient[0] + '15',
            tool.gradient[1] + '15'
          ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
        
        {/* Pro Badge */}
        {tool.isPro && (
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: colors.warning + '20',
            borderColor: colors.warning + '40',
            borderWidth: 1,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={[commonStyles.textSmall, { color: colors.warning, fontSize: 10 }]}>
              PRO
            </Text>
          </View>
        )}
        
        {/* Icon */}
        <View style={{
          backgroundColor: tool.gradient[0] + '20',
          borderRadius: 16,
          padding: 12,
          alignSelf: 'flex-start',
          marginBottom: 12,
        }}>
          <Ionicons name={tool.icon as any} size={24} color={tool.gradient[0]} />
        </View>
        
        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text style={[commonStyles.textBold, { fontSize: 16, marginBottom: 4 }]}>
              {tool.title}
            </Text>
            <Text style={[commonStyles.textSmall, { fontSize: 12 }]}>
              {tool.description}
            </Text>
          </View>
          
          {/* Usage indicator */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
          }}>
            <Text style={[
              commonStyles.textSmall,
              { color: getUsageColor(), fontSize: 11, fontWeight: '600' }
            ]}>
              {getRemainingUses()} left
            </Text>
            
            {isLowQuota() && (
              <Ionicons name="lock-closed" size={14} color={colors.error} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumStatsCard: React.FC<PremiumStatsCardProps> = ({ quota }) => {
  const { theme, profile, recommendations } = usePersonalization();
  const pulseAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 600 });
    
    if (quota && (quota.text >= 2 || quota.image >= 1)) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [quota]);

  return (
    <Animated.View style={[commonStyles.glassCard, { margin: 16 }, animatedStyle]}>
      <LinearGradient
        colors={[theme.gradient[0] + '10', theme.gradient[1] + '10']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
        }}
      />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={[commonStyles.textBold, { fontSize: 18, marginBottom: 4 }]}>
            Daily Usage
          </Text>
          <Text style={commonStyles.textSmall}>
            Track your AI requests
          </Text>
        </View>
        
        <View style={{
          backgroundColor: theme.primary + '20',
          borderRadius: 12,
          padding: 8,
        }}>
          <Ionicons name="analytics" size={20} color={theme.primary} />
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[commonStyles.textBold, { color: colors.accent }]}>
            {quota?.text || 0}/2
          </Text>
          <Text style={[commonStyles.textSmall, { fontSize: 11 }]}>
            Text Requests
          </Text>
        </View>
        
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[commonStyles.textBold, { color: colors.warning }]}>
            {quota?.image || 0}/1
          </Text>
          <Text style={[commonStyles.textSmall, { fontSize: 11 }]}>
            Image Requests
          </Text>
        </View>
      </View>
      
      {/* Personalized recommendations */}
      {profile && recommendations.length > 0 && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
          <Text style={[commonStyles.textBold, { fontSize: 14, marginBottom: 8 }]}>
            Recommended for {profile.niche} creators:
          </Text>
          <Text style={[commonStyles.textSmall, { fontSize: 12 }]}>
            • {recommendations[0]}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default function ToolsScreen() {
  console.log('🛠️ Tools screen rendered');
  
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  
  const { profile, theme, isPersonalized } = usePersonalization();
  
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadQuota();
  }, []);

  const loadQuota = async () => {
    try {
      const quotaData = await storage.getQuotaUsage();
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    // Check quota before proceeding
    if (tool.type === 'text' && quota && quota.text >= 2) {
      showUpgradeModal('text');
      return;
    }
    
    if (tool.type === 'image' && quota && quota.image >= 1) {
      showUpgradeModal('image');
      return;
    }
    
    if (tool.isPro) {
      showProModal();
      return;
    }
    
    router.push(`/tool/${tool.id}`);
  };

  const showProModal = () => {
    Alert.alert(
      'Pro Feature',
      'This tool is available with Viralyze Pro. Upgrade to unlock all premium features!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
      ]
    );
  };

  const showUpgradeModal = (type: 'text' | 'image') => {
    const message = type === 'text' 
      ? 'You\'ve used all your free AI text requests for today.'
      : 'You\'ve used your free AI image request for today.';
      
    Alert.alert(
      'Daily Limit Reached',
      `${message} Upgrade to Pro for unlimited access!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {/* Header */}
        <View style={[commonStyles.header, { paddingBottom: 8 }]}>
          <View>
            <Text style={commonStyles.headerTitle}>Tools</Text>
            {isPersonalized && (
              <Text style={[commonStyles.textSmall, { color: theme.primary }]}>
                Personalized for {profile?.niche || 'Content'} creators
              </Text>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats Card */}
          <PremiumStatsCard quota={quota} />

          {/* Tools Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}>
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

          {/* Personalized Recommendations */}
          {isPersonalized && (
            <View style={[commonStyles.glassCard, { margin: 16 }]}>
              <LinearGradient
                colors={[theme.gradient[0] + '08', theme.gradient[1] + '08']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 24,
                }}
              />
              
              <Text style={[commonStyles.textBold, { marginBottom: 12 }]}>
                Recommended Tools for You
              </Text>
              
              <Text style={[commonStyles.textSmall, { marginBottom: 8 }]}>
                As a {profile?.niche || 'content'} creator with {profile?.followers || 0} followers:
              </Text>
              
              <View>
                <Text style={[commonStyles.textSmall, { marginBottom: 4 }]}>
                  • Try the <Text style={{ fontWeight: '600' }}>Hook Generator</Text> for engaging openers
                </Text>
                <Text style={[commonStyles.textSmall, { marginBottom: 4 }]}>
                  • Use <Text style={{ fontWeight: '600' }}>Script Generator</Text> for video content
                </Text>
                <Text style={[commonStyles.textSmall, { marginBottom: 4 }]}>
                  • Plan with <Text style={{ fontWeight: '600' }}>Content Calendar</Text> for consistency
                </Text>
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
