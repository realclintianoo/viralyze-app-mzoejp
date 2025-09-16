
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedItem, QuotaUsage, OnboardingData } from '../types';

const KEYS = {
  SAVED_ITEMS: 'saved_items',
  QUOTA_USAGE: 'quota_usage',
  ONBOARDING_DATA: 'onboarding_data',
  CHAT_HISTORY: 'chat_history',
};

export const storage = {
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
        return parsed;
      }
      return this.resetQuota();
    } catch (error) {
      console.log('Error getting quota usage:', error);
      return this.resetQuota();
    }
  },

  async resetQuota(): Promise<QuotaUsage> {
    const quota: QuotaUsage = {
      textRequests: 0,
      imageRequests: 0,
      maxTextRequests: 2,
      maxImageRequests: 1,
      resetDate: new Date().toDateString(),
    };
    try {
      await AsyncStorage.setItem(KEYS.QUOTA_USAGE, JSON.stringify(quota));
    } catch (error) {
      console.log('Error resetting quota:', error);
    }
    return quota;
  },

  async updateQuotaUsage(textIncrement: number = 0, imageIncrement: number = 0): Promise<QuotaUsage> {
    try {
      const current = await this.getQuotaUsage();
      const updated = {
        ...current,
        textRequests: current.textRequests + textIncrement,
        imageRequests: current.imageRequests + imageIncrement,
      };
      await AsyncStorage.setItem(KEYS.QUOTA_USAGE, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.log('Error updating quota usage:', error);
      return await this.getQuotaUsage();
    }
  },

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

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.SAVED_ITEMS,
        KEYS.QUOTA_USAGE,
        KEYS.ONBOARDING_DATA,
        KEYS.CHAT_HISTORY,
      ]);
    } catch (error) {
      console.log('Error clearing storage:', error);
    }
  },
};
