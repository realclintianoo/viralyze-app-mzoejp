
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedItem, QuotaUsage, OnboardingData } from '../types';

const KEYS = {
  ONBOARDING_DATA: 'onboarding_data',
  SAVED_ITEMS: 'saved_items',
  QUOTA_USAGE: 'quota_usage',
  CHAT_MESSAGES: 'chat_messages',
};

export const storage = {
  // Onboarding data
  async getOnboardingData(): Promise<OnboardingData | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ONBOARDING_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  },

  async setOnboardingData(data: OnboardingData): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting onboarding data:', error);
    }
  },

  // Alias for backward compatibility
  async saveOnboardingData(data: OnboardingData): Promise<void> {
    return this.setOnboardingData(data);
  },

  // Saved items
  async getSavedItems(): Promise<SavedItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting saved items:', error);
      return [];
    }
  },

  async setSavedItems(items: SavedItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SAVED_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error setting saved items:', error);
    }
  },

  async addSavedItem(item: SavedItem): Promise<void> {
    try {
      const currentItems = await this.getSavedItems();
      const updatedItems = [item, ...currentItems];
      await this.setSavedItems(updatedItems);
    } catch (error) {
      console.error('Error adding saved item:', error);
    }
  },

  async removeSavedItem(id: string): Promise<void> {
    try {
      const currentItems = await this.getSavedItems();
      const updatedItems = currentItems.filter(item => item.id !== id);
      await this.setSavedItems(updatedItems);
    } catch (error) {
      console.error('Error removing saved item:', error);
    }
  },

  // Quota usage
  async getQuotaUsage(): Promise<QuotaUsage> {
    try {
      const data = await AsyncStorage.getItem(KEYS.QUOTA_USAGE);
      const today = new Date().toISOString().split('T')[0];
      
      if (data) {
        const quota = JSON.parse(data);
        // Reset quota if it's a new day
        if (quota.resetDate !== today) {
          const resetQuota = {
            textRequests: 0,
            imageRequests: 0,
            maxTextRequests: 2,
            maxImageRequests: 1,
            resetDate: today,
          };
          await this.setQuotaUsage(resetQuota);
          return resetQuota;
        }
        return quota;
      }
      
      // Default quota for new users
      const defaultQuota = {
        textRequests: 0,
        imageRequests: 0,
        maxTextRequests: 2,
        maxImageRequests: 1,
        resetDate: today,
      };
      await this.setQuotaUsage(defaultQuota);
      return defaultQuota;
    } catch (error) {
      console.error('Error getting quota usage:', error);
      return {
        textRequests: 0,
        imageRequests: 0,
        maxTextRequests: 2,
        maxImageRequests: 1,
        resetDate: new Date().toISOString().split('T')[0],
      };
    }
  },

  async setQuotaUsage(quota: QuotaUsage): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.QUOTA_USAGE, JSON.stringify(quota));
    } catch (error) {
      console.error('Error setting quota usage:', error);
    }
  },

  async incrementQuotaUsage(type: 'text' | 'image'): Promise<void> {
    try {
      const currentQuota = await this.getQuotaUsage();
      const updatedQuota = {
        ...currentQuota,
        [type === 'text' ? 'textRequests' : 'imageRequests']: 
          currentQuota[type === 'text' ? 'textRequests' : 'imageRequests'] + 1,
      };
      await this.setQuotaUsage(updatedQuota);
    } catch (error) {
      console.error('Error incrementing quota usage:', error);
    }
  },

  // Chat messages
  async getChatMessages(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  },

  async setChatMessages(messages: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error setting chat messages:', error);
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },

  // Get all data for export
  async getAllData(): Promise<any> {
    try {
      const [onboardingData, savedItems, quotaUsage, chatMessages] = await Promise.all([
        this.getOnboardingData(),
        this.getSavedItems(),
        this.getQuotaUsage(),
        this.getChatMessages(),
      ]);

      return {
        onboardingData,
        savedItems,
        quotaUsage,
        chatMessages,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting all data:', error);
      return null;
    }
  },
};
