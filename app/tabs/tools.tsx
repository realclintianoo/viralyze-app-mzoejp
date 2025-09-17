
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { QuotaUsage } from '../../types';

const TOOLS = [
  {
    id: 'script-generator',
    title: 'Script Generator',
    description: '30-60s viral scripts',
    icon: 'document-text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: ['#22C55E', '#16A34A'],
    category: 'Content',
  },
  {
    id: 'hook-generator',
    title: 'Hook Generator',
    description: '10 attention-grabbing hooks',
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: ['#F59E0B', '#D97706'],
    category: 'Engagement',
  },
  {
    id: 'caption-generator',
    title: 'Caption Generator',
    description: '5 engaging caption styles',
    icon: 'text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: ['#8B5CF6', '#7C3AED'],
    category: 'Content',
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day strategic plan',
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: ['#06B6D4', '#0891B2'],
    category: 'Planning',
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Multi-platform optimization',
    icon: 'repeat' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: ['#EC4899', '#DB2777'],
    category: 'Optimization',
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Safe content rewrites',
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    isPro: true,
    gradient: ['#EF4444', '#DC2626'],
    category: 'Safety',
  },
  {
    id: 'image-maker',
    title: 'AI Image Maker',
    description: 'Generate stunning visuals',
    icon: 'image' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: ['#10B981', '#059669'],
    category: 'Visual',
  },
];

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with proper spacing

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedToolCardProps {
  tool: typeof TOOLS[0];
  index: number;
  onPress: () => void;
  quota: QuotaUsage | null;
}

