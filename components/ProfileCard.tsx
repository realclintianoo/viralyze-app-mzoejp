
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { storage } from '../utils/storage';
import { OnboardingData } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface ProfileCardProps {
  onEditPress?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ onEditPress }) => {
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Animation values
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const profileImageScale = useSharedValue(0.8);
  const statsOpacity = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    loadProfile();
    
    // Entrance animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    profileImageScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 150 }));
    statsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    glowIntensity.value = withDelay(800, withTiming(1, { duration: 1000 }));
    
    // Continuous badge animation
    badgeRotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000 }),
        withTiming(-5, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await storage.getOnboardingData();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  };

  const getNicheEmoji = (niche: string): string => {
    const emojiMap: Record<string, string> = {
      fitness: '💪',
      tech: '💻',
      fashion: '👗',
      music: '🎵',
      food: '🍕',
      travel: '✈️',
      lifestyle: '✨',
      business: '💼',
      education: '📚',
      gaming: '🎮',
      art: '🎨',
      other: '✨',
    };
    return emojiMap[niche.toLowerCase()] || '✨';
  };

  const getPlatformIcon = (platform: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      tiktok: 'musical-notes',
      instagram: 'camera',
      youtube: 'play',
      twitter: 'logo-twitter',
      linkedin: 'logo-linkedin',
      all: 'globe',
    };
    return iconMap[platform.toLowerCase()] || 'globe';
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const profileImageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileImageScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: interpolate(statsOpacity.value, [0, 1], [20, 0]) }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${badgeRotation.value}deg` }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0, 0.6]),
  }));

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 }, () => {
      cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });

    if (onEditPress) {
      onEditPress();
    } else {
      router.push('/onboarding');
    }
  };

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0B0F14', '#1E293B', '#0F172A']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingCard}>
          <View style={styles.loadingAvatar} />
          <View style={styles.loadingText} />
          <View style={styles.loadingSubtext} />
        </View>
      </View>
    );
  }

  const username = user?.email?.split('@')[0] || 'Creator';
  const followerCount = profile?.followers || 1000;
  const niche = profile?.niche || 'lifestyle';
  const platforms = profile?.platforms || ['All'];
  const primaryPlatform = platforms[0] || 'All';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0B0F14', '#1E293B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>@{username}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditPress}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.editButtonGradient}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Main Profile Card */}
      <View style={styles.profileContainer}>
        <Animated.View style={[styles.profileCard, cardAnimatedStyle, glowAnimatedStyle]}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleCardPress}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
                {/* Profile Image Section */}
                <View style={styles.profileImageSection}>
                  <Animated.View style={[styles.profileImageContainer, profileImageAnimatedStyle]}>
                    <LinearGradient
                      colors={['#22C55E', '#16A34A', '#15803D']}
                      style={styles.profileImageBorder}
                    >
                      <View style={styles.profileImage}>
                        <Text style={styles.profileImageText}>
                          {username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </LinearGradient>
                    
                    {/* Online Status Indicator */}
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                    </View>
                  </Animated.View>

                  {/* Verified Badge */}
                  <Animated.View style={[styles.verifiedBadge, badgeAnimatedStyle]}>
                    <LinearGradient
                      colors={['#22C55E', '#16A34A']}
                      style={styles.verifiedBadgeGradient}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <Text style={styles.displayName}>{username}</Text>
                  <View style={styles.nicheContainer}>
                    <Text style={styles.nicheEmoji}>{getNicheEmoji(niche)}</Text>
                    <Text style={styles.nicheText}>
                      {niche.charAt(0).toUpperCase() + niche.slice(1)} Creator
                    </Text>
                  </View>
                </View>

                {/* Stats Row */}
                <Animated.View style={[styles.statsRow, statsAnimatedStyle]}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{formatFollowers(followerCount)}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{platforms.length}</Text>
                    <Text style={styles.statLabel}>Platform{platforms.length > 1 ? 's' : ''}</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {followerCount > 10000 ? 'High' : followerCount > 1000 ? 'Med' : 'New'}
                    </Text>
                    <Text style={styles.statLabel}>Reach</Text>
                  </View>
                </Animated.View>

                {/* Platform Badges */}
                <View style={styles.platformBadges}>
                  {platforms.slice(0, 3).map((platform, index) => (
                    <View key={platform} style={styles.platformBadge}>
                      <LinearGradient
                        colors={['rgba(34, 197, 94, 0.2)', 'rgba(22, 163, 74, 0.1)']}
                        style={styles.platformBadgeGradient}
                      >
                        <Ionicons 
                          name={getPlatformIcon(platform)} 
                          size={14} 
                          color="#22C55E" 
                        />
                        <Text style={styles.platformBadgeText}>
                          {platform === 'All' ? 'Multi-Platform' : platform}
                        </Text>
                      </LinearGradient>
                    </View>
                  ))}
                  {platforms.length > 3 && (
                    <View style={styles.platformBadge}>
                      <LinearGradient
                        colors={['rgba(34, 197, 94, 0.2)', 'rgba(22, 163, 74, 0.1)']}
                        style={styles.platformBadgeGradient}
                      >
                        <Text style={styles.platformBadgeText}>
                          +{platforms.length - 3} more
                        </Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>

                {/* Action Hint */}
                <View style={styles.actionHint}>
                  <Ionicons name="finger-print" size={16} color="#64748B" />
                  <Text style={styles.actionHintText}>Tap to customize profile</Text>
                </View>
              </BlurView>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Quick Stats Cards */}
      <Animated.View style={[styles.quickStatsContainer, statsAnimatedStyle]}>
        <View style={styles.quickStatCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(22, 163, 74, 0.05)']}
            style={styles.quickStatGradient}
          >
            <View style={styles.quickStatIcon}>
              <Ionicons name="trending-up" size={20} color="#22C55E" />
            </View>
            <Text style={styles.quickStatTitle}>Growth</Text>
            <Text style={styles.quickStatValue}>
              {followerCount < 1000 ? '+15%' : followerCount < 10000 ? '+8%' : '+3%'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.quickStatCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(22, 163, 74, 0.05)']}
            style={styles.quickStatGradient}
          >
            <View style={styles.quickStatIcon}>
              <Ionicons name="heart" size={20} color="#22C55E" />
            </View>
            <Text style={styles.quickStatTitle}>Engagement</Text>
            <Text style={styles.quickStatValue}>
              {followerCount < 1000 ? '12.5%' : followerCount < 10000 ? '8.2%' : '5.8%'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.quickStatCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(22, 163, 74, 0.05)']}
            style={styles.quickStatGradient}
          >
            <View style={styles.quickStatIcon}>
              <Ionicons name="flash" size={20} color="#22C55E" />
            </View>
            <Text style={styles.quickStatTitle}>Potential</Text>
            <Text style={styles.quickStatValue}>
              {followerCount < 1000 ? 'High' : followerCount < 10000 ? 'Good' : 'Elite'}
            </Text>
          </LinearGradient>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 320,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  loadingText: {
    width: 120,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 12,
  },
  loadingSubtext: {
    width: 80,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#E6EAF0',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  editButton: {
    borderRadius: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  editButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
    elevation: 40,
  },
  cardGradient: {
    borderRadius: 32,
    padding: 2,
  },
  cardBlur: {
    borderRadius: 30,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImageBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 25,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 66,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  profileImageText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#22C55E',
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  verifiedBadgeGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E6EAF0',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  nicheContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 8,
  },
  nicheEmoji: {
    fontSize: 20,
  },
  nicheText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E6EAF0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    marginHorizontal: 16,
  },
  platformBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  platformBadge: {
    borderRadius: 16,
  },
  platformBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    gap: 6,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
  },
  actionHintText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 20,
  },
  quickStatGradient: {
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#22C55E',
  },
});

export default ProfileCard;
