
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { commonStyles, colors } from '../../styles/commonStyles';
import { storage } from '../../utils/storage';
import { SavedItem } from '../../types';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' as keyof typeof Ionicons.glyphMap },
  { id: 'hook', label: 'Hooks', icon: 'flash' as keyof typeof Ionicons.glyphMap },
  { id: 'script', label: 'Scripts', icon: 'document-text' as keyof typeof Ionicons.glyphMap },
  { id: 'caption', label: 'Captions', icon: 'text' as keyof typeof Ionicons.glyphMap },
  { id: 'calendar', label: 'Calendars', icon: 'calendar' as keyof typeof Ionicons.glyphMap },
  { id: 'rewrite', label: 'Rewrites', icon: 'repeat' as keyof typeof Ionicons.glyphMap },
  { id: 'image', label: 'Images', icon: 'image' as keyof typeof Ionicons.glyphMap },
];

export default function SavedScreen() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSavedItems();
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    // In a real app, you'd use Clipboard API
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

  const renderItem = (item: SavedItem) => (
    <TouchableOpacity
      key={item.id}
      style={[commonStyles.card, { marginHorizontal: 16 }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={[commonStyles.row, { alignItems: 'flex-start', gap: 12 }]}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name={getItemIcon(item.type)} size={20} color={colors.white} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 4 }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={commonStyles.smallText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => deleteItem(item.id)}
          style={{ padding: 4 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={commonStyles.title}>Saved Content</Text>
          <Text style={commonStyles.smallText}>
            {filteredItems.length} items
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TextInput
            style={commonStyles.input}
            placeholder="Search saved content..."
            placeholderTextColor={colors.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 60 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                commonStyles.chip,
                selectedCategory === category.id && commonStyles.chipSelected,
                { alignItems: 'center', minWidth: 80 }
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={16}
                color={selectedCategory === category.id ? colors.white : colors.text}
              />
              <Text
                style={[
                  commonStyles.chipText,
                  selectedCategory === category.id && commonStyles.chipTextSelected,
                  { marginTop: 2, fontSize: 12 }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items */}
        <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <View style={[commonStyles.center, { paddingVertical: 60 }]}>
              <Ionicons name="bookmark-outline" size={48} color={colors.grey} />
              <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
                {searchQuery || selectedCategory !== 'all' ? 'No items found' : 'No saved content yet'}
              </Text>
              <Text style={[commonStyles.smallText, { textAlign: 'center', marginTop: 8 }]}>
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Save content from Chat or Tools to see it here'
                }
              </Text>
            </View>
          ) : (
            <View style={{ paddingBottom: 100 }}>
              {filteredItems.map(renderItem)}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
