
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
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { storage } from '../../utils/storage';
import { commonStyles, colors, spacing, borderRadius } from '../../styles/commonStyles';
import { QuotaUsage } from '../../types';

const TOOLS = [
  {
    id: 'script',
    title: 'Script Generator',
    description: '30-60s viral scripts',
    icon: 'document-text',
    color: colors.accent,
    isPro: false,
    type: 'text' as const,
  },
  {
    id: 'hook',
    title: 'Hook Generator',
    description: '10 hooks ≤12 words',
    icon: 'flash',
    color: '#F59E0B',
    isPro: false,
    type: 'text' as const,
  },
  {
    id: 'caption',
    title: 'Caption Generator',
    description: '5 caption styles',
    icon: 'text',
    color: '#8B5CF6',
    isPro: false,
    type: 'text' as const,
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day posting plan',
    icon: 'calendar',
    color: '#06B6D4',
    isPro: false,
    type: 'text' as const,
  },
  {
    id: 'rewriter',
    title: 'Cross-Post Rewriter',
    description: 'Platform variants',
    icon: 'repeat',
    color: '#EF4444',
    isPro: true,
    type: 'text' as const,
  },
  {
    id: 'guideline',
    title: 'Guideline Guardian',
    description: 'Safe content check',
    icon: 'shield-checkmark',
    color: '#10B981',
    isPro: true,
    type: 'text' as const,
  },
  {
    id: 'image',
    title: 'AI Image Maker',
    description: 'Custom visuals',
    icon: 'image',
    color: '#F97316',
    isPro: true,
    type: 'image' as const,
  },
];

export default function ToolsScreen() {
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - spacing.md * 3) / 2; // 2 columns with spacing

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

  const handleToolPress = async (tool: typeof TOOLS[0]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (tool.isPro) {
      showProModal();
      return;
    }

    // Check quota
    if (quota) {
      if (tool.type === 'text' && quota.textRequests >= quota.maxTextRequests) {
        showUpgradeModal('text');
        return;
      }
      if (tool.type === 'image' && quota.imageRequests >= quota.maxImageRequests) {
        showUpgradeModal('image');
        return;
      }
    }

    router.push(`/tool/${tool.id}`);
  };

  const showProModal = () => {
    Alert.alert(
      'Pro Feature',
      'This tool is available with VIRALYZE Pro. Upgrade to unlock all premium features!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => console.log('Navigate to upgrade') },
      ]
    );
  };

  const showUpgradeModal = (type: 'text' | 'image') => {
    const message = type === 'text' 
      ? 'You\'ve used all your free text generations for today.'
      : 'You\'ve used your free image generation for today.';
    
    Alert.alert(
      'Daily Limit Reached',
      `${message} Upgrade to Pro for unlimited access!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => console.log('Navigate to upgrade') },
      ]
    );
  };

  const renderTool = (tool: typeof TOOLS[0]) => {
    const isDisabled = tool.isPro || (quota && (
      (tool.type === 'text' && quota.textRequests >= quota.maxTextRequests) ||
      (tool.type === 'image' && quota.imageRequests >= quota.maxImageRequests)
    ));

    return (
      <TouchableOpacity
        key={tool.id}
        style={[
          styles.toolCard,
          { width: cardWidth },
          isDisabled && styles.toolCardDisabled
        ]}
        onPress={() => handleToolPress(tool)}
        activeOpacity={0.8}
      >
        <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
          <Ionicons name={tool.icon as any} size={24} color={tool.color} />
        </View>
        
        <Text style={styles.toolTitle}>{tool.title}</Text>
        <Text style={styles.toolDescription}>{tool.description}</Text>
        
        {tool.isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        )}
        
        {isDisabled && !tool.isPro && (
          <View style={styles.limitBadge}>
            <Text style={styles.limitText}>LIMIT REACHED</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <ScrollView style={commonStyles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[commonStyles.h1, styles.headerTitle]}>AI Tools</Text>
          
          {quota && (
            <Text style={styles.usageText}>
              {quota.textRequests}/{quota.maxTextRequests} text • {quota.imageRequests}/{quota.maxImageRequests} image
            </Text>
          )}
        </View>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {TOOLS.map((tool, index) => (
            <View key={tool.id} style={index % 2 === 0 ? styles.leftColumn : styles.rightColumn}>
              {renderTool(tool)}
            </View>
          ))}
        </View>

        {/* Upgrade CTA */}
        <View style={styles.upgradeSection}>
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="star" size={24} color={colors.accent} />
            </View>
            <Text style={styles.upgradeTitle}>Unlock Pro Features</Text>
            <Text style={styles.upgradeDescription}>
              Get unlimited generations, exclusive tools, and priority support
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  usageText: {
    fontSize: 14,
    color: colors.grey,
    fontWeight: '500' as const,
  },
  toolsGrid: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  leftColumn: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: spacing.xs,
  },
  toolCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toolCardDisabled: {
    opacity: 0.6,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.sm,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  toolDescription: {
    fontSize: 13,
    color: colors.grey,
    lineHeight: 18,
  },
  proBadge: {
    position: 'absolute' as const,
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.white,
  },
  limitBadge: {
    position: 'absolute' as const,
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  limitText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.white,
  },
  upgradeSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  upgradeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  upgradeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  upgradeDescription: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
};
