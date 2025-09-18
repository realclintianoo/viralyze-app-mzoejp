
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingData } from '../../types';
import { storage } from '../../utils/storage';
import { commonStyles, colors } from '../../styles/commonStyles';

const { width } = Dimensions.get('window');

interface PremiumInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  index: number;
}

interface PremiumChipProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' as keyof typeof Ionicons.glyphMap },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' as keyof typeof Ionicons.glyphMap },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' as keyof typeof Ionicons.glyphMap },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' as keyof typeof Ionicons.glyphMap },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin' as keyof typeof Ionicons.glyphMap },
  { id: 'all', name: 'All Platforms', icon: 'globe-outline' as keyof typeof Ionicons.glyphMap },
];

const NICHES = [
  'Business & Finance', 'Health & Fitness', 'Technology', 'Lifestyle',
  'Education', 'Entertainment', 'Travel', 'Food & Cooking',
  'Fashion & Beauty', 'Gaming', 'Sports', 'Music',
  'Art & Design', 'Photography', 'Parenting', 'DIY & Crafts'
];

const PremiumInputField: React.FC<PremiumInputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  icon,
  index
}) => {
  const fieldOpacity = useSharedValue(0);
  const fieldTranslateY = useSharedValue(30);

  useEffect(() => {
    fieldOpacity.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    fieldTranslateY.value = withDelay(index * 100, withSpring(0));
  }, [index, fieldOpacity, fieldTranslateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fieldOpacity.value,
    transform: [{ translateY: fieldTranslateY.value }],
  }));

  return (
    <Animated.View style={[{ marginBottom: 24 }, animatedStyle]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={18} color={colors.neonTeal} style={{ marginRight: 8 }} />
        <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>
      </View>
      <BlurView intensity={20} style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
      }}>
        <TextInput
          style={[
            commonStyles.input,
            {
              backgroundColor: colors.glassBackground,
              borderWidth: 0,
              height: multiline ? 100 : 56,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingTop: multiline ? 16 : 0,
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </BlurView>
    </Animated.View>
  );
};

const PremiumChip: React.FC<PremiumChipProps> = ({ title, isSelected, onPress, index, icon }) => {
  const chipOpacity = useSharedValue(0);
  const chipTranslateX = useSharedValue(-20);

  useEffect(() => {
    chipOpacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
    chipTranslateX.value = withDelay(index * 50, withSpring(0));
  }, [index, chipOpacity, chipTranslateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: chipOpacity.value,
    transform: [{ translateX: chipTranslateX.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    onPress();
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View style={[animatedStyle]}>
        <BlurView intensity={isSelected ? 40 : 20} style={{
          borderRadius: 25,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: isSelected ? colors.neonTeal : colors.glassBorder,
          marginRight: 8,
          marginBottom: 8,
        }}>
          <LinearGradient
            colors={isSelected 
              ? [colors.neonTeal + '30', colors.neonTeal + '10']
              : [colors.glassBackground, colors.glassBackground + '80']
            }
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {icon && (
              <Ionicons 
                name={icon} 
                size={16} 
                color={isSelected ? colors.neonTeal : colors.text} 
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={[
              commonStyles.chipText,
              {
                color: isSelected ? colors.neonTeal : colors.text,
                fontWeight: isSelected ? '600' : '500',
              }
            ]}>
              {title}
            </Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [niche, setNiche] = useState('');
  const [followers, setFollowers] = useState(1000);
  const [goal, setGoal] = useState('');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0);
    loadProfile();
  }, [headerOpacity, headerTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const loadProfile = async () => {
    try {
      const profile = await storage.getProfile();
      if (profile) {
        setPlatforms(profile.platforms || []);
        setNiche(profile.niche || '');
        setFollowers(profile.followers || 1000);
        setGoal(profile.goal || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const profileData: OnboardingData = {
        platforms,
        niche,
        followers,
        goal,
        completedAt: new Date().toISOString(),
      };

      await storage.saveProfile(profileData);
      
      Alert.alert(
        'Success',
        'Your profile has been updated!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    if (platformId === 'all') {
      setPlatforms(platforms.includes('all') ? [] : ['all']);
    } else {
      setPlatforms(prev => {
        const newPlatforms = prev.filter(p => p !== 'all');
        return prev.includes(platformId)
          ? newPlatforms.filter(p => p !== platformId)
          : [...newPlatforms, platformId];
      });
    }
  };

  const selectNiche = (niche: string) => {
    setNiche(niche);
  };

  const formatFollowers = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundSecondary + '60',
          colors.background,
        ]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <Animated.View style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.glassBorder,
            },
            headerAnimatedStyle
          ]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.glassBackground,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[commonStyles.headerTitle, { flex: 1 }]}>
              Edit Profile
            </Text>
            
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={[
                commonStyles.primaryButton,
                {
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  minWidth: 80,
                },
                loading && { opacity: 0.7 }
              ]}
            >
              <Text style={[commonStyles.primaryButtonText, { fontSize: 14 }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Platforms */}
            <PremiumInputField
              label="Platforms"
              value=""
              onChangeText={() => {}}
              placeholder="Select your platforms"
              icon="globe-outline"
              index={0}
            />
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 32, marginTop: -16 }}>
              {PLATFORMS.map((platform, index) => (
                <PremiumChip
                  key={platform.id}
                  title={platform.name}
                  isSelected={platforms.includes(platform.id)}
                  onPress={() => togglePlatform(platform.id)}
                  index={index}
                  icon={platform.icon}
                />
              ))}
            </View>

            {/* Niche */}
            <PremiumInputField
              label="Niche"
              value={niche}
              onChangeText={setNiche}
              placeholder="Enter your niche"
              icon="trending-up"
              index={1}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 32, marginTop: -16 }}>
              {NICHES.map((nicheOption, index) => (
                <PremiumChip
                  key={nicheOption}
                  title={nicheOption}
                  isSelected={niche === nicheOption}
                  onPress={() => selectNiche(nicheOption)}
                  index={index}
                />
              ))}
            </View>

            {/* Followers */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="people" size={18} color={colors.neonTeal} style={{ marginRight: 8 }} />
                <Text style={[commonStyles.label, { color: colors.text }]}>Followers</Text>
              </View>
              
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={[commonStyles.headerTitle, { 
                  fontSize: 36, 
                  color: colors.neonTeal,
                  marginBottom: 8,
                }]}>
                  {formatFollowers(followers)}
                </Text>
                <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
                  Total Followers
                </Text>
              </View>

              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={10000000}
                value={followers}
                onValueChange={setFollowers}
                minimumTrackTintColor={colors.neonTeal}
                maximumTrackTintColor={colors.backgroundSecondary}
                thumbStyle={{ backgroundColor: colors.neonTeal, width: 24, height: 24 }}
              />
            </View>

            {/* Goal */}
            <PremiumInputField
              label="Goal"
              value={goal}
              onChangeText={setGoal}
              placeholder="What's your main goal?"
              multiline
              icon="target"
              index={2}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
