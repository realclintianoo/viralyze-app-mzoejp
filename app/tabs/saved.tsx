
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storage } from '../../utils/storage';
import { commonStyles, colors, spacing, borderRadius } from '../../styles/commonStyles';
import { SavedItem } from '../../types';

const CATEGORIES = [
  { id: 'all', title: 'All', icon: 'apps' },
  { id: 'hook', title: 'Hooks', icon: 'flash' },
  { id: 'script', title: 'Scripts', icon: 'document-text' },
  { id: 'caption', title: 'Captions', icon: 'text' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar' },
  { id: 'rewrite', title: 'Rewrites', icon: 'repeat' },
  { id: 'image', title: 'Images', icon: 'image' },
];

export default function SavedScreen() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSavedItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [savedItems, selectedCategory, searchQuery]);

  const loadSavedItems = async () => {
    try {
      const items = await storage.getSavedItems();
      setSavedItems(items);
    } catch (error) {
      console.log('Error loading saved items:', error);
    }
  };

  const filterItems = () => {
    let filtered = savedItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.type === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (typeof item.payload.content === 'string' && 
         item.payload.content.toLowerCase().includes(query))
      );
    }

    setFilteredItems(filtered);
  };

  const handleCategoryPress = async (categoryId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  };

  const handleItemPress = (item: SavedItem) => {
    Alert.alert(
      item.title,
      typeof item.payload.content === 'string' ? item.payload.content : 'Content preview not available',
      [
        { text: 'Copy', onPress: () => copyItem(item) },
        { text: 'Rename', onPress: () => renameItem(item) },
        { text: 'Delete', onPress: () => deleteItem(item.id), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const copyItem = async (item: SavedItem) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Content copied to clipboard');
  };

  const renameItem = (item: SavedItem) => {
    Alert.prompt(
      'Rename Item',
      'Enter a new title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newTitle) => {
            if (newTitle && newTitle.trim()) {
              try {
                await storage.updateSavedItem(item.id, { title: newTitle.trim() });
                await loadSavedItems();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                console.log('Error renaming item:', error);
                Alert.alert('Error', 'Failed to rename item');
              }
            }
          },
        },
      ],
      'plain-text',
      item.title
    );
  };

  const deleteItem = async (id: string) => {
    try {
      await storage.removeSavedItem(id);
      await loadSavedItems();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const getItemIcon = (type: SavedItem['type']) => {
    const category = CATEGORIES.find(cat => cat.id === type);
    return category?.icon || 'document';
  };

  const renderItem = ({ item }: { item: SavedItem }) => {
    const preview = typeof item.payload.content === 'string' 
      ? item.payload.content.substring(0, 100) + (item.payload.content.length > 100 ? '...' : '')
      : 'Content preview not available';

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemIconContainer}>
            <Ionicons name={getItemIcon(item.type) as any} size={20} color={colors.accent} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.itemPreview} numberOfLines={2}>
          {preview}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bookmark-outline" size={48} color={colors.grey} />
      </View>
      <Text style={styles.emptyTitle}>No saved items</Text>
      <Text style={styles.emptyDescription}>
        {selectedCategory === 'all' 
          ? 'Start saving your favorite AI-generated content'
          : `No ${selectedCategory}s saved yet`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[commonStyles.h1, styles.headerTitle]}>Saved</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.grey} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search saved items..."
              placeholderTextColor={colors.grey}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color={colors.grey} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? colors.white : colors.text}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items List */}
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.itemsList}
          contentContainerStyle={[
            styles.itemsContent,
            { paddingBottom: 120 } // Account for tab bar
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryIcon: {
    marginRight: spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.white,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: colors.grey,
  },
  typeBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  itemPreview: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
};
