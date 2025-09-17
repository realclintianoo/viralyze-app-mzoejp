
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect } from 'react';
import { OnboardingData, QuotaUsage } from '../../types';
import OpenAIDebug from '../../components/OpenAIDebug';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showDebug, setShowDebug] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData, quotaData] = await Promise.all([
        storage.getOnboardingData(),
        storage.getQuotaUsage(),
      ]);
      
      setProfile(profileData);
      setQuota(quotaData || { text: 0, image: 0 });
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding');
  };

  const handleExportData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Export Data',
      'Export all your saved content and settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: exportData },
      ]
    );
  };

  const exportData = async () => {
    try {
      const [profileData, savedItems, quotaData] = await Promise.all([
        storage.getOnboardingData(),
        storage.getSavedItems(),
        storage.getQuotaUsage(),
      ]);

      const exportData = {
        profile: profileData,
        savedItems,
        quota: quotaData,
        exportedAt: new Date().toISOString(),
      };

      // In a real app, you'd implement file sharing here
      console.log('Export data:', JSON.stringify(exportData, null, 2));
      Alert.alert('Success', 'Data exported to console (check developer tools)');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear All Data',
      'This will delete all your saved content, settings, and reset your quota. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllData },
      ]
    );
  };

  const clearAllData = async () => {
    try {
      await storage.clearAll();
      setProfile(null);
      setQuota({ text: 0, image: 0 });
      Alert.alert('Success', 'All data cleared');
    } catch (error) {
      console.error('Clear data error:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user) {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]
      );
    } else {
      Alert.alert('Info', 'You are currently using the app as a guest.');
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={{ marginBottom: 32 }}>
      <Text style={[commonStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 16 }]}>
        {title}
      </Text>
      <View style={[commonStyles.card, { padding: 0 }]}>
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
    isLast = false
  ) => (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={24} color={colors.accent} style={{ marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={[commonStyles.text, { fontSize: 16 }]}>{title}</Text>
        {subtitle && (
          <Text style={[commonStyles.textSecondary, { fontSize: 14, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        {renderSection('Profile', (
          <>
            {renderSettingItem(
              'person-outline',
              'Edit Profile',
              profile ? `${profile.platforms?.join(', ')} • ${profile.niche}` : 'Complete your profile',
              handleEditProfile
            )}
            {renderSettingItem(
              'stats-chart-outline',
              'Usage Stats',
              `${quota.text} text requests • ${quota.image} images generated`,
              undefined,
              undefined,
              true
            )}
          </>
        ))}

        {/* Subscription Section */}
        {renderSection('Subscription', (
          <>
            {renderSettingItem(
              'diamond-outline',
              'Upgrade to Pro',
              'Unlimited requests and premium features',
              () => Alert.alert('Coming Soon', 'Pro subscription will be available soon!')
            )}
            {renderSettingItem(
              'card-outline',
              'Billing',
              'Manage your subscription',
              () => Alert.alert('Coming Soon', 'Billing management coming soon!'),
              undefined,
              true
            )}
          </>
        ))}

        {/* Data Section */}
        {renderSection('Data', (
          <>
            {renderSettingItem(
              'download-outline',
              'Export Data',
              'Download all your content and settings',
              handleExportData
            )}
            {renderSettingItem(
              'trash-outline',
              'Clear All Data',
              'Reset app to initial state',
              handleClearData,
              undefined,
              true
            )}
          </>
        ))}

        {/* Debug Section */}
        {renderSection('Debug', (
          <>
            {renderSettingItem(
              'bug-outline',
              'OpenAI Debug',
              'Test OpenAI connection and configuration',
              () => setShowDebug(true),
              undefined,
              true
            )}
          </>
        ))}

        {/* Account Section */}
        {renderSection('Account', (
          <>
            {renderSettingItem(
              'log-out-outline',
              user ? 'Sign Out' : 'Account Status',
              user ? user.email : 'Using as guest',
              user ? handleSignOut : undefined,
              undefined,
              true
            )}
          </>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <OpenAIDebug
        visible={showDebug}
        onClose={() => setShowDebug(false)}
      />
    </SafeAreaView>
  );
}
