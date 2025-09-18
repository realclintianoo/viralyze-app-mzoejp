
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { SavedItem } from '../../types';
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

interface PremiumCategoryChipProps {
  category: typeof CATEGORIES[0];
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

interface PremiumSavedItemProps {
  item: SavedItem;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' as keyof typeof Ionicons.glyphMap, gradient: [colors.primary, colors.gradientEnd] },
  { id: 'hook', label: 'Hooks', icon: 'flash' as keyof typeof Ionicons.glyphMap, gradient: colors.hookGradient },
  { id: 'script', label: 'Scripts', icon: 'document-text' as keyof typeof Ionicons.glyphMap, gradient: colors.scriptGradient },
  { id: 'caption', label: 'Captions', icon: 'text' as keyof typeof Ionicons.glyphMap, gradient: colors.captionGradient },
  { id: 'calendar', label: 'Calendars', icon: 'calendar' as keyof typeof Ionicons.glyphMap, gradient: colors.calendarGradient },
  { id: 'rewrite', label: 'Rewrites', icon: 'repeat' as keyof typeof Ionicons.glyphMap, gradient: colors.rewriterGradient },
  { id: 'image', label: 'Images', icon: 'image' as keyof typeof Ionicons.glyphMap, gradient: colors.imageGradient },
];

const PremiumCategoryChip: React.FC<PremiumCategoryChipProps> = ({
  category,
  isSelected,
  onPress,
  index,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 15, stiffness: 200 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isSelected ? category.gradient : [colors.glassBackground, colors.glassBackgroundStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 1,
            shadowColor: isSelected ? category.gradient[0] : colors.neuDark,
            shadowOffset: { width: 0, height: isSelected ? 0 : 6 },
            shadowOpacity: isSelected ? 0.6 : 0.2,
            shadowRadius: isSelected ? 12 : 8,
            elevation: isSelected ? 12 : 6,
          }}
        >
          <BlurView
            intensity={isSelected ? 30 : 20}
            tint="dark"
            style={{
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : colors.glassBackground,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: 'center',
                minWidth: 80,
                borderWidth: 1,
                borderColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : colors.glassBorder,
                borderRadius: 20,
              }}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={isSelected ? colors.white : colors.text}
                style={{ marginBottom: 4 }}
              />
              <Text
                style={{
                  color: isSelected ? colors.white : colors.text,
                  fontSize: 12,
                  fontWeight: isSelected ? '800' : '600',
                  letterSpacing: 0.3,
                }}
              >
                {category.label}
              </Text>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PremiumSavedItem: React.FC<PremiumSavedItemProps> = ({
  item,
  index,
  onPress,
  onDelete,
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
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleDelete = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const getItemIcon = (type: SavedItem['type']) => {
    const iconMap = {
      hook: 'flash',
      script: 'document-text',
      caption: 'text',
      calendar: 'calendar',
      rewrite: 'repeat',
      image: 'image',
    };
    return iconMap[type] as keyof typeof Ionicons.glyphMap;
  };

  const getItemGradient = (type: SavedItem['type']) => {
    const gradientMap = {
      hook: colors.hookGradient,
      script: colors.scriptGradient,
      caption: colors.captionGradient,
      calendar: colors.calendarGradient,
      rewrite: colors.rewriterGradient,
      image: colors.imageGradient,
    };
    return gradientMap[type];
  };

  return (
    <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.glassBackground, colors.glassBackgroundStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 1,
            shadowColor: colors.neuDark,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
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
                borderWidth: 1,
                borderColor: colors.glassBorderStrong,
                borderRadius: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <LinearGradient
                  colors={getItemGradient(item.type)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    shadowColor: getItemGradient(item.type)[0],
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                >
                  <Ionicons name={getItemIcon(item.type)} size={24} color={colors.white} />
                </LinearGradient>

                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.textBold, { fontSize: 17, marginBottom: 6 }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[commonStyles.textSmall, { opacity: 0.7, marginBottom: 8 }]}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  
                  {/* Preview content */}
                  <Text style={[commonStyles.textSmall, { opacity: 0.6, lineHeight: 18 }]} numberOfLines={2}>
                    {typeof item.payload.content === 'string' 
                      ? item.payload.content 
                      : JSON.stringify(item.payload).substring(0, 100) + '...'
                    }
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleDelete}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: colors.backgroundTertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 12,
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SavedScreen() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(20);

  useEffect(() => {
    loadSavedItems();
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    searchOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    searchTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
  }));

  const filterItems = useCallback(() => {
    let filtered = savedItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.type === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        JSON.stringify(item.payload).toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  }, [savedItems, selectedCategory, searchQuery]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const loadSavedItems = async () => {
    try {
      const items = await storage.getSavedItems();
      setSavedItems(items);
    } catch (error) {
      console.log('Error loading saved items:', error);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemPress = (item: SavedItem) => {
    Alert.alert(
      item.title,
      typeof item.payload.content === 'string' ? item.payload.content : JSON.stringify(item.payload, null, 2),
      [
        { text: 'Copy', onPress: () => copyItem(item) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const copyItem = async (item: SavedItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Content copied to clipboard');
  };

  const deleteItem = async (id: string) => {
    try {
      await storage.removeSavedItem(id);
      setSavedItems(prev => prev.filter(item => item.id !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
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
          <View>
            <Text style={commonStyles.headerTitle}>Saved</Text>
            <Text style={[commonStyles.textSmall, { opacity: 0.7, marginTop: 4 }]}>
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[{ paddingHorizontal: 20, marginBottom: 20 }, searchAnimatedStyle]}>
          <LinearGradient
            colors={[colors.glassBackground, colors.glassBackgroundStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 1,
              shadowColor: colors.neuDark,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <View
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text,
                    paddingVertical: 12,
                    fontWeight: '500',
                  }}
                  placeholder="Search saved content..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 80, marginBottom: 20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          {CATEGORIES.map((category, index) => (
            <PremiumCategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategoryPress(category.id)}
              index={index}
            />
          ))}
        </ScrollView>

        {/* Items */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <LinearGradient
                colors={[colors.glassBackground, colors.glassBackgroundStrong]}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  shadowColor: colors.neuDark,
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.3,
                  shadowRadius: 24,
                  elevation: 16,
                }}
              >
                <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
              </LinearGradient>
              
              <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 8 }]}>
                {searchQuery || selectedCategory !== 'all' ? 'No items found' : 'No saved content yet'}
              </Text>
              <Text style={[commonStyles.textSmall, { textAlign: 'center', opacity: 0.7, maxWidth: 280 }]}>
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter to find what you&apos;re looking for'
                  : 'Save content from Chat or Tools to see it here. Your saved items will appear in this beautiful collection.'
                }
              </Text>
            </View>
          ) : (
            <View>
              {filteredItems.map((item, index) => (
                <PremiumSavedItem
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() => handleItemPress(item)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