function AnimatedToolCard({ tool, index, onPress, quota }: AnimatedToolCardProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);
  const pressScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  useEffect(() => {
    const delay = index * 120;
    
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    scale.value = withDelay(delay, withSpring(1, { 
      damping: 12, 
      stiffness: 120,
      mass: 1,
    }));
    translateY.value = withDelay(delay, withSpring(0, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value * pressScale.value },
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` }
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    glowOpacity.value = withTiming(1, { duration: 200 });
    rotateZ.value = withSpring(tool.isPro ? 2 : -1, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
    glowOpacity.value = withTiming(0, { duration: 400 });
    rotateZ.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    runOnJS(onPress)();
  };

  const isLowQuota = () => {
    if (!quota) return false;
    if (tool.id === 'image-maker') {
      return quota.image >= 1;
    }
    return quota.text >= 2;
  };

  const getRemainingUses = () => {
    if (!quota) return null;
    if (tool.id === 'image-maker') {
      return Math.max(0, 1 - quota.image);
    }
    return Math.max(0, 2 - quota.text);
  };

  return (
    <View style={{ marginBottom: 20, position: 'relative' }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -6,
            left: -6,
            right: -6,
            bottom: -6,
            borderRadius: 24,
            backgroundColor: tool.gradient[0],
            opacity: 0.2,
            shadowColor: tool.gradient[0],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 15,
          },
          glowStyle,
        ]}
      />
      
      <AnimatedTouchableOpacity
        style={[
          {
            width: cardWidth,
            height: 160,
            borderRadius: 18,
            overflow: 'hidden',
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
      >
        <BlurView intensity={25} style={{ flex: 1 }}>
          <LinearGradient
            colors={[
              `${tool.gradient[0]}15`,
              `${tool.gradient[1]}25`,
            ]}
            style={{
              flex: 1,
              padding: 16,
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: colors.glassBorder,
              position: 'relative',
            }}
          >
            {/* Category Badge */}
            <View
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: `${tool.gradient[0]}30`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: `${tool.gradient[0]}50`,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: tool.gradient[0],
                  letterSpacing: 0.5,
                }}
              >
                {tool.category.toUpperCase()}
              </Text>
            </View>

            {/* Icon and Pro Badge */}
            <View style={{ alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={tool.gradient}
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: tool.gradient[0],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Ionicons name={tool.icon} size={26} color={colors.white} />
                </LinearGradient>
              </View>
              
              {tool.isPro && (
                <View
                  style={{
                    backgroundColor: colors.warning,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    shadowColor: colors.warning,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 0.8,
                    }}
                  >
                    PRO
                  </Text>
                </View>
              )}
            </View>
            
            {/* Content */}
            <View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 4,
                  letterSpacing: -0.2,
                }}
              >
                {tool.title}
              </Text>
              
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 16,
                  marginBottom: 8,
                }}
              >
                {tool.description}
              </Text>

              {/* Usage indicator */}
              {!tool.isPro && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isLowQuota() ? colors.error : colors.success,
                      shadowColor: isLowQuota() ? colors.error : colors.success,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: isLowQuota() ? colors.error : colors.success,
                      letterSpacing: 0.3,
                    }}
                  >
                    {getRemainingUses()} LEFT TODAY
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </AnimatedTouchableOpacity>
    </View>
  );
}

interface StatsCardProps {
  quota: QuotaUsage | null;
}

function StatsCard({ quota }: StatsCardProps) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (quota && (quota.text >= 2 || quota.image >= 1)) {
      pulseScale.value = withRepeat(
        withTiming(1.02, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [quota]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!quota) return null;

  const textProgress = (2 - quota.text) / 2;
  const imageProgress = (1 - quota.image) / 1;

  return (
    <Animated.View style={[{ marginBottom: 24 }, animatedStyle]}>
      <BlurView intensity={25} style={{ borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.1)', 'rgba(22, 163, 74, 0.2)']}
          style={{
            padding: 20,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 16,
              letterSpacing: -0.2,
            }}
          >
            Daily Usage
          </Text>
          
          <View style={{ gap: 12 }}>
            {/* Text requests */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '600' }}>
                  Text Requests
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                  {2 - quota.text}/2
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.border,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={textProgress > 0.5 ? [colors.success, colors.gradientAccent] : [colors.warning, colors.error]}
                  style={{
                    height: '100%',
                    width: `${textProgress * 100}%`,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>

            {/* Image requests */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '600' }}>
                  Image Requests
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '700' }}>
                  {1 - quota.image}/1
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.border,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={imageProgress > 0.5 ? [colors.success, colors.gradientAccent] : [colors.warning, colors.error]}
                  style={{
                    height: '100%',
                    width: `${imageProgress * 100}%`,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

export default function ToolsScreen() {
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);

  useEffect(() => {
    loadQuota();
    
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const loadQuota = async () => {
    try {
      const quotaData = await storage.getQuotaUsage();
      setQuota(quotaData);
    } catch (error) {
      console.log('Error loading quota:', error);
    }
  };

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    if (tool.isPro) {
      showProModal();
      return;
    }

    if (tool.id === 'image-maker') {
      if (!quota || quota.image >= 1) {
        showUpgradeModal('image');
        return;
      }
    } else {
      if (!quota || quota.text >= 2) {
        showUpgradeModal('text');
        return;
      }
    }

    router.push(`/tool/${tool.id}` as any);
  };

  const showProModal = () => {
    Alert.alert(
      'Pro Feature',
      'This tool is available with VIRALYZE Pro. Upgrade to unlock all premium features and unlimited usage!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => console.log('Upgrade pressed') },
      ]
    );
  };

  const showUpgradeModal = (type: 'text' | 'image') => {
    const message = type === 'text' 
      ? 'You&apos;ve reached your daily text generation limit.'
      : 'You&apos;ve reached your daily image generation limit.';
    
    Alert.alert(
      'Upgrade to Pro',
      `${message} Upgrade to Pro for unlimited access and premium features!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => console.log('Upgrade pressed') },
      ]
    );
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Premium Header */}
        <Animated.View style={[{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }, headerAnimatedStyle]}>
          <BlurView intensity={20} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.1)', 'rgba(22, 163, 74, 0.2)']}
              style={{
                padding: 20,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <Text style={[commonStyles.title, { marginBottom: 4 }]}>
                AI Tools
              </Text>
              <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                Supercharge your content creation
              </Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        >
          {/* Stats Card */}
          <StatsCard quota={quota} />

          {/* Tools Grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {TOOLS.map((tool, index) => (
              <AnimatedToolCard
                key={tool.id}
                tool={tool}
                index={index}
                onPress={() => handleToolPress(tool)}
                quota={quota}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
