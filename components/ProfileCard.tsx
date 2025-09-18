
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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
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
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingData } from '../types';
import { storage } from '../utils/storage';

const { width } = Dimensions.get('window');

interface ProfileCardProps {
  onEditPress?: () => void;
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E6EAF0',
    marginBottom: 8,
  },
  niche: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  platformChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformText: {
    fontSize: 12,
    color: '#E6EAF0',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F14',
    marginLeft: 8,
  },
});

export default function ProfileCard({ onEditPress }: ProfileCardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OnboardingData | null>(null);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const profileImageScale = useSharedValue(0.5);
  const statsOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const badgeRotation = useSharedValue(0);

  useEffect(() => {
    loadProfile();
    
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withSpring(1, { tension: 300, friction: 8 });
    profileImageScale.value = withDelay(200, withSpring(1, { tension: 300, friction: 8 }));
    statsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    
    // Continuous glow effect
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
    
    // Badge rotation
    badgeRotation.value = withRepeat(
      withTiming(360, { duration: 10000 }),
      -1,
      false
    );
  }, [badgeRotation, cardOpacity, cardScale, glowIntensity, profileImageScale, statsOpacity]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
    shadowOpacity: 0.3 + glowIntensity.value * 0.4,
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

  const loadProfile = async () => {
    try {
      const savedProfile = await storage.getProfile();
      setProfile(savedProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getNicheEmoji = (niche: string): string => {
    const lowerNiche = niche.toLowerCase();
    if (lowerNiche.includes('business') || lowerNiche.includes('finance')) return '💼';
    if (lowerNiche.includes('health') || lowerNiche.includes('fitness')) return '💪';
    if (lowerNiche.includes('technology') || lowerNiche.includes('tech')) return '💻';
    if (lowerNiche.includes('lifestyle')) return '✨';
    if (lowerNiche.includes('education')) return '📚';
    if (lowerNiche.includes('entertainment')) return '🎬';
    if (lowerNiche.includes('travel')) return '✈️';
    if (lowerNiche.includes('food') || lowerNiche.includes('cooking')) return '🍳';
    if (lowerNiche.includes('fashion') || lowerNiche.includes('beauty')) return '👗';
    if (lowerNiche.includes('gaming')) return '🎮';
    if (lowerNiche.includes('sports')) return '⚽';
    if (lowerNiche.includes('music')) return '🎵';
    return '🚀';
  };

  const getPlatformIcon = (platform: string): keyof typeof Ionicons.glyphMap => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return 'logo-tiktok';
      case 'instagram': return 'logo-instagram';
      case 'youtube': return 'logo-youtube';
      case 'twitter': return 'logo-twitter';
      case 'linkedin': return 'logo-linkedin';
      default: return 'globe-outline';
    }
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onEditPress) {
      onEditPress();
    } else {
      router.push('/profile/edit');
    }
  };

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(26, 31, 46, 0.8)' }]}>
        <View style={styles.content}>
          <Text style={styles.niche}>No profile data available</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Ionicons name="person-add" size={16} color="#0B0F14" />
            <Text style={styles.editButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[cardAnimatedStyle]}>
      <BlurView intensity={30} style={styles.container}>
        <LinearGradient
          colors={[
            'rgba(26, 31, 46, 0.9)',
            'rgba(17, 24, 39, 0.8)',
          ]}
          style={styles.content}
        >
          {/* Profile Image */}
          <Animated.View style={[styles.profileImage, profileImageAnimatedStyle]}>
            <Text style={{ fontSize: 32 }}>
              {profile.niche ? getNicheEmoji(profile.niche) : '👤'}
            </Text>
            
            {/* Premium Badge */}
            <Animated.View style={[
              {
                position: 'absolute',
                top: -4,
                right: -4,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#22C55E',
                justifyContent: 'center',
                alignItems: 'center',
              },
              badgeAnimatedStyle
            ]}>
              <Ionicons name="star" size={12} color="#0B0F14" />
            </Animated.View>
          </Animated.View>

          {/* Name */}
          <Text style={styles.name}>
            {user?.email?.split('@')[0] || 'Creator'}
          </Text>

          {/* Niche */}
          <Text style={styles.niche}>
            {profile.niche || 'Content Creator'}
          </Text>

          {/* Stats */}
          <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatFollowers(profile.followers || 0)}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.platforms?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Platforms</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Pro</Text>
              <Text style={styles.statLabel}>Plan</Text>
            </View>
          </Animated.View>

          {/* Platforms */}
          {profile.platforms && profile.platforms.length > 0 && (
            <View style={styles.platformsContainer}>
              {profile.platforms.slice(0, 4).map((platform, index) => (
                <View key={platform} style={styles.platformChip}>
                  <Ionicons 
                    name={getPlatformIcon(platform)} 
                    size={12} 
                    color="#E6EAF0" 
                  />
                  <Text style={styles.platformText}>
                    {platform === 'all' ? 'All' : platform}
                  </Text>
                </View>
              ))}
              {profile.platforms.length > 4 && (
                <View style={styles.platformChip}>
                  <Text style={styles.platformText}>
                    +{profile.platforms.length - 4}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Edit Button */}
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Ionicons name="create-outline" size={16} color="#0B0F14" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}
