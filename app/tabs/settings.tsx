
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
  Modal,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
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

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
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

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ visible, onClose }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Subscription',
      `You selected the ${plan} plan. This would redirect to payment processing.`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[colors.glassBackground, colors.glassBackgroundStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 1,
              shadowColor: colors.glowPrimary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 32,
              elevation: 24,
            }}
          >
            <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
              <View
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  padding: 32,
                  width: width - 40,
                  maxWidth: 400,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    padding: 8,
                    borderRadius: 12,
                    backgroundColor: colors.backgroundTertiary,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                  <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      shadowColor: colors.glowPrimary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 20,
                      elevation: 16,
                    }}
                  >
                    <Ionicons name="diamond" size={40} color={colors.white} />
                  </LinearGradient>

                  <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
                    Upgrade to Pro
                  </Text>
                  <Text style={[commonStyles.textSmall, { textAlign: 'center', opacity: 0.8 }]}>
                    Unlock unlimited AI generation and premium features
                  </Text>
                </View>

                {/* Features */}
                <View style={{ marginBottom: 32 }}>
                  {[
                    'Unlimited AI text generation',
                    'Unlimited AI image creation',
                    'Guideline Guardian tool',
                    'Priority support',
                    'Advanced analytics',
                    'Custom templates',
                  ].map((feature, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[commonStyles.text, { fontSize: 15 }]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Pricing Plans */}
                <View style={{ gap: 16 }}>
                  {/* Monthly Plan */}
                  <TouchableOpacity
                    onPress={() => handleSubscribe('monthly')}
                    style={{
                      backgroundColor: colors.glassBackground,
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={[commonStyles.textBold, { fontSize: 18 }]}>Monthly</Text>
                        <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                          Cancel anytime
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[commonStyles.title, { fontSize: 24, color: colors.primary }]}>
                          $9.99
                        </Text>
                        <Text style={[commonStyles.textSmall, { opacity: 0.6 }]}>
                          per month
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Yearly Plan */}
                  <TouchableOpacity
                    onPress={() => handleSubscribe('yearly')}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.gradientEnd]}
                      style={{
                        borderRadius: 16,
                        padding: 1,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.glassBackgroundStrong,
                          borderRadius: 16,
                          padding: 20,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={[commonStyles.textBold, { fontSize: 18, color: colors.primary }]}>
                              Yearly
                            </Text>
                            <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                              Save 40% • Best value
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[commonStyles.title, { fontSize: 24, color: colors.primary }]}>
                              $59.99
                            </Text>
                            <Text style={[commonStyles.textSmall, { opacity: 0.6 }]}>
                              per year
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>

                    <View
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: 16,
                        backgroundColor: colors.warning,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        shadowColor: colors.warning,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <Text style={{ color: colors.white, fontSize: 12, fontWeight: '800' }}>
                        POPULAR
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={[commonStyles.textSmall, { textAlign: 'center', marginTop: 20, opacity: 0.6 }]}>
                  Secure payment • Cancel anytime • 7-day free trial
                </Text>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function SettingsScreen() {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
    setShowSubscriptionModal(true);
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

        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}
