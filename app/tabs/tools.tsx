
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
import { useQuota } from '../../hooks/useQuota';
import { useToast } from '../../contexts/ToastContext';
import QuotaPill from '../../components/QuotaPill';
import AnimatedCard from '../../components/AnimatedCard';
import UpgradeModal from '../../components/UpgradeModal';

const TOOLS = [
  {
    id: 'script',
    title: 'Script Generator',
    description: '30-60s scripts with Hook → Value → CTA',
    icon: 'document-text' as const,
    type: 'text' as const,
    color: colors.accent,
  },
  {
    id: 'hook',
    title: 'Hook Generator',
    description: '10 viral hooks under 12 words',
    icon: 'flash' as const,
    type: 'text' as const,
    color: '#F59E0B',
  },
  {
    id: 'caption',
    title: 'Caption Generator',
    description: '5 caption styles for any platform',
    icon: 'text' as const,
    type: 'text' as const,
    color: '#8B5CF6',
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: '7-day plan with posting times',
    icon: 'calendar' as const,
    type: 'text' as const,
    color: '#06B6D4',
  },
  {
    id: 'rewrite',
    title: 'Cross-Post Rewriter',
    description: 'Adapt content for different platforms',
    icon: 'repeat' as const,
    type: 'text' as const,
    color: '#EC4899',
  },
  {
    id: 'guardian',
    title: 'Guideline Guardian',
    description: 'Detect risky content + safe rewrites',
    icon: 'shield-checkmark' as const,
    type: 'text' as const,
    color: '#10B981',
    isPro: true,
  },
  {
    id: 'image',
    title: 'AI Image Maker',
    description: 'Generate images in multiple sizes',
    icon: 'image' as const,
    type: 'image' as const,
    color: '#F97316',
  },
];

export default function ToolsScreen() {
  const { quota, canUseFeature, getRemainingUsage } = useQuota();
  const { showToast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeType, setUpgradeType] = useState<'text' | 'image'>('text');

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    if (tool.isPro && !quota.isPro) {
      setUpgradeType('text');
      setShowUpgradeModal(true);
      return;
    }

    if (!canUseFeature(tool.type)) {
      setUpgradeType(tool.type);
      setShowUpgradeModal(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tool/${tool.id}`);
  };

  const renderTool = (tool: typeof TOOLS[0], index: number) => (
    <AnimatedCard
      key={tool.id}
      delay={index * 100}
      onPress={() => handleToolPress(tool)}
      style={styles.toolCard}
    >
      <View style={styles.toolHeader}>
        <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
          <Ionicons name={tool.icon} size={24} color={tool.color} />
        </View>
        {tool.isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.toolTitle}>{tool.title}</Text>
      <Text style={styles.toolDescription}>{tool.description}</Text>
      
      {!canUseFeature(tool.type) && !tool.isPro && (
        <View style={styles.limitBadge}>
          <Text style={styles.limitText}>Daily limit reached</Text>
        </View>
      )}
    </AnimatedCard>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tools</Text>
        <View style={styles.quotaContainer}>
          <QuotaPill
            remaining={getRemainingUsage('text')}
            total={quota.maxTextRequests}
            type="text"
          />
          <QuotaPill
            remaining={getRemainingUsage('image')}
            total={quota.maxImageRequests}
            type="image"
          />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>AI Content Tools</Text>
        <Text style={styles.sectionSubtitle}>
          Generate viral content tailored to your niche and audience
        </Text>

        <View style={styles.toolsGrid}>
          {TOOLS.map((tool, index) => renderTool(tool, index))}
        </View>

        {!quota.isPro && (
          <AnimatedCard style={styles.upgradeCard} delay={TOOLS.length * 100}>
            <View style={styles.upgradeHeader}>
              <Ionicons name="star" size={24} color={colors.warning} />
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            </View>
            <Text style={styles.upgradeDescription}>
              Get unlimited access to all tools and unlock exclusive features
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Text style={styles.upgradeButtonText}>Learn More</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </AnimatedCard>
        )}
      </ScrollView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type={upgradeType}
      />
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  quotaContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 24,
    lineHeight: 22,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  toolHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  proBadge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  proText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.white,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
  },
  limitBadge: {
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
    marginTop: 8,
  },
  limitText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500' as const,
  },
  upgradeCard: {
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  upgradeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 8,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  upgradeDescription: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
};
