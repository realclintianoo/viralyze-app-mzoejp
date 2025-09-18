
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../utils/storage';
import { OnboardingData } from '../../types';
import { commonStyles, colors } from '../../styles/commonStyles';
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

const { width } = Dimensions.get('window');

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin' },
];

const NICHES = [
  'Fitness', 'Fashion', 'Food', 'Travel', 'Tech', 'Lifestyle',
  'Business', 'Education', 'Entertainment', 'Health', 'Beauty',
  'Gaming', 'Music', 'Art', 'Photography', 'Other'
];

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

const PremiumInputField: React.FC<PremiumInputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  icon,
  index,
}) => {
  const fieldOpacity = useSharedValue(0);
  const fieldTranslateY = useSharedValue(30);

  useEffect(() => {
    fieldOpacity.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    fieldTranslateY.value = withDelay(index * 100, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index, fieldOpacity, fieldTranslateY]);

  const fieldAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fieldOpacity.value,
    transform: [{ translateY: fieldTranslateY.value }],
  }));

  return (
    <Animated.View style={[fieldAnimatedStyle, { marginBottom: 24 }]}>
      <Text style={[commonStyles.textBold, { marginBottom: 12, fontSize: 16, opacity: 0.9 }]}>
        {label}
      </Text>
      <LinearGradient
        colors={[colors.glassBackground, colors.glassBackgroundStrong]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 1,
          shadowColor: colors.neuDark,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12,
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
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              borderRadius: 19,
              flexDirection: 'row',
              alignItems: multiline ? 'flex-start' : 'center',
              paddingHorizontal: 20,
              paddingVertical: multiline ? 16 : 18,
            }}
          >
            <Ionicons
              name={icon}
              size={20}
              color={colors.primary}
              style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }}
            />
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              multiline={multiline}
              numberOfLines={multiline ? 3 : 1}
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.text,
                fontWeight: '500',
                minHeight: multiline ? 60 : undefined,
                textAlignVertical: multiline ? 'top' : 'center',
              }}
            />
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
};

