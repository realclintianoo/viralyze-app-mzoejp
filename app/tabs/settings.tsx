
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingData, QuotaUsage } from '../../types';
import { router } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface PremiumSettingCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  gradient?: string[];
  index: number;
  isPro?: boolean;
}

const PremiumSettingCard: React.FC<PremiumSettingCardProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  gradient,
  index,
  isPro = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(index * 100, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (onPress) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={!onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradient || [colors.glassBackground, colors.glassBackgroundStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 1,
            shadowColor: isPro ? colors.glowPrimary : colors.neuDark,
            shadowOffset: { width: 0, height: isPro ? 0 : 12 },
            shadowOpacity: isPro ? 0.8 : 0.3,
            shadowRadius: isPro ? 20 : 16,
            elevation: isPro ? 20 : 12,
          }}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                backgroundColor: colors.glassBackgroundStrong,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isPro ? colors.borderGlow : colors.glassBorderStrong,
                borderRadius: 20,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: isPro ? colors.primary : colors.backgroundTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  shadowColor: isPro ? colors.glowPrimary : colors.neuDark,
                  shadowOffset: { width: 0, height: isPro ? 0 : 6 },
                  shadowOpacity: isPro ? 0.6 : 0.2,
                  shadowRadius: isPro ? 12 : 8,
                  elevation: isPro ? 12 : 6,
                }}
              >
                <Ionicons
                  name={icon}
                  size={24}
                  color={isPro ? colors.white : colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.textBold, { fontSize: 17, marginBottom: 2 }]}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                    {subtitle}
                  </Text>
                )}
              </View>

              {rightElement || (onPress && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                  style={{ opacity: 0.6 }}
                />
              ))}

              {isPro && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    shadowColor: colors.glowPrimary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 10, fontWeight: '800' }}>
                    PRO
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, signOut } = useAuth();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    loadData();
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

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
    router.push('/onboarding');
  };

  const handleUpgradeToPro = () => {
    router.push('/paywall');
  };

  const handleExportData = () => {
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

      console.log('Export data:', JSON.stringify(exportData, null, 2));
      Alert.alert('Success', 'Data exported to console (check developer tools)');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
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
    if (user) {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Info', 'You are currently using the app as a guest.');
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutModal(false);
      console.log('User confirmed logout, starting logout process...');
      
      // Sign out and clear all data
      await signOut();
      
      // Clear local state
      setProfile(null);
      setQuota({ text: 0, image: 0 });
      
      console.log('Logout completed, navigating to root...');
      
      // Navigate back to the root to trigger the index screen check
      router.replace('/');
    } catch (error) {
      console.error('Error during sign out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <Animated.View style={[commonStyles.header, headerAnimatedStyle]}>
          <Text style={commonStyles.headerTitle}>Settings</Text>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16, opacity: 0.8 }]}>
              Profile
            </Text>
            <PremiumSettingCard
              icon="person-outline"
              title="Edit Profile"
              subtitle={profile ? `${profile.platforms?.join(', ')} • ${profile.niche}` : 'Complete your profile'}
              onPress={handleEditProfile}
              index={0}
            />
            <PremiumSettingCard
              icon="stats-chart-outline"
              title="Usage Stats"
              subtitle={`${quota.text} text requests • ${quota.image} images generated`}
              index={1}
            />
          </View>

          {/* Subscription Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16, opacity: 0.8 }]}>
              Subscription
            </Text>
            <PremiumSettingCard
              icon="diamond-outline"
              title="Upgrade to Pro"
              subtitle="Unlimited requests and premium features"
              onPress={handleUpgradeToPro}
              gradient={[colors.primary, colors.gradientEnd]}
              index={2}
              isPro
            />
            <PremiumSettingCard
              icon="card-outline"
              title="Billing"
              subtitle="Manage your subscription"
              onPress={() => Alert.alert('Coming Soon', 'Billing management coming soon!')}
              index={3}
            />
          </View>

          {/* Data Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16, opacity: 0.8 }]}>
              Data
            </Text>
            <PremiumSettingCard
              icon="download-outline"
              title="Export Data"
              subtitle="Download all your content and settings"
              onPress={handleExportData}
              index={4}
            />
            <PremiumSettingCard
              icon="trash-outline"
              title="Clear All Data"
              subtitle="Reset app to initial state"
              onPress={handleClearData}
              index={5}
            />
          </View>

          {/* Account Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16, opacity: 0.8 }]}>
              Account
            </Text>
            <PremiumSettingCard
              icon="log-out-outline"
              title={user ? 'Sign Out' : 'Account Status'}
              subtitle={user ? user.email : 'Using as guest'}
              onPress={user ? handleSignOut : undefined}
              index={6}
            />
          </View>
        </ScrollView>

        {/* Logout Modal */}
        <LogoutModal
          visible={showLogoutModal}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
