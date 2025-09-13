
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { commonStyles, colors } from '../../styles/commonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { supabase } from '../../lib/supabase';
import { storage } from '../../utils/storage';
import { OnboardingData } from '../../types';
import AnimatedButton from '../../components/AnimatedButton';
import SetupGuide from '../../components/SetupGuide';

export default function SettingsScreen() {
  const { user, isGuest, signOut } = useAuth();
  const { showToast } = useToast();
  const { quota, usage } = useQuota();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [profileData, setProfileData] = useState<OnboardingData>({
    platforms: [],
    niche: '',
    followers: 0,
    goal: '',
  });

  const loadData = useCallback(async () => {
    try {
      if (isGuest) {
        const localProfile = await storage.getOnboardingData();
        if (localProfile) {
          setProfileData(localProfile);
        }
      } else if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfileData({
            platforms: data.platforms || [],
            niche: data.niche || '',
            followers: data.followers || 0,
            goal: data.goal || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [isGuest, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAuth = () => {
    if (isGuest) {
      router.push('/auth');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out', 'error');
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleExportData = async () => {
    try {
      const savedItems = await storage.getSavedItems();
      const exportData = {
        profile: profileData,
        savedItems,
        usage,
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `viralyze-export-${new Date().toISOString().split('T')[0]}.json`;
      
      if (documentDirectory) {
        const fileUri = documentDirectory + fileName;
        await writeAsStringAsync(fileUri, jsonString);
        await Sharing.shareAsync(fileUri);
        showToast('Data exported successfully!', 'success');
      } else {
        throw new Error('Document directory not available');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data', 'error');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your saved content and reset your usage statistics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              showToast('All data cleared successfully', 'success');
            } catch (error) {
              console.error('Error clearing data:', error);
              showToast('Failed to clear data', 'error');
            }
          },
        },
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={colors.accent} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.grey} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {renderSection('Account', (
          <>
            {isGuest ? (
              renderSettingItem(
                'person-add',
                'Sign In / Sign Up',
                'Create an account to sync your data',
                handleAuth
              )
            ) : (
              <>
                <View style={styles.userInfo}>
                  <Ionicons name="person-circle" size={48} color={colors.accent} />
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user?.email}</Text>
                    <Text style={styles.userStatus}>
                      {quota.isPro ? 'Pro Member' : 'Free Member'}
                    </Text>
                  </View>
                </View>
                {renderSettingItem('create', 'Edit Profile', undefined, handleEditProfile)}
                {renderSettingItem('log-out', 'Sign Out', undefined, handleSignOut)}
              </>
            )}
          </>
        ))}

        {renderSection('Setup', (
          <>
            {renderSettingItem(
              'settings',
              'API Configuration',
              'Setup your OpenAI API key',
              () => setShowSetupGuide(true)
            )}
          </>
        ))}

        {renderSection('Subscription', (
          <>
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitle}>
                  {quota.isPro ? 'Pro Plan' : 'Free Plan'}
                </Text>
                {!quota.isPro && (
                  <TouchableOpacity style={styles.upgradeButton}>
                    <Text style={styles.upgradeButtonText}>Upgrade</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageLabel}>AI Requests</Text>
                  <Text style={styles.usageValue}>
                    {usage.textRequests} / {quota.maxTextRequests === -1 ? '∞' : quota.maxTextRequests}
                  </Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={styles.usageLabel}>Images</Text>
                  <Text style={styles.usageValue}>
                    {usage.imageRequests} / {quota.maxImageRequests === -1 ? '∞' : quota.maxImageRequests}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ))}

        {renderSection('Data', (
          <>
            {renderSettingItem('download', 'Export Data', 'Download your data as JSON', handleExportData)}
            {renderSettingItem('trash', 'Clear All Data', 'Delete all saved content', handleClearData)}
          </>
        ))}

        {renderSection('About', (
          <>
            {renderSettingItem('information-circle', 'Version', '1.0.0')}
            {renderSettingItem('help-circle', 'Help & Support')}
            {renderSettingItem('document-text', 'Privacy Policy')}
            {renderSettingItem('shield-checkmark', 'Terms of Service')}
          </>
        ))}
      </ScrollView>

      <SetupGuide
        visible={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />

      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEditProfile(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Niche</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.niche}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, niche: text }))}
              placeholder="Your content niche"
              placeholderTextColor={colors.grey}
            />

            <Text style={styles.fieldLabel}>Goal</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.goal}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, goal: text }))}
              placeholder="Your main goal"
              placeholderTextColor={colors.grey}
              multiline
            />

            <AnimatedButton
              title="Save Changes"
              onPress={async () => {
                try {
                  if (isGuest) {
                    await storage.setOnboardingData(profileData);
                  } else if (user) {
                    await supabase
                      .from('profiles')
                      .upsert({
                        id: user.id,
                        ...profileData,
                        updated_at: new Date().toISOString(),
                      });
                  }
                  setShowEditProfile(false);
                  showToast('Profile updated successfully!', 'success');
                } catch (error) {
                  console.error('Error updating profile:', error);
                  showToast('Failed to update profile', 'error');
                }
              }}
              style={styles.saveButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 2,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  userStatus: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 2,
  },
  subscriptionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  usageStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  usageStat: {
    alignItems: 'center' as const,
  },
  usageLabel: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 50,
  },
  saveButton: {
    marginTop: 32,
  },
};
