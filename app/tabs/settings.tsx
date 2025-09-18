
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../utils/storage';
import { OnboardingData, QuotaUsage } from '../../types';
import { commonStyles, colors } from '../../styles/commonStyles';
import PremiumConfirmModal from '../../components/PremiumConfirmModal';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import SparklineChart from '../../components/SparklineChart';

const { width, height } = Dimensions.get('window');

interface PremiumProfileHeaderProps {
  profile: OnboardingData | null;
  onEditPress: () => void;
}

interface PremiumProfileCardProps {
  profile: OnboardingData | null;
  user: any;
}

interface PremiumStatsRowProps {
  profile: OnboardingData | null;
  quota: QuotaUsage;
}

interface PremiumSectionCardProps {
  title: string;
  children: React.ReactNode;
  index: number;
  gradient?: string[];
}

interface PremiumActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  gradient?: string[];
  index: number;
  glowColor?: string;
  isDestructive?: boolean;
}

// Premium Profile Header Component
const PremiumProfileHeader: React.FC<PremiumProfileHeaderProps> = ({ profile, onEditPress }) => {
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const editButtonScale = useSharedValue(1);
  const editButtonRotate = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    headerTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    
    // Subtle rotation animation for edit button
    editButtonRotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000 }),
        withTiming(-5, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const editButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: editButtonScale.value },
      { rotate: `${editButtonRotate.value}deg` }
    ],
  }));

  const handleEditPress = () => {
    editButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    runOnJS(onEditPress)();
  };

  return (
    <Animated.View style={[headerAnimatedStyle, { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.headerTitle, { marginBottom: 8 }]}>
            My Profile
          </Text>
          <Text style={[commonStyles.textSmall, { opacity: 0.7, fontSize: 16 }]}>
            @{profile?.niche?.toLowerCase().replace(/\s+/g, '') || 'creator'}
          </Text>
        </View>
        
        <Animated.View style={editButtonAnimatedStyle}>
          <TouchableOpacity
            onPress={handleEditPress}
            activeOpacity={0.8}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.glowTeal,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            <LinearGradient
              colors={[colors.tealPrimary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.glassBorderUltra,
              }}
            >
              <Ionicons name="pencil" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// Premium Profile Card Component
const PremiumProfileCard: React.FC<PremiumProfileCardProps> = ({ profile, user }) => {
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const profileImageScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 1000 }));
    cardScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 100 }));
    
    // Pulsing glow effect
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const profileImageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileImageScale.value }],
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.3, 0.8]),
  }));

  const handleCardPress = () => {
    profileImageScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 100 })
    );
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
  };

  const getNicheEmoji = (niche: string) => {
    const nicheMap: { [key: string]: string } = {
      'fitness': '💪',
      'fashion': '👗',
      'food': '🍳',
      'travel': '✈️',
      'tech': '💻',
      'lifestyle': '✨',
      'business': '💼',
      'education': '📚',
      'entertainment': '🎭',
      'health': '🏥',
      'beauty': '💄',
      'gaming': '🎮',
      'music': '🎵',
      'art': '🎨',
      'photography': '📸',
    };
    return nicheMap[niche?.toLowerCase()] || '🌟';
  };

  return (
    <Animated.View style={[cardAnimatedStyle, { paddingHorizontal: 24, marginBottom: 32 }]}>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.95}>
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.1)', 'rgba(34, 197, 94, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 32,
            padding: 2,
            shadowColor: colors.glowTeal,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
            elevation: 30,
          }}
        >
          <BlurView
            intensity={30}
            tint="dark"
            style={{
              borderRadius: 30,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                backgroundColor: colors.glassBackgroundUltra,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.glassBorderUltra,
                borderRadius: 30,
              }}
            >
              {/* Profile Picture with Glow */}
              <Animated.View style={[profileImageAnimatedStyle, { marginBottom: 20 }]}>
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.glowTeal,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 25,
                    elevation: 25,
                    borderWidth: 3,
                    borderColor: colors.glassBorderUltra,
                  }}
                >
                  <Text style={{ fontSize: 48, color: colors.white }}>
                    {user?.email?.charAt(0).toUpperCase() || '👤'}
                  </Text>
                  
                  {/* Verified Badge */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 5,
                      right: 5,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 3,
                      borderColor: colors.background,
                      shadowColor: colors.glowPrimary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 12,
                      elevation: 12,
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </View>
                </View>
              </Animated.View>

              {/* Username */}
              <Text style={[commonStyles.textLarge, { marginBottom: 12, fontSize: 24, fontWeight: '800' }]}>
                {user?.email?.split('@')[0] || 'Creator'}
              </Text>

              {/* Niche Badge */}
              <View
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 25,
                  marginBottom: 16,
                  shadowColor: colors.glowTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 15,
                  elevation: 15,
                }}
              >
                <Text style={{
                  color: colors.tealPrimary,
                  fontSize: 14,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}>
                  {getNicheEmoji(profile?.niche || '')} {profile?.niche || 'Content Creator'}
                </Text>
              </View>

              {/* Bio Tagline */}
              <Text style={[commonStyles.textSmall, { 
                textAlign: 'center', 
                opacity: 0.8, 
                fontSize: 16,
                lineHeight: 22,
                maxWidth: 280,
              }]}>
                Helping creators grow online 🚀
              </Text>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Premium Stats Row Component
const PremiumStatsRow: React.FC<PremiumStatsRowProps> = ({ profile, quota }) => {
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(50);

  useEffect(() => {
    statsOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    statsTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getEngagementLevel = () => {
    const total = quota.text + quota.image;
    if (total > 50) return { level: 'High', icon: 'trending-up', color: colors.primary };
    if (total > 20) return { level: 'Medium', icon: 'trending-up', color: colors.warning };
    return { level: 'Low', icon: 'trending-down', color: colors.textSecondary };
  };

  const engagement = getEngagementLevel();

  const StatCard = ({ title, value, subtitle, icon, gradient }: any) => {
    const cardScale = useSharedValue(1);

    const handlePress = () => {
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    };

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    return (
      <Animated.View style={[cardAnimatedStyle, { flex: 1, marginHorizontal: 4 }]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 1,
              shadowColor: gradient[0],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 15,
              elevation: 15,
            }}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={{
                borderRadius: 19,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                  borderRadius: 19,
                  minHeight: 100,
                  justifyContent: 'center',
                }}
              >
                {icon && (
                  <Ionicons
                    name={icon}
                    size={24}
                    color={gradient[0]}
                    style={{ marginBottom: 8 }}
                  />
                )}
                <Text style={[commonStyles.textLarge, { 
                  fontSize: 20, 
                  fontWeight: '800', 
                  marginBottom: 4,
                  color: colors.white,
                }]}>
                  {value}
                </Text>
                <Text style={[commonStyles.textSmall, { 
                  fontSize: 12, 
                  opacity: 0.8,
                  textAlign: 'center',
                  fontWeight: '600',
                }]}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={[commonStyles.textSmall, { 
                    fontSize: 10, 
                    opacity: 0.6,
                    textAlign: 'center',
                    marginTop: 2,
                  }]}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </BlurView>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[statsAnimatedStyle, { paddingHorizontal: 24, marginBottom: 32 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <StatCard
          title="Followers"
          value={formatFollowers(profile?.followers || 0)}
          gradient={[colors.tealPrimary, colors.tealSecondary]}
          icon="people"
        />
        <StatCard
          title="Following"
          value="2.1K"
          gradient={[colors.primary, colors.gradientEnd]}
          icon="person-add"
        />
        <StatCard
          title="Engagement"
          value={engagement.level}
          subtitle={`${quota.text + quota.image} actions`}
          gradient={[engagement.color, colors.gradientEnd]}
          icon={engagement.icon}
        />
      </View>
    </Animated.View>
  );
};

// Premium Section Card Component
const PremiumSectionCard: React.FC<PremiumSectionCardProps> = ({ title, children, index, gradient }) => {
  const sectionOpacity = useSharedValue(0);
  const sectionTranslateY = useSharedValue(30);

  useEffect(() => {
    sectionOpacity.value = withDelay(800 + index * 200, withTiming(1, { duration: 600 }));
    sectionTranslateY.value = withDelay(800 + index * 200, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index]);

  const sectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    transform: [{ translateY: sectionTranslateY.value }],
  }));

  return (
    <Animated.View style={[sectionAnimatedStyle, { marginBottom: 24 }]}>
      <Text style={[commonStyles.subtitle, { 
        marginBottom: 16, 
        paddingHorizontal: 24,
        opacity: 0.9,
        fontSize: 18,
        fontWeight: '700',
      }]}>
        {title}
      </Text>
      {children}
    </Animated.View>
  );
};

// Premium Action Card Component
const PremiumActionCard: React.FC<PremiumActionCardProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  gradient, 
  index, 
  glowColor,
  isDestructive = false 
}) => {
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateX = useSharedValue(50);

  useEffect(() => {
    cardOpacity.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    cardTranslateX.value = withDelay(index * 100, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateX: cardTranslateX.value },
      { scale: cardScale.value }
    ],
  }));

  const handlePressIn = () => {
    cardScale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (onPress) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <Animated.View style={[cardAnimatedStyle, { paddingHorizontal: 24, marginBottom: 12 }]}>
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
            borderRadius: 24,
            padding: 1,
            shadowColor: glowColor || colors.neuDark,
            shadowOffset: { width: 0, height: isDestructive ? 0 : 12 },
            shadowOpacity: isDestructive ? 0.8 : 0.3,
            shadowRadius: isDestructive ? 20 : 16,
            elevation: isDestructive ? 20 : 12,
          }}
        >
          <BlurView
            intensity={25}
            tint="dark"
            style={{
              borderRadius: 23,
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
                borderColor: isDestructive ? 'rgba(239, 68, 68, 0.3)' : colors.glassBorderStrong,
                borderRadius: 23,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.15)' : colors.backgroundTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: isDestructive ? 'rgba(239, 68, 68, 0.3)' : colors.glassBorder,
                }}
              >
                <Ionicons
                  name={icon}
                  size={24}
                  color={isDestructive ? colors.error : colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.textBold, { 
                  fontSize: 17, 
                  marginBottom: 2,
                  color: isDestructive ? colors.error : colors.text,
                }]}>
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
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main Settings Screen Component
export default function SettingsScreen() {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { user, signOut } = useAuth();

  const backgroundOpacity = useSharedValue(0);

  useEffect(() => {
    loadData();
    backgroundOpacity.value = withTiming(1, { duration: 1000 });
    
    // Show confetti on load for wow effect
    setTimeout(() => setShowConfetti(true), 1000);
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
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
    router.push('/profile/edit');
  };

  const handleUpgradeToPro = () => {
    router.push('/paywall');
  };

  const handleFollowersPress = () => {
    Alert.alert('Followers', 'View your followers list (Coming soon!)');
  };

  const handleExportData = () => {
    setShowExportModal(true);
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

  const handleSignOut = () => {
    if (user) {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Info', 'You are currently using the app as a guest.');
    }
  };

  const handleClearData = () => {
    setShowClearDataModal(true);
  };

  const clearAllData = async () => {
    try {
      await storage.clearAll();
      setProfile(null);
      setQuota({ text: 0, image: 0 });
      setShowClearDataModal(false);
      Alert.alert('Success', 'All data cleared');
    } catch (error) {
      console.error('Clear data error:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const performSignOut = async () => {
    try {
      console.log('User confirmed logout, starting logout process...');
      
      await signOut();
      setProfile(null);
      setQuota({ text: 0, image: 0 });
      setShowLogoutModal(false);
      
      console.log('Logout completed, navigating to root...');
      router.replace('/');
    } catch (error) {
      console.error('Error during sign out:', error);
      setShowLogoutModal(false);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[backgroundAnimatedStyle, { flex: 1 }]}>
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
          locations={[0, 0.6, 1]}
          style={{ flex: 1 }}
        >
          {/* Confetti Effect */}
          {showConfetti && (
            <ConfettiCannon
              count={100}
              origin={{ x: width / 2, y: 0 }}
              colors={[colors.primary, colors.tealPrimary, colors.gradientEnd, '#8B5CF6', '#EC4899']}
              explosionSpeed={350}
              fallSpeed={2000}
              fadeOut={true}
            />
          )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <PremiumProfileHeader profile={profile} onEditPress={handleEditProfile} />

            {/* Profile Card */}
            <PremiumProfileCard profile={profile} user={user} />

            {/* Stats Row */}
            <PremiumStatsRow profile={profile} quota={quota} />

            {/* About Me Section */}
            <PremiumSectionCard title="About Me" index={0}>
              <PremiumActionCard
                icon="camera"
                title="Content Niche"
                subtitle={profile?.niche || 'Not set'}
                index={0}
                gradient={[colors.tealPrimary, colors.primary]}
                glowColor={colors.glowTeal}
              />
              <PremiumActionCard
                icon="target"
                title="Growth Goals"
                subtitle={profile?.goal || 'Building my audience'}
                index={1}
                gradient={[colors.primary, colors.gradientEnd]}
                glowColor={colors.glowPrimary}
              />
              <PremiumActionCard
                icon="star"
                title="Platforms"
                subtitle={profile?.platforms?.join(', ') || 'All platforms'}
                index={2}
                gradient={['#8B5CF6', colors.tealPrimary]}
                glowColor="#8B5CF6"
              />
            </PremiumSectionCard>

            {/* Usage & Activity */}
            <PremiumSectionCard title="Usage & Activity" index={1}>
              <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
                <LinearGradient
                  colors={[colors.warning, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 1,
                    shadowColor: colors.warning,
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 20,
                  }}
                >
                  <BlurView
                    intensity={25}
                    tint="dark"
                    style={{
                      borderRadius: 23,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.glassBackgroundStrong,
                        padding: 24,
                        borderWidth: 1,
                        borderColor: colors.glassBorderStrong,
                        borderRadius: 23,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: colors.backgroundTertiary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 16,
                          }}
                        >
                          <Ionicons name="analytics" size={24} color={colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[commonStyles.textBold, { fontSize: 17, marginBottom: 2 }]}>
                            AI Usage Stats
                          </Text>
                          <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                            {quota.text} text requests • {quota.image} images generated
                          </Text>
                        </View>
                      </View>
                      
                      {/* Usage Charts */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={[commonStyles.textSmall, { marginBottom: 8, opacity: 0.7 }]}>
                            Text Requests
                          </Text>
                          <SparklineChart
                            data={[2, 5, 3, 8, 4, 6, quota.text || 1]}
                            color={colors.primary}
                            height={30}
                          />
                        </View>
                        
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={[commonStyles.textSmall, { marginBottom: 8, opacity: 0.7 }]}>
                            Images Generated
                          </Text>
                          <SparklineChart
                            data={[1, 2, 0, 3, 1, 2, quota.image || 0]}
                            color={colors.tealPrimary}
                            height={30}
                          />
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </LinearGradient>
              </View>
            </PremiumSectionCard>

            {/* Subscription Status */}
            <PremiumSectionCard title="Subscription" index={2}>
              <PremiumActionCard
                icon="diamond"
                title="Upgrade to Pro"
                subtitle="Unlimited requests and premium features"
                onPress={handleUpgradeToPro}
                index={0}
                gradient={[colors.primary, colors.tealPrimary]}
                glowColor={colors.glowPrimary}
              />
            </PremiumSectionCard>

            {/* Settings & Actions */}
            <PremiumSectionCard title="Settings & Actions" index={3}>
              <PremiumActionCard
                icon="settings"
                title="Account Settings"
                subtitle="Manage your account preferences"
                index={0}
              />
              <PremiumActionCard
                icon="notifications"
                title="Notifications"
                subtitle="Push notifications and alerts"
                index={1}
              />
              <PremiumActionCard
                icon="shield-checkmark"
                title="Privacy"
                subtitle="Data and privacy settings"
                index={2}
              />
              <PremiumActionCard
                icon="download"
                title="Export Data"
                subtitle="Download all your content"
                onPress={handleExportData}
                index={3}
              />
              <PremiumActionCard
                icon="trash"
                title="Clear All Data"
                subtitle="Reset app to initial state"
                onPress={handleClearData}
                index={4}
                isDestructive={true}
                glowColor={colors.error}
              />
              <PremiumActionCard
                icon="log-out"
                title="Sign Out"
                subtitle={user ? user.email : 'Using as guest'}
                onPress={handleSignOut}
                index={5}
                isDestructive={true}
                glowColor={colors.error}
              />
            </PremiumSectionCard>
          </ScrollView>

          {/* Modals */}
          <PremiumConfirmModal
            visible={showLogoutModal}
            title="Sign Out"
            message="Are you sure you want to sign out? You'll need to sign in again to access your saved content."
            confirmText="Sign Out"
            cancelText="Cancel"
            onConfirm={performSignOut}
            onCancel={() => setShowLogoutModal(false)}
            isDestructive={true}
            icon="log-out"
          />

          <PremiumConfirmModal
            visible={showExportModal}
            title="Export Data"
            message="Export all your saved content and settings? The data will be logged to the console."
            confirmText="Export"
            cancelText="Cancel"
            onConfirm={() => {
              setShowExportModal(false);
              exportData();
            }}
            onCancel={() => setShowExportModal(false)}
            icon="download"
          />

          <PremiumConfirmModal
            visible={showClearDataModal}
            title="Clear All Data"
            message="This will permanently delete all your saved content, settings, and reset your quota. This action cannot be undone."
            confirmText="Clear All"
            cancelText="Cancel"
            onConfirm={clearAllData}
            onCancel={() => setShowClearDataModal(false)}
            isDestructive={true}
            icon="trash"
          />
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}
