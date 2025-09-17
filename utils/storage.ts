
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedItem, QuotaUsage, OnboardingData } from '../types';

const KEYS = {
  SAVED_ITEMS: 'saved_items',
  QUOTA_USAGE: 'quota_usage',
  ONBOARDING_DATA: 'onboarding_data',
  CHAT_MESSAGES: 'chat_messages',
};

export const storage = {
  // Generic storage methods
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.log(`Error getting item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log(`Error setting item ${key}:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log(`Error removing item ${key}:`, error);
    }
  },

  // Saved items methods
  async getSavedItems(): Promise<SavedItem[]> {
    try {
      const items = await AsyncStorage.getItem(KEYS.SAVED_ITEMS);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.log('Error getting saved items:', error);
      return [];
    }
  },

  async saveSavedItems(items: SavedItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SAVED_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.log('Error saving items:', error);
    }
  },

  async addSavedItem(item: SavedItem): Promise<void> {
    try {
      const items = await this.getSavedItems();
      items.unshift(item);
      await this.saveSavedItems(items);
    } catch (error) {
      console.log('Error adding saved item:', error);
    }
  },

  async removeSavedItem(id: string): Promise<void> {
    try {
      const items = await this.getSavedItems();
      const filtered = items.filter(item => item.id !== id);
      await this.saveSavedItems(filtered);
    } catch (error) {
      console.log('Error removing saved item:', error);
    }
  },

  // Quota usage methods
  async getQuotaUsage(): Promise<QuotaUsage> {
    try {
      const usage = await AsyncStorage.getItem(KEYS.QUOTA_USAGE);
      if (usage) {
        const parsed = JSON.parse(usage);
        // Check if quota should reset (daily)
        const today = new Date().toDateString();
        if (parsed.resetDate !== today) {
          return this.resetQuota();
        }
        return { text: parsed.text || 0, image: parsed.image || 0 };
      }
      return this.resetQuota();
    } catch (error) {
      console.log('Error getting quota usage:', error);
      return this.resetQuota();
    }
  },

  async resetQuota(): Promise<QuotaUsage> {
    const quota: QuotaUsage = {
      text: 0,
      image: 0,
    };
    try {
      const quotaWithReset = {
        ...quota,
        resetDate: new Date().toDateString(),
      };
      await AsyncStorage.setItem(KEYS.QUOTA_USAGE, JSON.stringify(quotaWithReset));
    } catch (error) {
      console.log('Error resetting quota:', error);
    }
    return quota;
  },

  async updateQuotaUsage(textIncrement: number = 0, imageIncrement: number = 0): Promise<QuotaUsage> {
    try {
      const current = await this.getQuotaUsage();
      const updated = {
        text: current.text + textIncrement,
        image: current.image + imageIncrement,
        resetDate: new Date().toDateString(),
      };
      await AsyncStorage.setItem(KEYS.QUOTA_USAGE, JSON.stringify(updated));
      return { text: updated.text, image: updated.image };
    } catch (error) {
      console.log('Error updating quota usage:', error);
      return await this.getQuotaUsage();
    }
  },

  // Onboarding data methods
  async getOnboardingData(): Promise<OnboardingData | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ONBOARDING_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('Error getting onboarding data:', error);
      return null;
    }
  },

  async saveOnboardingData(data: OnboardingData): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_DATA, JSON.stringify(data));
    } catch (error) {
      console.log('Error saving onboarding data:', error);
    }
  },

  async clearOnboardingData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.ONBOARDING_DATA);
      console.log('Onboarding data cleared');
    } catch (error) {
      console.log('Error clearing onboarding data:', error);
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      console.log('Clearing all storage data...');
      
      // Get all keys and remove them to ensure complete cleanup
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('Found storage keys:', allKeys);
      
      if (allKeys.length > 0) {
        await AsyncStorage.multiRemove(allKeys);
        console.log('All storage keys cleared');
      }
      
      // Also explicitly clear our known keys as backup
      await AsyncStorage.multiRemove([
        KEYS.SAVED_ITEMS,
        KEYS.QUOTA_USAGE,
        KEYS.ONBOARDING_DATA,
        KEYS.CHAT_MESSAGES,
      ]);
      
      console.log('Storage cleared successfully');
    } catch (error) {
      console.log('Error clearing storage:', error);
      throw error;
    }
  },

  // Export data
  async exportData(): Promise<any> {
    try {
      const [savedItems, quotaUsage, onboardingData] = await Promise.all([
        this.getSavedItems(),
        this.getQuotaUsage(),
        this.getOnboardingData(),
      ]);

      return {
        savedItems,
        quotaUsage,
        onboardingData,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.log('Error exporting data:', error);
      return null;
    }
  },
};
