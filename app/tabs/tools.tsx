
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
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
    description: '30-60s scripts with Hook → Value → CTA',
    icon: 'document-text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'hook-generator',
    title: 'Hook Generator',
    description: '10 viral hooks ≤12 words each',
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'caption-generator',
    title: 'Caption Generator',
    description: '5 caption styles for any platform',
    icon: 'text' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day plan with optimal posting times',
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Adapt content for TikTok, IG, YouTube, X, LinkedIn',
    icon: 'repeat' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Detect risky content + safe rewrites',
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    isPro: true,
  },
  {
    id: 'image-maker',
    title: 'AI Image Maker',
    description: 'Generate images in 16:9, 4:5, 1:1 formats',
    icon: 'image' as keyof typeof Ionicons.glyphMap,
    isPro: false,
  },
];

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

  const renderTool = (tool: typeof TOOLS[0]) => (
    <TouchableOpacity
      key={tool.id}
      style={[commonStyles.card, { marginHorizontal: 16 }]}
      onPress={() => handleToolPress(tool)}
    >
      <View style={[commonStyles.row, { alignItems: 'flex-start', gap: 16 }]}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: tool.isPro ? colors.warning : colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name={tool.icon} size={24} color={colors.white} />
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={[commonStyles.row, commonStyles.spaceBetween, { alignItems: 'flex-start' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
              {tool.title}
            </Text>
            {tool.isPro && (
              <View style={{
                backgroundColor: colors.warning,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ color: colors.white, fontSize: 10, fontWeight: '600' }}>
                  PRO
                </Text>
              </View>
            )}
          </View>
          <Text style={commonStyles.smallText}>
            {tool.description}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={colors.grey} />
      </View>
    </TouchableOpacity>
  );

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

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingBottom: 100 }}>
            {TOOLS.map(renderTool)}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
