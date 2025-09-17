
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
  withSequence,
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
    gradient: colors.scriptGradient,
    category: 'Content',
    usageType: 'text',
  },
  {
    id: 'hook-generator',
    title: 'Hook Generator',
    description: '10 attention-grabbing hooks',
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: colors.hookGradient,
    category: 'Engagement',
    usageType: 'text',
  },
  {
    id: 'caption-generator',
    title: 'Caption Generator',
    description: '5 engaging caption styles',
    icon: 'text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: colors.captionGradient,
    category: 'Content',
    usageType: 'text',
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day strategic plan',
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: colors.calendarGradient,
    category: 'Planning',
    usageType: 'text',
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Multi-platform optimization',
    icon: 'repeat' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: colors.rewriterGradient,
    category: 'Optimization',
    usageType: 'text',
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Safe content rewrites',
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    isPro: true,
    gradient: colors.guardianGradient,
    category: 'Safety',
    usageType: 'text',
  },
  {
    id: 'image-maker',
    title: 'AI Image Maker',
    description: 'Generate stunning visuals',
    icon: 'image' as keyof typeof Ionicons.glyphMap,
    isPro: false,
    gradient: colors.imageGradient,
    category: 'Visual',
    usageType: 'image',
  },
];

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with proper spacing

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PremiumToolCardProps {
  tool: typeof TOOLS[0];
  index: number;
  onPress: () => void;
  quota: QuotaUsage | null;
}