const PremiumChip: React.FC<PremiumChipProps> = ({ title, isSelected, onPress, index, icon }) => {
  const chipScale = useSharedValue(1);
  const chipOpacity = useSharedValue(0);
  const chipTranslateX = useSharedValue(20);

  useEffect(() => {
    chipOpacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
    chipTranslateX.value = withDelay(index * 50, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index, chipOpacity, chipTranslateX]);

  const chipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipOpacity.value,
    transform: [
      { translateX: chipTranslateX.value },
      { scale: chipScale.value }
    ],
  }));

  const handlePressIn = () => {
    chipScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    chipScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={chipAnimatedStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
        style={{ marginRight: 12, marginBottom: 12 }}
      >
        <LinearGradient
          colors={isSelected 
            ? [colors.primary, colors.tealPrimary] 
            : [colors.glassBackground, colors.glassBackgroundStrong]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 25,
            padding: 1,
            shadowColor: isSelected ? colors.glowTeal : colors.neuDark,
            shadowOffset: { width: 0, height: isSelected ? 0 : 6 },
            shadowOpacity: isSelected ? 0.6 : 0.2,
            shadowRadius: isSelected ? 15 : 8,
            elevation: isSelected ? 15 : 8,
          }}
        >
          <BlurView
            intensity={15}
            tint="dark"
            style={{
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                backgroundColor: isSelected ? 'transparent' : colors.glassBackgroundStrong,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: isSelected ? colors.glassBorderUltra : colors.glassBorderStrong,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {icon && (
                <Ionicons
                  name={icon}
                  size={16}
                  color={isSelected ? colors.white : colors.primary}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={{
                  color: isSelected ? colors.white : colors.text,
                  fontSize: 14,
                  fontWeight: isSelected ? '700' : '600',
                  letterSpacing: 0.3,
                }}
              >
                {title}
              </Text>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<OnboardingData>({
    platforms: [],
    niche: '',
    followers: 0,
    goal: '',
  });
  const [customNiche, setCustomNiche] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);

  useEffect(() => {
    loadProfile();
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, [headerOpacity, headerTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const loadProfile = async () => {
    try {
      const profileData = await storage.getOnboardingData();
      if (profileData) {
        setProfile(profileData);
        if (!NICHES.includes(profileData.niche)) {
          setCustomNiche(profileData.niche);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!profile.niche && !customNiche) {
      Alert.alert('Error', 'Please select or enter a niche');
      return;
    }

    if (profile.platforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }

    setIsLoading(true);
    
    try {
      const finalProfile = {
        ...profile,
        niche: customNiche || profile.niche,
      };

      await storage.setOnboardingData(finalProfile);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setProfile(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const selectNiche = (niche: string) => {
    setProfile(prev => ({ ...prev, niche }));
    setCustomNiche('');
  };

  const formatFollowers = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <Animated.View style={[headerAnimatedStyle, { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.glassBackgroundStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={[commonStyles.title, { fontSize: 24 }]}>
                Edit Profile
              </Text>
              
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  shadowColor: colors.glowPrimary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                  elevation: 15,
                }}
              >
                <Text style={[commonStyles.buttonText, { fontSize: 14 }]}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Goal Input */}
            <PremiumInputField
              label="Growth Goal"
              value={profile.goal}
              onChangeText={(text) => setProfile(prev => ({ ...prev, goal: text }))}
              placeholder="What's your main goal? (e.g., Build my personal brand)"
              multiline
              icon="target"
              index={0}
            />

            {/* Platforms Section */}
            <View style={{ marginBottom: 32 }}>
              <Text style={[commonStyles.textBold, { marginBottom: 16, fontSize: 16, opacity: 0.9 }]}>
                Platforms
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {PLATFORMS.map((platform, index) => (
                  <PremiumChip
                    key={platform.id}
                    title={platform.name}
                    isSelected={profile.platforms.includes(platform.id)}
                    onPress={() => togglePlatform(platform.id)}
                    index={index}
                    icon={platform.icon as keyof typeof Ionicons.glyphMap}
                  />
                ))}
              </View>
            </View>

            {/* Niche Section */}
            <View style={{ marginBottom: 32 }}>
              <Text style={[commonStyles.textBold, { marginBottom: 16, fontSize: 16, opacity: 0.9 }]}>
                Content Niche
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {NICHES.map((niche, index) => (
                  <PremiumChip
                    key={niche}
                    title={niche}
                    isSelected={profile.niche === niche}
                    onPress={() => selectNiche(niche)}
                    index={index}
                  />
                ))}
              </View>
              
              {/* Custom Niche Input */}
              <PremiumInputField
                label="Or enter custom niche"
                value={customNiche}
                onChangeText={setCustomNiche}
                placeholder="Enter your specific niche..."
                icon="create"
                index={NICHES.length}
              />
            </View>

            {/* Followers Slider */}
            <View style={{ marginBottom: 32 }}>
              <Text style={[commonStyles.textBold, { marginBottom: 16, fontSize: 16, opacity: 0.9 }]}>
                Current Followers: {formatFollowers(profile.followers)}
              </Text>
              
              <LinearGradient
                colors={[colors.glassBackground, colors.glassBackgroundStrong]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                  shadowColor: colors.neuDark,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <Slider
                  style={{ width: '100%', height: 40, marginBottom: 16 }}
                  minimumValue={0}
                  maximumValue={1000000}
                  value={profile.followers}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, followers: Math.round(value) }))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.glassBorder}
                  thumbStyle={{
                    backgroundColor: colors.primary,
                    width: 24,
                    height: 24,
                    shadowColor: colors.glowPrimary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  {[0, 1000, 10000, 100000, 1000000].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setProfile(prev => ({ ...prev, followers: value }))}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor: profile.followers === value ? colors.primary : colors.glassBackground,
                        borderWidth: 1,
                        borderColor: profile.followers === value ? colors.glassBorderUltra : colors.glassBorder,
                      }}
                    >
                      <Text style={{
                        color: profile.followers === value ? colors.white : colors.text,
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        {formatFollowers(value)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
