
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedItem, QuotaUsage, OnboardingData, ChatMessage } from '../types';

const KEYS = {
  SAVED_ITEMS: 'saved_items',
  QUOTA_USAGE: 'quota_usage',
  ONBOARDING_DATA: 'onboarding_data',
  CHAT_HISTORY: 'chat_history',
  USER_PREFERENCES: 'user_preferences',
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

  async updateSavedItem(id: string, updates: Partial<SavedItem>): Promise<void> {
    try {
      const items = await this.getSavedItems();
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        await this.saveSavedItems(items);
      }
    } catch (error) {
      console.log('Error updating saved item:', error);
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

  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const history = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.log('Error getting chat history:', error);
      return [];
    }
  },

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      // Keep only last 50 messages to prevent storage bloat
      const trimmed = messages.slice(-50);
      await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
    } catch (error) {
      console.log('Error saving chat history:', error);
    }
  },

  async getUserPreferences(): Promise<any> {
    try {
      const prefs = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        hapticsEnabled: true,
        reducedMotion: false,
      };
    } catch (error) {
      console.log('Error getting user preferences:', error);
      return {
        hapticsEnabled: true,
        reducedMotion: false,
      };
    }
  },

  async saveUserPreferences(preferences: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.log('Error saving user preferences:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.SAVED_ITEMS,
        KEYS.QUOTA_USAGE,
        KEYS.ONBOARDING_DATA,
        KEYS.CHAT_HISTORY,
        KEYS.USER_PREFERENCES,
      ]);
    } catch (error) {
      console.log('Error clearing storage:', error);
    }
  },

  async exportData(): Promise<string> {
    try {
      const [savedItems, quotaUsage, onboardingData, chatHistory, preferences] = await Promise.all([
        this.getSavedItems(),
        this.getQuotaUsage(),
        this.getOnboardingData(),
        this.getChatHistory(),
        this.getUserPreferences(),
      ]);

      const exportData = {
        savedItems,
        quotaUsage,
        onboardingData,
        chatHistory,
        preferences,
        exportDate: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.log('Error exporting data:', error);
      throw error;
    }
  },
};
