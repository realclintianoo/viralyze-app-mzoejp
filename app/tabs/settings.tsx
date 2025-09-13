
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { commonStyles, colors } from '../../styles/commonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useQuota } from '../../hooks/useQuota';
import { supabase } from '../../lib/supabase';
import { storage } from '../../utils/storage';
import { OnboardingData } from '../../types';
import AnimatedButton from '../../components/AnimatedButton';

export default function SettingsScreen() {
  const { user, isGuest, signOut } = useAuth();
  const { showToast } = useToast();
  const { quota } = useQuota();
  
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (isGuest) {
        const localProfile = await storage.getOnboardingData();
        setProfile(localProfile);
      } else if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile({
            platforms: profileData.platforms,
            niche: profileData.niche,
            followers: profileData.followers,
            goal: profileData.goal,
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

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { signIn, signUp } = await import('../../lib/supabase');
      
      if (authMode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          showToast(error.message, 'error');
        } else {
          showToast('Signed in successfully!', 'success');
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          showToast(error.message, 'error');
        } else {
          showToast('Please check your email to verify your account', 'success');
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              showToast('Signed out successfully', 'success');
            } catch (error) {
              showToast('Failed to sign out', 'error');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setShowProfileModal(true);
  };

  const handleExportData = async () => {
    try {
      const savedItems = isGuest 
        ? await storage.getSavedItems()
        : await supabase.from('saved_items').select('*').eq('user_id', user?.id);

      const quotaData = isGuest 
        ? await storage.getQuotaUsage()
        : quota;

      const exportData = {
        profile,
        savedItems: isGuest ? savedItems : savedItems.data,
        quota: quotaData,
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `viralyze-export-${new Date().toISOString().split('T')[0]}.json`;
      
      // Use the correct way to access document directory
      if (!documentDirectory) {
        throw new Error('Document directory not available on this platform');
      }
      
      const fileUri = documentDirectory + fileName;

      await writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        showToast('Export saved to documents', 'success');
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data', 'error');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your saved items and reset your profile. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isGuest) {
                await storage.clearAll();
              } else if (user) {
                await supabase.from('saved_items').delete().eq('user_id', user.id);
                await supabase.from('usage_log').delete().eq('user_id', user.id);
                await supabase.from('profiles').delete().eq('id', user.id);
              }
              
              setProfile(null);
              showToast('All data cleared', 'success');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Ionicons name={icon} size={20} color={colors.accent} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.grey} />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        {renderSection('Profile', (
          <>
            {profile ? (
              <>
                {renderSettingItem(
                  'person',
                  'Edit Profile',
                  `${profile.niche} • ${profile.followers.toLocaleString()} followers`,
                  handleEditProfile
                )}
                {renderSettingItem(
                  'apps',
                  'Platforms',
                  profile.platforms.join(', ')
                )}
                {renderSettingItem(
                  'target',
                  'Goal',
                  profile.goal
                )}
              </>
            ) : (
              renderSettingItem(
                'person-add',
                'Complete Profile',
                'Set up your creator profile',
                () => router.push('/onboarding')
              )
            )}
          </>
        ))}

        {/* Account Section */}
        {renderSection('Account', (
          <>
            {isGuest ? (
              renderSettingItem(
                'log-in',
                'Sign In',
                'Sync your data across devices',
                () => setShowAuthModal(true)
              )
            ) : (
              <>
                {renderSettingItem(
                  'mail',
                  'Email',
                  user?.email || 'Not available'
                )}
                {renderSettingItem(
                  'log-out',
                  'Sign Out',
                  undefined,
                  handleSignOut
                )}
              </>
            )}
          </>
        ))}

        {/* Subscription Section */}
        {renderSection('Subscription', (
          <>
            {renderSettingItem(
              'star',
              quota.isPro ? 'Pro Plan' : 'Free Plan',
              quota.isPro ? 'Unlimited access to all features' : 'Limited daily usage'
            )}
            {renderSettingItem(
              'stats-chart',
              'Usage Stats',
              `${quota.textRequests}/${quota.maxTextRequests} text • ${quota.imageRequests}/${quota.maxImageRequests} images`
            )}
            {!quota.isPro && renderSettingItem(
              'arrow-up-circle',
              'Upgrade to Pro',
              'Unlock unlimited access',
              () => showToast('Upgrade feature coming soon!', 'info')
            )}
          </>
        ))}

        {/* Data Section */}
        {renderSection('Data', (
          <>
            {renderSettingItem(
              'download',
              'Export Data',
              'Download your content as JSON',
              handleExportData
            )}
            {renderSettingItem(
              'trash',
              'Clear All Data',
              'Delete all saved items and profile',
              handleClearData
            )}
          </>
        ))}

        {/* App Section */}
        {renderSection('App', (
          <>
            {renderSettingItem(
              'information-circle',
              'Version',
              '1.0.0'
            )}
            {renderSettingItem(
              'help-circle',
              'Help & Support',
              'Get help with using VIRALYZE',
              () => showToast('Support coming soon!', 'info')
            )}
          </>
        ))}
      </ScrollView>

      {/* Auth Modal */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowAuthModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.grey} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.grey}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.grey}
              secureTextEntry
            />

            <AnimatedButton
              title={loading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
              onPress={handleAuth}
              disabled={loading}
              style={styles.authButton}
            />

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={styles.switchModeText}>
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 20,
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
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.grey,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalClose: {
    padding: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  authButton: {
    width: '100%',
    marginBottom: 16,
  },
  switchModeButton: {
    alignItems: 'center' as const,
    padding: 8,
  },
  switchModeText: {
    fontSize: 14,
    color: colors.accent,
  },
};
