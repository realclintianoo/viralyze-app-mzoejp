
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { storage } from '../../utils/storage';
import { supabase } from '../../app/integrations/supabase/client';
import { SavedItem } from '../../types';
import { commonStyles, colors } from '../../styles/commonStyles';

import AnimatedCard from '../../components/AnimatedCard';

const CATEGORIES = [
  { id: 'all', title: 'All', icon: 'apps' },
  { id: 'hook', title: 'Hooks', icon: 'flash' },
  { id: 'script', title: 'Scripts', icon: 'videocam' },
  { id: 'caption', title: 'Captions', icon: 'text' },
  { id: 'calendar', title: 'Calendars', icon: 'calendar' },
  { id: 'rewrite', title: 'Rewrites', icon: 'repeat' },
  { id: 'image', title: 'Images', icon: 'image' },
];

const SavedScreen = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const { user, isGuest } = useAuth();
  const { showToast } = useToast();

  const loadSavedItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Always load from local storage first (offline-first)
      const localItems = await storage.getSavedItems();
      setSavedItems(localItems);

      // If user is authenticated, sync with Supabase
      if (!isGuest && user) {
        setSyncing(true);
        try {
          const { data: remoteItems, error } = await supabase
            .from('saved_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading remote items:', error);
            showToast('Failed to sync with cloud', 'warning');
          } else if (remoteItems) {
            // Merge remote items with local items (remote takes precedence)
            const mergedItems = mergeItems(localItems, remoteItems);
            setSavedItems(mergedItems);
            await storage.setSavedItems(mergedItems);
          }
        } catch (error) {
          console.error('Sync error:', error);
        } finally {
          setSyncing(false);
        }
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
      showToast('Error loading saved items', 'error');
    } finally {
      setLoading(false);
    }
  }, [isGuest, user, showToast]);

  const mergeItems = (localItems: SavedItem[], remoteItems: any[]): SavedItem[] => {
    const itemMap = new Map();
    
    // Add local items first
    localItems.forEach(item => {
      itemMap.set(item.id, item);
    });

    // Add/update with remote items
    remoteItems.forEach(item => {
      itemMap.set(item.id, {
        id: item.id,
        user_id: item.user_id,
        type: item.type,
        title: item.title,
        payload: item.payload,
        created_at: item.created_at,
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const filterItems = useCallback(() => {
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
  }, [savedItems, selectedCategory, searchQuery]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const copyItem = async (item: SavedItem) => {
    try {
      const content = typeof item.payload.content === 'string' 
        ? item.payload.content 
        : JSON.stringify(item.payload.content);
      
      await Clipboard.setStringAsync(content);
      showToast('Copied to clipboard', 'success');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  const deleteItem = async (id: string | number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update
              const updatedItems = savedItems.filter(item => item.id !== id);
              setSavedItems(updatedItems);
              await storage.setSavedItems(updatedItems);

              // Delete from Supabase if authenticated
              if (!isGuest && user) {
                const { error } = await supabase
                  .from('saved_items')
                  .delete()
                  .eq('id', id)
                  .eq('user_id', user.id);

                if (error) {
                  console.error('Error deleting from Supabase:', error);
                  // Revert optimistic update
                  setSavedItems(savedItems);
                  await storage.setSavedItems(savedItems);
                  showToast('Failed to delete from cloud', 'error');
                } else {
                  showToast('Item deleted', 'success');
                }
              } else {
                showToast('Item deleted', 'success');
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting item:', error);
              showToast('Failed to delete item', 'error');
            }
          },
        },
      ]
    );
  };

  const getItemIcon = (type: SavedItem['type']) => {
    const category = CATEGORIES.find(cat => cat.id === type);
    return category?.icon || 'document';
  };

  const renderItem = (item: SavedItem, index: number) => {
    const isImage = item.type === 'image';
    const content = typeof item.payload.content === 'string' 
      ? item.payload.content 
      : JSON.stringify(item.payload.content);

    return (
      <AnimatedCard key={item.id} delay={index * 50} style={styles.itemCard}>
        <TouchableOpacity
          style={styles.itemContent}
          onLongPress={() => copyItem(item)}
          delayLongPress={500}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemLeft}>
              <Ionicons 
                name={getItemIcon(item.type) as any} 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteItem(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>

          {isImage ? (
            <View style={styles.imagePreview}>
              <Text style={styles.imageUrl} numberOfLines={2}>
                {content}
              </Text>
            </View>
          ) : (
            <Text style={styles.itemContent} numberOfLines={3}>
              {content}
            </Text>
          )}

          <View style={styles.itemFooter}>
            <Text style={styles.itemDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyItem(item)}
            >
              <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        {syncing && (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.syncText}>Syncing...</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved items..."
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? colors.background : colors.primary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected,
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items */}
      <ScrollView
        style={styles.itemsContainer}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No saved items</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim() 
                ? 'No items match your search'
                : 'Start creating content to see your saved items here'
              }
            </Text>
          </View>
        ) : (
          filteredItems.map((item, index) => renderItem(item, index))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  categoriesContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  categoryTextSelected: {
    color: colors.background,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemCard: {
    marginBottom: 16,
  },
  itemContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  itemText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  imagePreview: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  imageUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SavedScreen;
