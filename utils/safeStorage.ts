
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In-memory fallback storage for when AsyncStorage/localStorage is unavailable
class InMemoryStorage {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

// Storage interface for consistent API
interface SafeStorageInterface {
  loadJSON<T>(key: string, fallback: T): Promise<T>;
  saveJSON<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

// Detect available storage
const getStorageEngine = () => {
  try {
    if (Platform.OS === 'web') {
      // Check if localStorage is available (not in incognito/restricted mode)
      if (typeof window !== 'undefined' && window.localStorage) {
        // Test if we can actually use localStorage
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        return {
          async getItem(key: string): Promise<string | null> {
            try {
              return window.localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          async setItem(key: string, value: string): Promise<void> {
            try {
              window.localStorage.setItem(key, value);
            } catch {
              // Silently fail if storage is full or restricted
            }
          },
          async removeItem(key: string): Promise<void> {
            try {
              window.localStorage.removeItem(key);
            } catch {
              // Silently fail
            }
          },
        };
      }
    } else {
      // Use AsyncStorage for native platforms
      return AsyncStorage;
    }
  } catch (error) {
    console.log('Storage detection failed, using in-memory fallback:', error);
  }
  
  // Fallback to in-memory storage
  return new InMemoryStorage();
};

// Initialize storage engine
const storageEngine = getStorageEngine();

// Safe JSON parsing with fallback
const safeJSONParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null ? parsed : fallback;
  } catch (error) {
    console.log('JSON parse error, using fallback:', error);
    return fallback;
  }
};

// Safe JSON stringifying
const safeJSONStringify = <T>(value: T): string => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.log('JSON stringify error:', error);
    return '{}';
  }
};

// Main SafeStorage implementation
export const safeStorage: SafeStorageInterface = {
  async loadJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      const jsonString = await storageEngine.getItem(key);
      return safeJSONParse(jsonString, fallback);
    } catch (error) {
      console.log(`SafeStorage loadJSON error for key "${key}":`, error);
      return fallback;
    }
  },

  async saveJSON<T>(key: string, value: T): Promise<void> {
    try {
      const jsonString = safeJSONStringify(value);
      await storageEngine.setItem(key, jsonString);
    } catch (error) {
      console.log(`SafeStorage saveJSON error for key "${key}":`, error);
      // Don't throw - fail silently to prevent app crashes
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await storageEngine.removeItem(key);
    } catch (error) {
      console.log(`SafeStorage remove error for key "${key}":`, error);
      // Don't throw - fail silently
    }
  },
};

// Storage availability check
export const checkStorageAvailability = async (): Promise<{
  available: boolean;
  type: 'AsyncStorage' | 'localStorage' | 'inMemory';
  error?: string;
}> => {
  try {
    const testKey = '__storage_availability_test__';
    const testValue = { test: true, timestamp: Date.now() };
    
    await safeStorage.saveJSON(testKey, testValue);
    const retrieved = await safeStorage.loadJSON(testKey, null);
    await safeStorage.remove(testKey);
    
    const isWorking = retrieved && retrieved.test === true;
    
    return {
      available: isWorking,
      type: Platform.OS === 'web' ? 
        (typeof window !== 'undefined' && window.localStorage ? 'localStorage' : 'inMemory') : 
        'AsyncStorage',
    };
  } catch (error) {
    return {
      available: false,
      type: 'inMemory',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
