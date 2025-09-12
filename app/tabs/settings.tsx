
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { storage } from '../../utils/storage';
import { commonStyles, colors, spacing, borderRadius } from '../../styles/commonStyles';
import { OnboardingData, QuotaUsage } from '../../types';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const [preferences, setPreferences] = useState({
    hapticsEnabled: true,
    reducedMotion: false,
  });
  const [debugTapCount, setDebugTapCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData, quotaData, prefsData] = await Promise.all([
        storage.getOnboardingData(),
        storage.getQuotaUsage(),
        storage.getUserPreferences(),
      ]);
      
      setProfile(profileData);
      setQuota(quotaData);
      setPreferences(prefsData);
    } catch (error) {
      console.log('Error loading settings data:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/onboarding');
  };

  const handleExportData = async () => {
    try {
      const exportData = await storage.exportData();
      await Share.share({
        message: exportData,
        title: 'VIRALYZE Data Export',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your saved items, chat history, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'All data has been cleared');
              await loadData();
            } catch (error) {
              console.log('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // In a real app, you'd handle sign out here
            console.log('Sign out');
          },
        },
      ]
    );
  };

  const togglePreference = async (key: string, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await storage.saveUserPreferences(newPrefs);
    
    if (newPrefs.hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleVersionTap = () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    
    if (newCount >= 5) {
      setDebugTapCount(0);
      Alert.alert('Debug Mode', 'Debug information would be shown here');
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    destructive?: boolean
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.settingIcon,
          destructive && styles.settingIconDestructive
        ]}>
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? colors.error : colors.accent}
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            destructive && styles.settingTitleDestructive
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.grey} />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <ScrollView style={commonStyles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[commonStyles.h1, styles.headerTitle]}>Settings</Text>
        </View>

        {/* Profile Card */}
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={24} color={colors.white} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.platforms.join(', ')} Creator
              </Text>
              <Text style={styles.profileNiche}>{profile.niche}</Text>
              <Text style={styles.profileFollowers}>
                {profile.followers.toLocaleString()} followers
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Subscription */}
        {renderSection('Subscription', (
          <>
            {renderSettingItem(
              'star',
              'Free Plan',
              'Upgrade to unlock unlimited features',
              () => console.log('Navigate to upgrade'),
              <View style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </View>
            )}
          </>
        ))}

        {/* Usage Stats */}
        {quota && renderSection('Usage', (
          <View style={styles.usageCards}>
            <View style={styles.usageCard}>
              <Text style={styles.usageNumber}>
                {quota.textRequests}/{quota.maxTextRequests}
              </Text>
              <Text style={styles.usageLabel}>AI Requests</Text>
            </View>
            <View style={styles.usageCard}>
              <Text style={styles.usageNumber}>
                {quota.imageRequests}/{quota.maxImageRequests}
              </Text>
              <Text style={styles.usageLabel}>Images</Text>
            </View>
          </View>
        ))}

        {/* Preferences */}
        {renderSection('Preferences', (
          <>
            {renderSettingItem(
              'phone-portrait',
              'Haptic Feedback',
              'Feel vibrations for interactions',
              undefined,
              <Switch
                value={preferences.hapticsEnabled}
                onValueChange={(value) => togglePreference('hapticsEnabled', value)}
                trackColor={{ false: colors.border, true: colors.accent + '50' }}
                thumbColor={preferences.hapticsEnabled ? colors.accent : colors.grey}
              />
            )}
            {renderSettingItem(
              'accessibility',
              'Reduced Motion',
              'Minimize animations and transitions',
              undefined,
              <Switch
                value={preferences.reducedMotion}
                onValueChange={(value) => togglePreference('reducedMotion', value)}
                trackColor={{ false: colors.border, true: colors.accent + '50' }}
                thumbColor={preferences.reducedMotion ? colors.accent : colors.grey}
              />
            )}
          </>
        ))}

        {/* Data Management */}
        {renderSection('Data', (
          <>
            {renderSettingItem(
              'download',
              'Export Data',
              'Download your data as JSON',
              handleExportData
            )}
            {renderSettingItem(
              'trash',
              'Clear All Data',
              'Delete all saved items and preferences',
              handleClearData,
              undefined,
              true
            )}
          </>
        ))}

        {/* Account */}
        {renderSection('Account', (
          <>
            {renderSettingItem(
              'log-out',
              'Sign Out',
              undefined,
              handleSignOut,
              undefined,
              true
            )}
          </>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleVersionTap}>
            <Text style={styles.footerText}>VIRALYZE v1.0.0</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>About • Privacy • Terms</Text>
          </TouchableOpacity>
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
    marginBottom: 0,
  },
  profileCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  profileNiche: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  profileFollowers: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  settingIconDestructive: {
    backgroundColor: colors.error + '20',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  settingTitleDestructive: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.grey,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.white,
  },
  usageCards: {
    flexDirection: 'row' as const,
    padding: spacing.md,
  },
  usageCard: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
  },
  usageNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  usageLabel: {
    fontSize: 13,
    color: colors.grey,
    fontWeight: '500' as const,
  },
  footer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  footerLink: {
    fontSize: 13,
    color: colors.accent,
  },
};