function PremiumToolCard({ tool, index, onPress, quota }: PremiumToolCardProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(60);
  const pressScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const borderGlow = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 150;
    
    // Staggered entrance animation
    opacity.value = withDelay(delay, withTiming(1, { duration: 1000 }));
    scale.value = withDelay(delay, withSpring(1, { 
      damping: 10, 
      stiffness: 100,
      mass: 1.2,
    }));
    translateY.value = withDelay(delay, withSpring(0, {
      damping: 12,
      stiffness: 80,
      mass: 1,
    }));

    // Subtle idle animation
    setTimeout(() => {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );
    }, delay + 1000);
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

  const borderGlowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.88, { damping: 12, stiffness: 400 });
    glowOpacity.value = withTiming(1, { duration: 200 });
    borderGlow.value = withTiming(1, { duration: 200 });
    rotateZ.value = withSpring(tool.isPro ? 3 : -2, { damping: 12, stiffness: 300 });
    iconScale.value = withSpring(1.2, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 400 });
    glowOpacity.value = withTiming(0, { duration: 500 });
    borderGlow.value = withTiming(0, { duration: 500 });
    rotateZ.value = withSpring(0, { damping: 12, stiffness: 300 });
    iconScale.value = withSpring(1.1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
    runOnJS(onPress)();
  };

  const isLowQuota = () => {
    if (!quota) return false;
    if (tool.usageType === 'image') {
      return quota.image >= 1;
    }
    return quota.text >= 2;
  };

  const getRemainingUses = () => {
    if (!quota) return null;
    if (tool.usageType === 'image') {
      return Math.max(0, 1 - quota.image);
    }
    return Math.max(0, 2 - quota.text);
  };

  const getUsageColor = () => {
    const remaining = getRemainingUses();
    if (remaining === null) return colors.success;
    if (remaining > 1) return colors.success;
    if (remaining === 1) return colors.warning;
    return colors.error;
  };

  return (
    <View style={{ marginBottom: 20, position: 'relative' }}>
      {/* Outer glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            borderRadius: 28,
            backgroundColor: tool.gradient[0],
            opacity: 0.15,
            shadowColor: tool.gradient[0],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 24,
            elevation: 20,
          },
          glowStyle,
        ]}
      />

      {/* Border glow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: tool.gradient[0],
            opacity: 0.6,
          },
          borderGlowStyle,
        ]}
      />
      
      <AnimatedTouchableOpacity
        style={[
          {
            width: cardWidth,
            height: 170,
            borderRadius: 20,
            overflow: 'hidden',
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
      >
        <BlurView intensity={30} style={{ flex: 1 }}>
          <LinearGradient
            colors={[
              `${tool.gradient[0]}12`,
              `${tool.gradient[1]}20`,
            ]}
            style={[
              commonStyles.toolCardContent,
              {
                flex: 1,
                justifyContent: 'space-between',
                position: 'relative',
              }
            ]}
          >
            {/* Category Badge */}
            <View
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: `${tool.gradient[0]}25`,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: `${tool.gradient[0]}40`,
                shadowColor: tool.gradient[0],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: tool.gradient[0],
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                {tool.category}
              </Text>
            </View>

            {/* Icon and Pro Badge */}
            <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
              <Animated.View
                style={[
                  {
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    overflow: 'hidden',
                  },
                  iconAnimatedStyle,
                ]}
              >
                <LinearGradient
                  colors={tool.gradient}
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: tool.gradient[0],
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Ionicons name={tool.icon} size={28} color={colors.white} />
                </LinearGradient>
              </Animated.View>
              
              {tool.isPro && (
                <View
                  style={{
                    backgroundColor: colors.warning,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    shadowColor: colors.warning,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    elevation: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 10,
                      fontWeight: '900',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    PRO
                  </Text>
                </View>
              )}
            </View>
            
            {/* Content */}
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: colors.text,
                  marginBottom: 6,
                  letterSpacing: -0.3,
                  lineHeight: 20,
                }}
              >
                {tool.title}
              </Text>
              
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 16,
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                {tool.description}
              </Text>

              {/* Usage indicator */}
              {!tool.isPro && (
                <View style={[commonStyles.usageCounter, { alignSelf: 'flex-start' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        commonStyles.statusDot,
                        {
                          backgroundColor: getUsageColor(),
                          shadowColor: getUsageColor(),
                        }
                      ]}
                    />
                    <Text
                      style={[
                        commonStyles.usageCounterText,
                        { color: getUsageColor() }
                      ]}
                    >
                      {getRemainingUses()} LEFT TODAY
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </AnimatedTouchableOpacity>
    </View>
  );
}

interface PremiumStatsCardProps {
  quota: QuotaUsage | null;
}

function PremiumStatsCard({ quota }: PremiumStatsCardProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (quota && (quota.text >= 2 || quota.image >= 1)) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000 }),
          withTiming(0.3, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [quota]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!quota) return null;

  const textProgress = (2 - quota.text) / 2;
  const imageProgress = (1 - quota.image) / 1;

  return (
    <View style={{ marginBottom: 28, position: 'relative' }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -6,
            left: -6,
            right: -6,
            bottom: -6,
            borderRadius: 26,
            backgroundColor: colors.success,
            shadowColor: colors.success,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 16,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[animatedStyle]}>
        <BlurView intensity={30} style={{ borderRadius: 20, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.08)', 'rgba(22, 163, 74, 0.15)']}
            style={[
              commonStyles.premiumCard,
              { margin: 0, borderColor: colors.glassBorderStrong }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <LinearGradient
                colors={[colors.success, colors.gradientAccent]}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  shadowColor: colors.success,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Ionicons name="stats-chart" size={20} color={colors.white} />
              </LinearGradient>
              
              <Text style={[commonStyles.textLarge, { flex: 1 }]}>
                Daily Usage
              </Text>
            </View>
            
            <View style={{ gap: 16 }}>
              {/* Text requests */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[commonStyles.textBold, { fontSize: 15 }]}>
                    Text Requests
                  </Text>
                  <Text style={[commonStyles.textBold, { fontSize: 15, color: textProgress > 0.5 ? colors.success : colors.warning }]}>
                    {2 - quota.text}/2
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.border,
                    borderRadius: 4,
                    overflow: 'hidden',
                    shadowColor: colors.neuDark,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={textProgress > 0.5 ? [colors.success, colors.gradientAccent] : [colors.warning, colors.error]}
                    style={{
                      height: '100%',
                      width: `${textProgress * 100}%`,
                      borderRadius: 4,
                      shadowColor: textProgress > 0.5 ? colors.success : colors.warning,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  />
                </View>
              </View>

              {/* Image requests */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[commonStyles.textBold, { fontSize: 15 }]}>
                    Image Requests
                  </Text>
                  <Text style={[commonStyles.textBold, { fontSize: 15, color: imageProgress > 0.5 ? colors.success : colors.warning }]}>
                    {1 - quota.image}/1
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.border,
                    borderRadius: 4,
                    overflow: 'hidden',
                    shadowColor: colors.neuDark,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <LinearGradient
                    colors={imageProgress > 0.5 ? [colors.success, colors.gradientAccent] : [colors.warning, colors.error]}
                    style={{
                      height: '100%',
                      width: `${imageProgress * 100}%`,
                      borderRadius: 4,
                      shadowColor: imageProgress > 0.5 ? colors.success : colors.warning,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
}

export default function ToolsScreen() {
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-40);
  const headerScale = useSharedValue(0.9);

  useEffect(() => {
    loadQuota();
    
    // Premium header animation
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 12, stiffness: 120 });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
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

    if (tool.usageType === 'image') {
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
      '🚀 Pro Feature',
      'This premium tool is available with VIRALYZE Pro. Unlock unlimited usage, advanced features, and priority support!',
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
      '⚡ Upgrade to Pro',
      `${message}\n\nUpgrade to Pro for:\n• Unlimited generations\n• Premium tools\n• Priority support\n• Advanced features`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => console.log('Upgrade pressed') },
      ]
    );
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      { translateY: headerTranslateY.value },
      { scale: headerScale.value }
    ],
  }));

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Premium Header */}
        <Animated.View style={[{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }, headerAnimatedStyle]}>
          <BlurView intensity={25} style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.08)', 'rgba(22, 163, 74, 0.15)']}
              style={[
                commonStyles.premiumCard,
                { margin: 0, borderColor: colors.glassBorderStrong }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    shadowColor: colors.glowPrimary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Ionicons name="construct" size={24} color={colors.white} />
                </LinearGradient>
                
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.title, { marginBottom: 2 }]}>
                    AI Tools
                  </Text>
                  <Text style={[commonStyles.textSmall, { opacity: 0.9, fontWeight: '600' }]}>
                    Supercharge your content creation
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        >
          {/* Premium Stats Card */}
          <PremiumStatsCard quota={quota} />

          {/* Premium Tools Grid */}
          <View style={commonStyles.gridContainer}>
            {TOOLS.map((tool, index) => (
              <View key={tool.id} style={commonStyles.gridItem}>
                <PremiumToolCard
                  tool={tool}
                  index={index}
                  onPress={() => handleToolPress(tool)}
                  quota={quota}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
