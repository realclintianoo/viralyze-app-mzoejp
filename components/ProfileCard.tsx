
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
  const glowIntensity = useSharedValue(0);
  const profileImageScale = useSharedValue(0.8);

  useEffect(() => {
    loadProfile();
    
    // Entrance animations
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    glowIntensity.value = withDelay(400, withTiming(1, { duration: 800 }));
    profileImageScale.value = withDelay(600, withSpring(1, { damping: 12, stiffness: 150 }));
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
      return `${(count / 1000).toFixed(0)}K`;
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
      other: '✨',
    };
    return emojiMap[niche] || '✨';
  };

  const getGoalText = (goal: string): string => {
    const goalMap: Record<string, string> = {
      grow_followers: 'Growing my audience',
      monetize: 'Monetizing content',
      improve_content: 'Creating better content',
    };
    return goalMap[goal] || 'Building my brand';
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0, 0.8]),
  }));

  const profileImageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileImageScale.value }],
  }));

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Scale animation on press
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
  const niche = profile?.niche || 'other';
  const goal = profile?.goal || 'grow_followers';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0F172A', '#134E4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditPress}
        >
          <Ionicons name="create-outline" size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCardPress}
          >
            <Animated.View style={[styles.card, glowAnimatedStyle]}>
              <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.cardGradient}
                >
                  {/* Profile Image */}
                  <Animated.View style={[styles.profileImageContainer, profileImageAnimatedStyle]}>
                    <LinearGradient
                      colors={['#22C55E', '#10B981']}
                      style={styles.profileImageBorder}
                    >
                      <View style={styles.profileImage}>
                        <Text style={styles.profileImageText}>
                          {username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>

                  {/* Username */}
                  <Text style={styles.username}>@{username}</Text>

                  {/* Follower Count */}
                  <View style={styles.statsContainer}>
                    <LinearGradient
                      colors={['rgba(34, 197, 94, 0.2)', 'rgba(16, 185, 129, 0.1)']}
                      style={styles.statsBadge}
                    >
                      <Ionicons name="people" size={16} color="#22C55E" />
                      <Text style={styles.statsText}>
                        {formatFollowers(followerCount)} followers
                      </Text>
                    </LinearGradient>
                  </View>

                  {/* Niche */}
                  <View style={styles.nicheContainer}>
                    <Text style={styles.nicheEmoji}>{getNicheEmoji(niche)}</Text>
                    <Text style={styles.nicheText}>
                      {niche.charAt(0).toUpperCase() + niche.slice(1)}
                    </Text>
                  </View>

                  {/* Goal/Tagline */}
                  <Text style={styles.tagline}>
                    {getGoalText(goal)}
                  </Text>

                  {/* Edit Hint */}
                  <View style={styles.editHint}>
                    <Ionicons name="create-outline" size={16} color="#94A3B8" />
                    <Text style={styles.editHintText}>Tap to edit profile</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Additional Info Cards */}
      <View style={styles.infoCardsContainer}>
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.05)']}
            style={styles.infoCardGradient}
          >
            <Ionicons name="trending-up" size={24} color="#22C55E" />
            <Text style={styles.infoCardTitle}>Growth Potential</Text>
            <Text style={styles.infoCardSubtitle}>
              {followerCount < 1000 ? 'High' : followerCount < 10000 ? 'Medium' : 'Established'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.05)']}
            style={styles.infoCardGradient}
          >
            <Ionicons name="bulb" size={24} color="#22C55E" />
            <Text style={styles.infoCardTitle}>Content Focus</Text>
            <Text style={styles.infoCardSubtitle}>
              {niche.charAt(0).toUpperCase() + niche.slice(1)} content
            </Text>
          </LinearGradient>
        </View>
      </View>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E6EAF0',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  card: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 30,
  },
  cardBlur: {
    borderRadius: 32,
  },
  cardGradient: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 32,
  },
  profileImageContainer: {
    marginBottom: 24,
  },
  profileImageBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 66,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#22C55E',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E6EAF0',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 6,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  nicheContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  nicheEmoji: {
    fontSize: 24,
  },
  nicheText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6EAF0',
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  editHintText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  infoCardGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 20,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EAF0',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoCardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default ProfileCard;
