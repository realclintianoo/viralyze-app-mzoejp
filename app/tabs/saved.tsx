
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
import { commonStyles, colors } from '../../styles/commonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { storage } from '../../utils/storage';
import { SavedItem } from '../../types';
import AnimatedCard from '../../components/AnimatedCard';

const CATEGORIES = [
  { id: 'all', title: 'All', icon: 'apps' as const },
  { id: 'hook', title: 'Hooks', icon: 'flash' as const },
  { id: 'script', title: 'Scripts', icon: 'document-text' as const },
  { id: 'caption', title: 'Captions', icon: 'text' as const },
  { id: 'calendar', title: 'Calendars', icon: 'calendar' as const },
  { id: 'rewrite', title: 'Rewrites', icon: 'repeat' as const },
  { id: 'image', title: 'Images', icon: 'image' as const },
];

export default function SavedScreen() {
  const { user, isGuest } = useAuth();
  const { showToast } = useToast();
  
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSavedItems = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isGuest) {
        const localItems = await storage.getSavedItems();
        setSavedItems(localItems);
      } else if (user) {
        const { data, error } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading saved items:', error);
          showToast('Failed to load saved items', 'error');
        } else {
          setSavedItems(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
      showToast('Failed to load saved items', 'error');
    } finally {
      setLoading(false);
    }
  }, [isGuest, user, showToast]);

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
    const content = item.type === 'image' 
      ? item.payload.imageUrl || item.payload.content
      : item.payload.content;
    
    await Clipboard.setStringAsync(content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Copied to clipboard!', 'success');
  };

  const deleteItem = async (id: string | number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this saved item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isGuest) {
                const updatedItems = savedItems.filter(item => item.id !== id);
                await storage.setSavedItems(updatedItems);
                setSavedItems(updatedItems);
              } else if (user) {
                const { error } = await supabase
                  .from('saved_items')
                  .delete()
                  .eq('id', id);

                if (error) {
                  showToast('Failed to delete item', 'error');
                } else {
                  setSavedItems(prev => prev.filter(item => item.id !== id));
                  showToast('Item deleted', 'success');
                }
              }
              
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const renderItem = (item: SavedItem, index: number) => (
    <AnimatedCard
      key={item.id}
      delay={index * 50}
      style={styles.itemCard}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Ionicons
            name={getItemIcon(item.type)}
            size={20}
            color={colors.accent}
            style={styles.itemIcon}
          />
          <View style={styles.itemMeta}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      {item.type === 'image' ? (
        <View style={styles.imagePreview}>
          <Ionicons name="image" size={32} color={colors.grey} />
          <Text style={styles.imageUrl} numberOfLines={2}>
            {item.payload.imageUrl || 'Generated Image'}
          </Text>
        </View>
      ) : (
        <Text style={styles.itemContent} numberOfLines={3}>
          {item.payload.content}
        </Text>
      )}

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => copyItem(item)}
        >
          <Ionicons name="copy" size={16} color={colors.accent} />
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        
        <View style={styles.itemType}>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.itemCount}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.grey} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved items..."
            placeholderTextColor={colors.grey}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.grey} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
              selectedCategory === category.id && styles.categoryChipSelected,
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
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected,
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading saved items...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={colors.grey} />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'No items found' 
                : 'No saved items yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start generating content and save your favorites here'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map((item, index) => renderItem(item, index))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  itemCount: {
    fontSize: 14,
    color: colors.grey,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: colors.accent,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  categoryTextSelected: {
    color: colors.white,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.grey,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  itemIcon: {
    marginRight: 8,
  },
  itemMeta: {
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
  deleteButton: {
    padding: 4,
  },
  itemContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  imagePreview: {
    alignItems: 'center' as const,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  imageUrl: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  itemActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  itemType: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 10,
    color: colors.grey,
    fontWeight: '600' as const,
  },
};
