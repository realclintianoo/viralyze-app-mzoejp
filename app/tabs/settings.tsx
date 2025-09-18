
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
import { OnboardingData, QuotaUsage } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { storage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { commonStyles, colors } from '../../styles/commonStyles';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { formatFollowers, getNicheEmoji } from '../../utils/personalization';
import { useAuth } from '../../contexts/AuthContext';
import SparklineChart from '../../components/SparklineChart';
import { Ionicons } from '@expo/vector-icons';
import PremiumConfirmModal from '../../components/PremiumConfirmModal';
import ConfettiCannon from 'react-native-confetti-cannon';
import { router } from 'expo-router';

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
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    shadowOpacity: 0.4 + glowAnim.value * 0.6,
    shadowRadius: 16 + glowAnim.value * 12,
  }));

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );
  }, [glowAnim]);

  const handleEditPress = () => {
    scaleAnim.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { tension: 400, friction: 6 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEditPress();
  };

  return (
    <Animated.View style={[
      {
        backgroundColor: colors.glassBackgroundUltra,
        borderRadius: 28,
        padding: 24,
        marginHorizontal: 16,
        marginTop: 20,
        borderWidth: 2,
        borderColor: colors.glassBorderUltra,
        shadowColor: colors.glowNeonTeal,
        shadowOffset: { width: 0, height: 0 },
        elevation: 16,
      },
      animatedStyle
    ]}>
      <LinearGradient
        colors={[colors.neonTeal + '12', colors.neonGreen + '08']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 28,
        }}
      />
      
      {/* VIRALYZE Logo Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Image
          source={require('../../assets/images/a8b69f5d-7692-41da-84fd-76aebd35c7d4.png')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            marginRight: 12,
            shadowColor: colors.glowNeonTeal,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
          }}
          resizeMode="contain"
        />
        <View style={{ alignItems: 'center' }}>
          <Text style={[
            commonStyles.headerTitle,
            {
              fontSize: 28,
              color: colors.neonTeal,
              textShadowColor: colors.glowNeonTeal,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }
          ]}>
            VIRALYZE
          </Text>
          <Text style={[
            commonStyles.textSmall,
            {
              color: colors.neonGreen,
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginTop: -4,
            }
          ]}>
            Settings
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={[
            commonStyles.title,
            {
              fontSize: 20,
              color: colors.text,
              marginBottom: 4,
            }
          ]}>
            Profile Settings
          </Text>
          <Text style={[
            commonStyles.textSmall,
            {
              color: colors.textSecondary,
              fontSize: 14,
            }
          ]}>
            Customize your VIRALYZE experience
          </Text>
        </View>
        
        <TouchableOpacity
          style={{
            backgroundColor: colors.glassBackgroundStrong,
            borderRadius: 16,
            padding: 12,
            borderWidth: 2,
            borderColor: colors.neonTeal + '40',
            shadowColor: colors.glowNeonTeal,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={handleEditPress}
        >
          <Ionicons name="create-outline" size={20} color={colors.neonTeal} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const PremiumProfileCard: React.FC<PremiumProfileCardProps> = ({ profile, user }) => {
  const scaleAnim = useSharedValue(1);
  const { themeColors } = usePersonalization();
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  useEffect(() => {
    scaleAnim.value = withDelay(200, withSpring(1, { tension: 300, friction: 8 }));
  }, [scaleAnim]);

  const handleCardPress = () => {
    scaleAnim.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withSpring(1, { tension: 400, friction: 6 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      comedy: '😂',
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (niche.toLowerCase().includes(key)) return emoji;
    }
    return '🚀';
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          commonStyles.glassCard,
          {
            marginHorizontal: 16,
            marginVertical: 8,
            padding: 20,
          }
        ]}
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[themeColors.primary + '15', themeColors.secondary + '10']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
          }}
        />
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.glassBackgroundStrong,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            borderWidth: 2,
            borderColor: themeColors.primary + '40',
            shadowColor: themeColors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Text style={{ fontSize: 24 }}>
              {profile?.niche ? getNicheEmoji(profile.niche) : '👤'}
            </Text>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={[
              commonStyles.textBold,
              {
                fontSize: 18,
                color: colors.text,
                marginBottom: 4,
              }
            ]}>
              {user?.user_metadata?.full_name || user?.email || 'Creator'}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={[
                commonStyles.textSmall,
                {
                  color: themeColors.primary,
                  fontSize: 12,
                  fontWeight: '600',
                }
              ]}>
                {profile?.niche || 'General'} Creator
              </Text>
              <View style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.textSecondary,
                marginHorizontal: 8,
              }} />
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  fontSize: 12,
                }
              ]}>
                {formatFollowers(profile?.followers || 0)} followers
              </Text>
            </View>
            
            <Text style={[
              commonStyles.textSmall,
              {
                color: colors.textTertiary,
                fontSize: 11,
                fontStyle: 'italic',
              }
            ]} numberOfLines={2}>
              {profile?.goal || 'Building an amazing community'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumStatsRow: React.FC<PremiumStatsRowProps> = ({ profile, quota }) => {
  const fadeAnim = useSharedValue(0);
  const { themeColors } = usePersonalization();
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, [fadeAnim]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getEngagementLevel = () => {
    const followers = profile?.followers || 0;
    if (followers >= 100000) return 'Influencer';
    if (followers >= 10000) return 'Rising Star';
    if (followers >= 1000) return 'Growing';
    return 'Starter';
  };

  const StatCard = ({ title, value, subtitle, icon, gradient }: {
    title: string;
    value: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: string[];
  }) => (
    <View style={{
      flex: 1,
      backgroundColor: colors.glassBackground,
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: 'center',
    }}>
      <LinearGradient
        colors={gradient}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
        }}
      />
      
      <View style={{
        backgroundColor: gradient[0] + '30',
        borderRadius: 12,
        padding: 8,
        marginBottom: 8,
      }}>
        <Ionicons name={icon} size={20} color={gradient[0].replace('15', '').replace('10', '')} />
      </View>
      
      <Text style={[
        commonStyles.textBold,
        {
          fontSize: 18,
          color: colors.text,
          marginBottom: 2,
        }
      ]}>
        {value}
      </Text>
      
      <Text style={[
        commonStyles.textSmall,
        {
          fontSize: 10,
          color: colors.textSecondary,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 2,
        }
      ]}>
        {title}
      </Text>
      
      <Text style={[
        commonStyles.textSmall,
        {
          fontSize: 9,
          color: colors.textTertiary,
          textAlign: 'center',
        }
      ]}>
        {subtitle}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[
      {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginVertical: 8,
        gap: 8,
      },
      animatedStyle
    ]}>
      <StatCard
        title="Followers"
        value={formatFollowers(profile?.followers || 0)}
        subtitle={getEngagementLevel()}
        icon="people-outline"
        gradient={[themeColors.primary + '15', themeColors.primary + '05']}
      />
      
      <StatCard
        title="AI Requests"
        value={`${10 - quota.text}/10`}
        subtitle="Today"
        icon="flash-outline"
        gradient={[colors.neonTeal + '15', colors.neonTeal + '05']}
      />
      
      <StatCard
        title="Level"
        value="Pro"
        subtitle="Creator"
        icon="diamond-outline"
        gradient={[colors.neonGreen + '15', colors.neonGreen + '05']}
      />
    </Animated.View>
  );
};

const PremiumSectionCard: React.FC<PremiumSectionCardProps> = ({ 
  title, 
  children, 
  index, 
  gradient = [colors.glassBackgroundStrong, colors.glassBackground] 
}) => {
  const slideAnim = useSharedValue(50);
  const fadeAnim = useSharedValue(0);
  
  useEffect(() => {
    slideAnim.value = withDelay(index * 100, withSpring(0, { tension: 300, friction: 8 }));
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
  }, [index, slideAnim, fadeAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: fadeAnim.value,
  }));

  return (
    <Animated.View style={[
      commonStyles.glassCard,
      {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 0,
        overflow: 'hidden',
      },
      animatedStyle
    ]}>
      <LinearGradient
        colors={gradient}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      <View style={{ padding: 20 }}>
        <Text style={[
          commonStyles.subtitle,
          {
            fontSize: 18,
            color: colors.text,
            marginBottom: 16,
            textAlign: 'center',
          }
        ]}>
          {title}
        </Text>
        
        {children}
      </View>
    </Animated.View>
  );
};

const PremiumActionCard: React.FC<PremiumActionCardProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  gradient = [colors.glassBackground, colors.glassBackgroundStrong], 
  index,
  glowColor = colors.glowNeonTeal,
  isDestructive = false
}) => {
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  useEffect(() => {
    scaleAnim.value = withDelay(index * 50, withSpring(1, { tension: 300, friction: 8 }));
    
    if (!isDestructive) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 }),
          withTiming(0, { duration: 3000 })
        ),
        -1,
        true
      );
    }
  }, [index, isDestructive, scaleAnim, glowAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    shadowOpacity: isDestructive ? 0.3 : 0.3 + glowAnim.value * 0.4,
    shadowRadius: isDestructive ? 8 : 8 + glowAnim.value * 8,
  }));

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(isDestructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          {
            backgroundColor: colors.glassBackground,
            borderRadius: 20,
            padding: 16,
            marginVertical: 6,
            borderWidth: 1,
            borderColor: isDestructive ? colors.error + '30' : colors.glassBorder,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: isDestructive ? colors.error : glowColor,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isDestructive ? [colors.error + '10', colors.error + '05'] : gradient}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
          }}
        />
        
        <View style={{
          backgroundColor: isDestructive ? colors.error + '20' : glowColor.replace('0.8', '0.2'),
          borderRadius: 16,
          padding: 12,
          marginRight: 16,
        }}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={isDestructive ? colors.error : glowColor.replace('rgba(', '').replace(', 0.8)', '').replace(', 0.6)', '')} 
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={[
            commonStyles.textBold,
            {
              fontSize: 16,
              color: isDestructive ? colors.error : colors.text,
              marginBottom: subtitle ? 2 : 0,
            }
          ]}>
            {title}
          </Text>
          
          {subtitle && (
            <Text style={[
              commonStyles.textSmall,
              {
                color: isDestructive ? colors.error + 'CC' : colors.textSecondary,
                fontSize: 13,
              }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightElement || (
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={isDestructive ? colors.error : colors.textSecondary} 
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  console.log('⚙️ Settings screen rendered');
  
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [quota, setQuota] = useState<QuotaUsage>({ text: 0, image: 0 });
  const [loading, setLoading] = useState(true);
  const fadeAnim = useSharedValue(0);
  const { themeColors } = usePersonalization();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    loadData();
  }, [fadeAnim]);

  const loadData = async () => {
    try {
      const [profileData, quotaData] = await Promise.all([
        storage.getProfile(),
        storage.getQuotaUsage(),
      ]);
      
      setProfile(profileData);
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setLoading(false);
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
      'This shows your current follower count from your profile. Update it in Edit Profile to get more personalized content suggestions.',
      [{ text: 'Got it!' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Would you like to export your VIRALYZE data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: exportData },
      ]
    );
  };

  const exportData = async () => {
    try {
      // In a real app, this would export user data
      console.log('Exporting user data...');
      Alert.alert('Success', 'Your data has been exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of VIRALYZE?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performSignOut },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your local data including saved content, conversations, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Data', style: 'destructive', onPress: clearAllData },
      ]
    );
  };

  const clearAllData = async () => {
    try {
      await storage.clearAll();
      Alert.alert('Success', 'All local data has been cleared.');
      // Optionally restart the app or navigate to onboarding
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  const performSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the auth context
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={commonStyles.text}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Profile Header with VIRALYZE branding */}
          <PremiumProfileHeader
            profile={profile}
            onEditPress={handleEditProfile}
          />

          {/* Profile Card */}
          <PremiumProfileCard
            profile={profile}
            user={user}
          />

          {/* Stats Row */}
          <PremiumStatsRow
            profile={profile}
            quota={quota}
          />

          {/* Account Section */}
          <PremiumSectionCard
            title="Account & Subscription"
            index={0}
            gradient={[colors.neonGreen + '12', colors.neonGreen + '06']}
          >
            <PremiumActionCard
              icon="diamond-outline"
              title="Upgrade to Pro"
              subtitle="Unlock unlimited AI requests and premium features"
              onPress={handleUpgradeToPro}
              index={0}
              glowColor={colors.glowNeonGreen}
            />
            
            <PremiumActionCard
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your niche, followers, and goals"
              onPress={handleEditProfile}
              index={1}
              glowColor={colors.glowNeonTeal}
            />
            
            <PremiumActionCard
              icon="people-outline"
              title="Followers"
              subtitle={`${formatFollowers(profile?.followers || 0)} followers`}
              onPress={handleFollowersPress}
              index={2}
              glowColor={colors.glowNeonPurple}
            />
          </PremiumSectionCard>

          {/* Data & Privacy Section */}
          <PremiumSectionCard
            title="Data & Privacy"
            index={1}
            gradient={[colors.neonTeal + '12', colors.neonTeal + '06']}
          >
            <PremiumActionCard
              icon="download-outline"
              title="Export Data"
              subtitle="Download your VIRALYZE data"
              onPress={handleExportData}
              index={3}
              glowColor={colors.glowNeonTeal}
            />
            
            <PremiumActionCard
              icon="trash-outline"
              title="Clear Local Data"
              subtitle="Remove all saved content and settings"
              onPress={handleClearData}
              index={4}
              glowColor={colors.error}
              isDestructive={true}
            />
          </PremiumSectionCard>

          {/* Account Actions Section */}
          <PremiumSectionCard
            title="Account Actions"
            index={2}
            gradient={[colors.error + '12', colors.error + '06']}
          >
            <PremiumActionCard
              icon="log-out-outline"
              title="Sign Out"
              subtitle="Sign out of your VIRALYZE account"
              onPress={handleSignOut}
              index={5}
              glowColor={colors.error}
              isDestructive={true}
            />
          </PremiumSectionCard>

          {/* App Info */}
          <View style={{
            alignItems: 'center',
            marginTop: 32,
            marginBottom: 16,
          }}>
            <Image
              source={require('../../assets/images/a8b69f5d-7692-41da-84fd-76aebd35c7d4.png')}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                marginBottom: 12,
                shadowColor: colors.glowNeonTeal,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
              }}
              resizeMode="contain"
            />
            
            <Text style={[
              commonStyles.textBold,
              {
                fontSize: 18,
                color: colors.neonTeal,
                textShadowColor: colors.glowNeonTeal,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
                marginBottom: 4,
              }
            ]}>
              VIRALYZE
            </Text>
            
            <Text style={[
              commonStyles.textSmall,
              {
                color: colors.textSecondary,
                fontSize: 12,
                textAlign: 'center',
              }
            ]}>
              AI-Powered Content Creation Platform
            </Text>
            
            <Text style={[
              commonStyles.textSmall,
              {
                color: colors.textTertiary,
                fontSize: 10,
                textAlign: 'center',
                marginTop: 8,
              }
            ]}>
              Version 1.0.0 • Made with ❤️ for creators
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
