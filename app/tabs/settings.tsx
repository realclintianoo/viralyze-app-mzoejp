
import { BlurView } from 'expo-blur';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import PremiumConfirmModal from '../../components/PremiumConfirmModal';
import { Ionicons } from '@expo/vector-icons';
import SparklineChart from '../../components/SparklineChart';
import { storage } from '../../utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { formatFollowers, getNicheEmoji } from '../../utils/personalization';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
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
import { commonStyles, colors } from '../../styles/commonStyles';
import { OnboardingData, QuotaUsage } from '../../types';

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

const PremiumProfileHeader: React.FC<PremiumProfileHeaderProps> = ({ profile, onEditPress }) => {
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: interpolate(fadeAnim.value, [0, 1], [-20, 0]) }],
  }));

  useEffect(() => {
    fadeAnim.value = withDelay(100, withTiming(1, { duration: 600 }));
  }, []);

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEditPress();
  };

  return (
    <Animated.View style={[commonStyles.header, animatedStyle]}>
      <View>
        <Text style={commonStyles.headerTitle}>My Profile</Text>
        <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
          @{profile?.niche?.toLowerCase().replace(/\s+/g, '') || 'creator'}
        </Text>
      </View>
      
      <TouchableOpacity
        style={{
          backgroundColor: colors.glassBackgroundStrong,
          borderRadius: 20,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.glassBorderStrong,
          shadowColor: colors.glowTeal,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={handleEditPress}
      >
        <Ionicons name="pencil" size={20} color={colors.accent} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumProfileCard: React.FC<PremiumProfileCardProps> = ({ profile, user }) => {
  const { theme, followerTier } = usePersonalization();
  const scaleAnim = useSharedValue(0.9);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
    scaleAnim.value = withDelay(200, withSpring(1, { tension: 300, friction: 8 }));
  }, []);

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleAnim.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const getNicheEmoji = (niche: string) => {
    const emojiMap: Record<string, string> = {
      fitness: '💪',
      tech: '💻',
      fashion: '👗',
      music: '🎵',
      food: '🍕',
      beauty: '💄',
      travel: '✈️',
      gaming: '🎮',
      business: '💼',
      lifestyle: '🌟',
    };
    
    const normalizedNiche = niche.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (normalizedNiche.includes(key)) return emoji;
    }
    return '🚀';
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          commonStyles.ultraCard,
          {
            alignItems: 'center',
            borderColor: theme.glow.replace('0.6', '0.3'),
            shadowColor: theme.glow,
          }
        ]}
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[theme.gradient[0] + '10', theme.gradient[1] + '10']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
          }}
        />
        
        {/* Profile Picture */}
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.glassBackgroundStrong,
          borderWidth: 3,
          borderColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 16,
        }}>
          <Text style={{ fontSize: 40 }}>
            {profile?.niche ? getNicheEmoji(profile.niche) : '👤'}
          </Text>
          
          {/* Verified checkmark */}
          <View style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: theme.primary,
            borderRadius: 12,
            padding: 4,
            borderWidth: 2,
            borderColor: colors.background,
          }}>
            <Ionicons name="checkmark" size={12} color={colors.white} />
          </View>
        </View>

        {/* Username */}
        <Text style={[commonStyles.title, { fontSize: 24, marginBottom: 4 }]}>
          {user?.email?.split('@')[0] || 'Creator'}
        </Text>

        {/* Niche Badge */}
        {profile?.niche && (
          <View style={{
            backgroundColor: theme.primary + '20',
            borderColor: theme.primary + '40',
            borderWidth: 1,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginBottom: 8,
          }}>
            <Text style={[
              commonStyles.textBold,
              { color: theme.primary, fontSize: 14 }
            ]}>
              {profile.niche} Creator
            </Text>
          </View>
        )}

        {/* Bio/Goal */}
        {profile?.goal && (
          <Text style={[
            commonStyles.textSmall,
            { textAlign: 'center', marginTop: 8, fontStyle: 'italic' }
          ]}>
            "{profile.goal}" 🚀
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumStatsRow: React.FC<PremiumStatsRowProps> = ({ profile, quota }) => {
  const { theme, followerTier } = usePersonalization();
  const slideAnim = useSharedValue(-50);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    slideAnim.value = withDelay(400, withSpring(0, { tension: 300, friction: 8 }));
    fadeAnim.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getEngagementLevel = () => {
    if (!profile) return { level: 'Unknown', color: colors.textSecondary };
    
    const followers = profile.followers;
    if (followers < 1000) return { level: 'Growing', color: colors.accent };
    if (followers < 10000) return { level: 'Active', color: colors.warning };
    return { level: 'High', color: colors.success };
  };

  const engagement = getEngagementLevel();

  const StatCard = ({ title, value, subtitle, icon, gradient }: any) => (
    <View style={[
      commonStyles.glassCard,
      {
        flex: 1,
        margin: 4,
        padding: 16,
        alignItems: 'center',
        minHeight: 80,
      }
    ]}>
      <LinearGradient
        colors={gradient || [theme.gradient[0] + '10', theme.gradient[1] + '10']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
        }}
      />
      
      <Ionicons name={icon} size={20} color={theme.primary} style={{ marginBottom: 4 }} />
      <Text style={[commonStyles.textBold, { fontSize: 18, color: theme.primary }]}>
        {value}
      </Text>
      <Text style={[commonStyles.textSmall, { fontSize: 10, textAlign: 'center' }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[commonStyles.textSmall, { fontSize: 9, color: colors.textTertiary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <Animated.View style={[{ flexDirection: 'row', paddingHorizontal: 16 }, animatedStyle]}>
      <StatCard
        title="Followers"
        value={formatFollowers(profile?.followers || 0)}
        subtitle={followerTier.label}
        icon="people"
        gradient={[theme.gradient[0] + '15', theme.gradient[1] + '15']}
      />
      
      <StatCard
        title="AI Requests"
        value={`${quota.text}/2`}
        subtitle="Today"
        icon="flash"
        gradient={['rgba(245, 158, 11, 0.15)', 'rgba(251, 191, 36, 0.15)']}
      />
      
      <StatCard
        title="Engagement"
        value={engagement.level}
        subtitle="Level"
        icon="trending-up"
        gradient={[engagement.color + '15', engagement.color + '25']}
      />
    </Animated.View>
  );
};

const PremiumSectionCard: React.FC<PremiumSectionCardProps> = ({ title, children, index, gradient }) => {
  const slideAnim = useSharedValue(30);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    slideAnim.value = withDelay(index * 100 + 600, withSpring(0, { tension: 300, friction: 8 }));
    fadeAnim.value = withDelay(index * 100 + 600, withTiming(1, { duration: 600 }));
  }, [index]);

  return (
    <Animated.View style={[commonStyles.ultraCard, { margin: 16 }, animatedStyle]}>
      {gradient && (
        <LinearGradient
          colors={gradient}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
          }}
        />
      )}
      
      <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
        {title}
      </Text>
      {children}
    </Animated.View>
  );
};

const PremiumActionCard: React.FC<PremiumActionCardProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  gradient, 
  index, 
  glowColor,
  isDestructive 
}) => {
  const scaleAnim = useSharedValue(1);
  const slideAnim = useSharedValue(20);
  const fadeAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnim.value },
      { translateX: slideAnim.value }
    ],
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    slideAnim.value = withDelay(index * 50, withSpring(0, { tension: 300, friction: 8 }));
    fadeAnim.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
  }, [index]);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          commonStyles.glassCard,
          {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            marginVertical: 4,
            borderColor: isDestructive ? colors.error + '30' : colors.glassBorderStrong,
            shadowColor: glowColor || colors.glowTeal,
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {gradient && (
          <LinearGradient
            colors={gradient}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
        )}
        
        <View style={{
          backgroundColor: isDestructive ? colors.error + '20' : colors.glassBackgroundStrong,
          borderRadius: 16,
          padding: 12,
          marginRight: 16,
        }}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={isDestructive ? colors.error : colors.accent} 
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={[
            commonStyles.textBold,
            { color: isDestructive ? colors.error : colors.text }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[
              commonStyles.textSmall,
              { color: isDestructive ? colors.error + 'AA' : colors.textSecondary }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightElement || (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDestructive ? colors.error : colors.textSecondary} 
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  console.log('⚙️ Settings screen rendered');
  
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { user, signOut } = useAuth();
  const { profile, theme, isPersonalized, refreshPersonalization } = usePersonalization();
  
  const fadeAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const quotaData = await storage.getQuotaUsage();
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleUpgradeToPro = () => {
    router.push('/paywall');
  };

  const handleFollowersPress = () => {
    Alert.alert(
      'Follower Count',
      `You currently have ${formatFollowers(profile?.followers || 0)} followers across all platforms.\n\nTier: ${profile ? 'Rising Star' : 'Starter'}`,
      [{ text: 'OK' }]
    );
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      Alert.alert(
        'Data Export',
        `Your data has been prepared for export.\n\nSaved Items: ${data.savedItems?.length || 0}\nOnboarding Data: ${data.onboardingData ? 'Yes' : 'No'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const exportData = async () => {
    return await storage.exportData();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your local data will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performSignOut },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your saved items, chat history, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllData },
      ]
    );
  };

  const clearAllData = async () => {
    try {
      await storage.clearAll();
      await refreshPersonalization();
      setQuota({ text: 0, image: 0 });
      
      Alert.alert('Success', 'All data has been cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  const performSignOut = async () => {
    try {
      await signOut();
      console.log('✅ Sign out completed successfully');
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {showConfetti && (
          <ConfettiCannon
            count={100}
            origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
            fadeOut={true}
          />
        )}
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <PremiumProfileHeader 
            profile={profile} 
            onEditPress={handleEditProfile} 
          />

          {/* Profile Card */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <PremiumProfileCard profile={profile} user={user} />
          </View>

          {/* Stats Row */}
          <PremiumStatsRow profile={profile} quota={quota} />

          {/* Profile Details */}
          <PremiumSectionCard 
            title="About Me" 
            index={0}
            gradient={[theme.gradient[0] + '08', theme.gradient[1] + '08']}
          >
            <PremiumActionCard
              icon="person"
              title="Edit Profile"
              subtitle="Update your niche, followers, and goals"
              onPress={handleEditProfile}
              index={0}
            />
            
            <PremiumActionCard
              icon="people"
              title={`${formatFollowers(profile?.followers || 0)} Followers`}
              subtitle={`${profile ? 'Rising Star' : 'Starter'} tier`}
              onPress={handleFollowersPress}
              index={1}
            />
          </PremiumSectionCard>

          {/* Usage & Activity */}
          <PremiumSectionCard 
            title="Usage & Activity" 
            index={1}
            gradient={['rgba(245, 158, 11, 0.08)', 'rgba(251, 191, 36, 0.08)']}
          >
            <View style={{ marginBottom: 16 }}>
              <SparklineChart 
                data={[quota.text, 2 - quota.text]} 
                width={200} 
                height={60} 
              />
            </View>
            
            <PremiumActionCard
              icon="flash"
              title="AI Requests"
              subtitle={`${quota.text}/2 used today`}
              index={0}
              rightElement={
                <Text style={[commonStyles.textBold, { color: colors.warning }]}>
                  {2 - quota.text} left
                </Text>
              }
            />
            
            <PremiumActionCard
              icon="images"
              title="Images Generated"
              subtitle={`${quota.image}/1 used today`}
              index={1}
              rightElement={
                <Text style={[commonStyles.textBold, { color: colors.accent }]}>
                  {1 - quota.image} left
                </Text>
              }
            />
          </PremiumSectionCard>

          {/* Subscription Status */}
          <PremiumSectionCard 
            title="Subscription" 
            index={2}
            gradient={['rgba(139, 92, 246, 0.08)', 'rgba(124, 58, 237, 0.08)']}
          >
            <PremiumActionCard
              icon="diamond"
              title="Upgrade to Pro"
              subtitle="Unlimited AI requests and premium features"
              onPress={handleUpgradeToPro}
              index={0}
              gradient={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)']}
              glowColor="rgba(139, 92, 246, 0.6)"
            />
          </PremiumSectionCard>

          {/* Settings & Actions */}
          <PremiumSectionCard 
            title="Settings & Actions" 
            index={3}
          >
            <PremiumActionCard
              icon="download"
              title="Export Data"
              subtitle="Download your saved content and settings"
              onPress={handleExportData}
              index={0}
            />
            
            <PremiumActionCard
              icon="trash"
              title="Clear All Data"
              subtitle="Delete all saved items and preferences"
              onPress={handleClearData}
              index={1}
              isDestructive
            />
            
            <PremiumActionCard
              icon="log-out"
              title="Sign Out"
              subtitle="Sign out and clear local data"
              onPress={handleSignOut}
              index={2}
              isDestructive
            />
          </PremiumSectionCard>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
