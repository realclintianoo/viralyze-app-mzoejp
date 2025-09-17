
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
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

interface AnimatedToolCardProps {
  tool: typeof TOOLS[0];
  index: number;
  onPress: () => void;
}

function AnimatedToolCard({ tool, index, onPress }: AnimatedToolCardProps) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const translateYAnim = new Animated.Value(30);

  useEffect(() => {
    const delay = index * 100; // Stagger animation by 100ms per card
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    // Scale down animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ],
      }}
    >
      <TouchableOpacity
        style={{
          width: cardWidth,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 140,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          elevation: 4,
        }}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Icon Container */}
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: tool.isPro ? colors.warning : colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}>
          <Ionicons name={tool.icon} size={28} color={colors.white} />
        </View>
        
        {/* Title and Pro Badge */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{
            fontSize: 16,
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
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              marginBottom: 4,
            }}>
              <Text style={{ 
                color: colors.white, 
                fontSize: 10, 
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
          fontSize: 12,
          color: colors.grey,
          textAlign: 'center',
          lineHeight: 16,
        }}>
          {tool.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ToolsScreen() {
  const [quota, setQuota] = useState<QuotaUsage | null>(null);

  useEffect(() => {
    loadQuota();
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={commonStyles.title}>AI Tools</Text>
          {quota && (
            <Text style={commonStyles.smallText}>
              {quota.maxTextRequests - quota.textRequests} text • {quota.maxImageRequests - quota.imageRequests} image requests left today
            </Text>
          )}
        </View>

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
