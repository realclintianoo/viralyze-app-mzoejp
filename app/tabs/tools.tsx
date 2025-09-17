
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { QuotaUsage } from '../../types';

const TOOLS = [
  {
    id: 'script-generator',
    title: 'Script Generator',
    description: '30-60s scripts',
    icon: 'document-text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'hook-generator',
    title: 'Hook Generator',
    description: '10 viral hooks',
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'caption-generator',
    title: 'Caption Generator',
    description: '5 caption styles',
    icon: 'text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day plan',
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Multi-platform',
    icon: 'repeat' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Safe rewrites',
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    isPro: true,
  },
  {
    id: 'image-maker',
    title: 'AI Image Maker',
    description: 'Generate images',
    icon: 'image' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
];

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with 16px margins and 16px gap

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedToolCardProps {
  tool: typeof TOOLS[0];
  index: number;
  onPress: () => void;
}

function AnimatedToolCard({ tool, index, onPress }: AnimatedToolCardProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 150; // Stagger animation by 150ms per card
    
    // Entrance animation
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scale.value = withDelay(delay, withSpring(1, { 
      damping: 15, 
      stiffness: 150,
      mass: 1,
    }));
    translateY.value = withDelay(delay, withSpring(0, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * pressScale.value },
        { translateY: translateY.value }
      ],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    // Add haptic feedback
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    runOnJS(onPress)();
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        {
          width: cardWidth,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 130,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
    >
      {/* Icon Container */}
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: tool.isPro ? colors.warning : colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
      }}>
        <Ionicons name={tool.icon} size={24} color={colors.white} />
      </View>
      
      {/* Title and Pro Badge */}
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {tool.title}
        </Text>
        {tool.isPro && (
          <View style={{
            backgroundColor: colors.warning,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            marginBottom: 4,
          }}>
            <Text style={{ 
              color: colors.white, 
              fontSize: 9, 
              fontWeight: '700',
              letterSpacing: 0.5,
            }}>
              PRO
            </Text>
          </View>
        )}
      </View>
      
      {/* Description */}
      <Text style={{
        fontSize: 11,
        color: colors.grey,
        textAlign: 'center',
        lineHeight: 14,
      }}>
        {tool.description}
      </Text>
    </AnimatedTouchableOpacity>
  );
}

export default function ToolsScreen() {
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    loadQuota();
    
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 400 });
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
      if (!quota || quota.imageRequests >= quota.maxImageRequests) {
        showUpgradeModal('image');
        return;
      }
    } else {
      if (!quota || quota.textRequests >= quota.maxTextRequests) {
        showUpgradeModal('text');
        return;
      }
    }

    router.push(`/tool/${tool.id}` as any);
  };

  const showProModal = () => {
    Alert.alert(
      'Pro Feature',
      'This tool is available with VIRALYZE Pro. Upgrade to unlock all features!',
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
      `${message} Upgrade to Pro for unlimited access!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => console.log('Upgrade pressed') },
      ]
    );
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Animated Header */}
        <Animated.View style={[{ padding: 16, paddingBottom: 8 }, headerAnimatedStyle]}>
          <Text style={commonStyles.title}>AI Tools</Text>
          {quota && (
            <Text style={commonStyles.smallText}>
              {quota.maxTextRequests - quota.textRequests} text • {quota.maxImageRequests - quota.imageRequests} image requests left today
            </Text>
          )}
        </Animated.View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
          }}>
            {TOOLS.map((tool, index) => (
              <AnimatedToolCard
                key={tool.id}
                tool={tool}
                index={index}
                onPress={() => handleToolPress(tool)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
