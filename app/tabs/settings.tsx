
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { OnboardingData, QuotaUsage } from '../../types';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage | null>(null);
  const [notifications, setNotifications] = useState(true);

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
      setQuota(quotaData);
    } catch (error) {
      console.log('Error loading settings data:', error);
    }
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding');
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: exportData },
      ]
    );
  };

  const exportData = async () => {
    try {
      const savedItems = await storage.getSavedItems();
      const data = {
        profile,
        savedItems,
        quota,
        exportDate: new Date().toISOString(),
      };
      
      // In a real app, you'd use a file system API to save the JSON
      console.log('Export data:', JSON.stringify(data, null, 2));
      Alert.alert('Success', 'Data exported successfully');
    } catch (error) {
      console.log('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your saved content and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllData },
      ]
    );
  };

  const clearAllData = async () => {
    try {
      await storage.clearAll();
      Alert.alert('Success', 'All data cleared successfully');
      router.replace('/onboarding');
    } catch (error) {
      console.log('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const signOut = async () => {
    // In a real app with Supabase, you'd call supabase.auth.signOut()
    router.replace('/onboarding');
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={[commonStyles.subtitle, { marginBottom: 12, paddingHorizontal: 16 }]}>
        {title}
      </Text>
      {children}
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
      style={[commonStyles.card, { marginHorizontal: 16 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[commonStyles.row, { alignItems: 'center', gap: 16 }]}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: destructive ? colors.error : colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={20} color={colors.white} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={[
            commonStyles.text,
            { fontWeight: '500', color: destructive ? colors.error : colors.text }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={commonStyles.smallText}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightElement || (onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.grey} />
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={commonStyles.title}>Settings</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          {renderSection('Profile', (
            <>
              {renderSettingItem(
                'person-outline',
                'Edit Profile',
                profile ? `${profile.niche} • ${profile.platforms.join(', ')}` : 'Update your information',
                handleEditProfile
              )}
            </>
          ))}

          {/* Subscription Section */}
          {renderSection('Subscription', (
            <>
              {renderSettingItem(
                'star-outline',
                'Upgrade to Pro',
                'Unlimited AI requests and exclusive features',
                () => console.log('Upgrade pressed')
              )}
            </>
          ))}

          {/* Usage Section */}
          {renderSection('Usage', (
            <>
              {renderSettingItem(
                'analytics-outline',
                'AI Requests',
                quota ? `${quota.textRequests}/${quota.maxTextRequests} text • ${quota.imageRequests}/${quota.maxImageRequests} image` : 'Loading...'
              )}
              {renderSettingItem(
                'people-outline',
                'Followers',
                profile ? `${profile.followers.toLocaleString()} followers` : 'Not set'
              )}
            </>
          ))}

          {/* Preferences Section */}
          {renderSection('Preferences', (
            <>
              {renderSettingItem(
                'notifications-outline',
                'Notifications',
                'Get notified about new features and tips',
                undefined,
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.white}
                />
              )}
            </>
          ))}

          {/* Data Section */}
          {renderSection('Data', (
            <>
              {renderSettingItem(
                'download-outline',
                'Export Data',
                'Download your data as JSON',
                handleExportData
              )}
              {renderSettingItem(
                'trash-outline',
                'Clear Local Data',
                'Remove all saved content and settings',
                handleClearData,
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
                'Sign Out',
                'You can always sign back in',
                handleSignOut,
                undefined,
                true
              )}
            </>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
