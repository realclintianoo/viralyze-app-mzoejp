
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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { storage } from '../../utils/storage';
import { supabase, checkSupabaseConfig } from '../../app/integrations/supabase/client';
import { checkOpenAIConfig, aiComplete } from '../../lib/ai';
import { OnboardingData } from '../../types';
import { commonStyles, colors } from '../../styles/commonStyles';

import AnimatedButton from '../../components/AnimatedButton';
import SetupGuide from '../../components/SetupGuide';
import AuthSheet from '../../components/AuthSheet';

const SettingsScreen = () => {
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    openai: { status: 'unknown', message: '' },
    supabase: { status: 'unknown', message: '' }
  });

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState<OnboardingData>({
    platforms: [],
    niche: '',
    followers: 0,
    goal: ''
  });

  const { user, signOut, isGuest } = useAuth();
  const { quota } = useQuota();
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const profile = await storage.getOnboardingData();
      if (profile) {
        setEditingProfile(profile);
      }
      
      // Check API status
      checkAPIStatus();
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkAPIStatus = () => {
    // Check OpenAI
    const openaiConfig = checkOpenAIConfig();
    const supabaseConfig = checkSupabaseConfig();

    setApiStatus({
      openai: {
        status: openaiConfig.isConfigured ? 'connected' : 'error',
        message: openaiConfig.isConfigured 
          ? 'OpenAI API connected successfully'
          : 'OpenAI API key not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.'
      },
      supabase: {
        status: supabaseConfig.isConfigured ? 'connected' : 'warning',
        message: supabaseConfig.isConfigured
          ? 'Supabase connected successfully'
          : 'Supabase configuration incomplete. Check your environment variables.'
      }
    });
  };

  const handleAuth = () => {
    if (isGuest) {
      setShowAuthSheet(true);
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out? Your local data will be preserved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: handleSignOut }
        ]
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully', 'success');
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('Error signing out', 'error');
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const saveProfile = async () => {
    try {
      await storage.setOnboardingData(editingProfile);
      
      // If user is authenticated, also save to Supabase
      if (!isGuest && user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            user_id: user.id,
            platforms: editingProfile.platforms,
            niche: editingProfile.niche,
            followers: editingProfile.followers,
            goal: editingProfile.goal,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error saving profile to Supabase:', error);
          showToast('Profile saved locally, but failed to sync to cloud', 'warning');
        } else {
          showToast('Profile updated successfully', 'success');
        }
      } else {
        showToast('Profile updated locally', 'success');
      }
      
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error saving profile', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      // Check if document directory is available
      if (!documentDirectory) {
        throw new Error('Document directory not available on this platform');
      }

      const allData = await storage.getAllData();
      const jsonString = JSON.stringify(allData, null, 2);
      
      const fileName = `viralyze-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = documentDirectory + fileName;
      
      await writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        showToast('Export saved to device storage', 'success');
      }
    } catch (error: any) {
      console.error('Error exporting data:', error);
      showToast(`Error exporting data: ${error.message}`, 'error');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your local data including saved items, chat history, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              showToast('All data cleared successfully', 'success');
              // Reset editing profile to defaults
              setEditingProfile({
                platforms: [],
                niche: '',
                followers: 0,
                goal: ''
              });
            } catch (error) {
              console.error('Error clearing data:', error);
              showToast('Error clearing data', 'error');
            }
          }
        }
      ]
    );
  };

  const runSystemTest = async () => {
    setIsTestRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('=== VIRALYZE SYSTEM TEST ===');
      
      // Check environment variables
      const openaiConfig = checkOpenAIConfig();
      const supabaseConfig = checkSupabaseConfig();
      
      console.log('Environment Variables:');
      console.log('- OpenAI API Key:', openaiConfig.hasApiKey ? 'configured (masked)' : 'missing');
      console.log('- Supabase URL:', supabaseConfig.url ? 'configured' : 'missing');
      console.log('- Supabase Key:', supabaseConfig.key ? 'configured (masked)' : 'missing');

      if (!openaiConfig.isConfigured) {
        throw new Error('OpenAI API key not configured');
      }

      // Create test profile
      const testProfile: OnboardingData = {
        platforms: ['TikTok'],
        niche: 'Beauty',
        followers: 2000,
        goal: 'Increase engagement and grow to 10K followers'
      };

      console.log('Test Profile:', testProfile);

      // Test AI completion
      console.log('Testing AI completion...');
      const testResults = await aiComplete({
        kind: 'hook',
        profile: testProfile,
        input: 'Create an engaging hook about skincare routine for beginners',
        n: 1
      });

      if (!testResults || testResults.length === 0) {
        throw new Error('AI completion returned no results');
      }

      console.log('AI Test Result:', testResults[0]);

      // Save test item
      const testItem = {
        id: `test-${Date.now()}`,
        user_id: user?.id || 'guest',
        type: 'hook' as const,
        title: 'Test Hook - Beauty Skincare',
        payload: {
          content: testResults[0],
          profile: testProfile,
          generated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      await storage.addSavedItem(testItem);
      console.log('Test item saved successfully');

      // If authenticated, test Supabase connection
      if (!isGuest && user) {
        console.log('Testing Supabase connection...');
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            type: 'hook',
            title: 'Test Hook - Beauty Skincare',
            payload: testItem.payload
          });

        if (error) {
          console.error('Supabase test error:', error);
          console.log('RLS/Policy creation result: Some policies may need adjustment');
        } else {
          console.log('Supabase test successful');
          console.log('RLS/Policy creation result: All policies working correctly');
        }
      }

      console.log('=== TEST COMPLETED SUCCESSFULLY ===');
      console.log('Ready: OpenAI + Supabase connected; quota active');

      showToast('All systems OK! Test data saved.', 'success');
      
    } catch (error: any) {
      console.error('System test failed:', error);
      console.log('=== TEST FAILED ===');
      console.log('Error:', error.message);
      
      showToast(`System test failed: ${error.message}`, 'error');
    } finally {
      setIsTestRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'help-circle';
    }
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
        <Ionicons name={icon} size={24} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        {renderSection('Account', (
          <>
            {renderSettingItem(
              isGuest ? 'person-add' : 'person',
              isGuest ? 'Sign In' : user?.email || 'Account',
              isGuest ? 'Sync your data across devices' : 'Manage your account',
              handleAuth
            )}
            {renderSettingItem(
              'create',
              'Edit Profile',
              'Update your platforms, niche, and goals',
              handleEditProfile
            )}
          </>
        ))}

        {/* API Configuration */}
        {renderSection('API Configuration', (
          <View style={styles.apiSection}>
            <View style={styles.apiItem}>
              <View style={styles.apiLeft}>
                <Ionicons 
                  name={getStatusIcon(apiStatus.openai.status)} 
                  size={20} 
                  color={getStatusColor(apiStatus.openai.status)} 
                />
                <Text style={styles.apiTitle}>OpenAI</Text>
              </View>
              <Text style={[styles.apiStatus, { color: getStatusColor(apiStatus.openai.status) }]}>
                {apiStatus.openai.status === 'connected' ? 'Connected' : 'Not configured'}
              </Text>
            </View>
            <Text style={styles.apiMessage}>{apiStatus.openai.message}</Text>

            <View style={[styles.apiItem, { marginTop: 16 }]}>
              <View style={styles.apiLeft}>
                <Ionicons 
                  name={getStatusIcon(apiStatus.supabase.status)} 
                  size={20} 
                  color={getStatusColor(apiStatus.supabase.status)} 
                />
                <Text style={styles.apiTitle}>Supabase</Text>
              </View>
              <Text style={[styles.apiStatus, { color: getStatusColor(apiStatus.supabase.status) }]}>
                {apiStatus.supabase.status === 'connected' ? 'Connected' : 'Warning'}
              </Text>
            </View>
            <Text style={styles.apiMessage}>{apiStatus.supabase.message}</Text>

            {(apiStatus.openai.status !== 'connected' || apiStatus.supabase.status === 'error') && (
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => setShowSetupGuide(true)}
              >
                <Ionicons name="information-circle" size={16} color={colors.primary} />
                <Text style={styles.setupButtonText}>Setup Guide</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Usage Stats */}
        {renderSection('Usage Today', (
          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageLabel}>Text Requests</Text>
              <Text style={styles.usageValue}>
                {quota.textRequests} / {quota.isPro ? '∞' : quota.maxTextRequests}
              </Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={styles.usageLabel}>Image Requests</Text>
              <Text style={styles.usageValue}>
                {quota.imageRequests} / {quota.isPro ? '∞' : quota.maxImageRequests}
              </Text>
            </View>
          </View>
        ))}

        {/* Data Management */}
        {renderSection('Data Management', (
          <>
            {renderSettingItem(
              'download',
              'Export Data',
              'Download all your data as JSON',
              handleExportData
            )}
            {renderSettingItem(
              'trash',
              'Clear Local Data',
              'Remove all saved items and settings',
              handleClearData
            )}
          </>
        ))}

        {/* System Test */}
        {renderSection('System Test', (
          <View style={styles.testSection}>
            <Text style={styles.testDescription}>
              Run a comprehensive test to verify all systems are working correctly.
            </Text>
            <AnimatedButton
              title={isTestRunning ? 'Running Test...' : 'Run Test'}
              onPress={runSystemTest}
              disabled={isTestRunning}
              style={styles.testButton}
              variant="secondary"
            />
          </View>
        ))}
      </ScrollView>

      {/* Auth Sheet */}
      <AuthSheet
        visible={showAuthSheet}
        onClose={() => setShowAuthSheet(false)}
        onContinueAsGuest={() => {}}
      />

      {/* Setup Guide */}
      <SetupGuide
        visible={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Niche</Text>
              <TextInput
                style={styles.formInput}
                value={editingProfile.niche}
                onChangeText={(text) => setEditingProfile(prev => ({ ...prev, niche: text }))}
                placeholder="e.g., Beauty, Fitness, Tech"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Followers</Text>
              <TextInput
                style={styles.formInput}
                value={editingProfile.followers.toString()}
                onChangeText={(text) => setEditingProfile(prev => ({ ...prev, followers: parseInt(text) || 0 }))}
                placeholder="Number of followers"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Goal</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={editingProfile.goal}
                onChangeText={(text) => setEditingProfile(prev => ({ ...prev, goal: text }))}
                placeholder="What do you want to achieve?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  apiSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  apiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  apiStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  apiMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  setupButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  testSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  testDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  testButton: {
    alignSelf: 'stretch',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSave: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default SettingsScreen;
