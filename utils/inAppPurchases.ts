
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Graceful import with fallback
let InAppPurchases: any = null;
let isModuleAvailable = false;

// Check if we're in a development environment or on web
const isDevelopmentEnvironment = __DEV__ || Platform.OS === 'web' || !Constants.isDevice;

if (!isDevelopmentEnvironment) {
  try {
    // Use require instead of dynamic import to avoid top-level await
    InAppPurchases = require('expo-in-app-purchases');
    
    // Verify the module has the expected API
    if (InAppPurchases && typeof InAppPurchases.connectAsync === 'function') {
      isModuleAvailable = true;
      console.log('✅ expo-in-app-purchases loaded successfully');
    } else {
      console.warn('⚠️ expo-in-app-purchases module loaded but missing expected functions');
      isModuleAvailable = false;
    }
  } catch (error: any) {
    console.warn('⚠️ expo-in-app-purchases not available, using mock implementation:', error.message);
    isModuleAvailable = false;
    InAppPurchases = null;
  }
} else {
  console.log('📱 Development environment detected - using mock in-app purchases');
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
}

export interface Product {
  productId: string;
  price: string;
  title: string;
  description: string;
}

class InAppPurchaseManager {
  private isInitialized = false;
  private useMockImplementation = isDevelopmentEnvironment || !isModuleAvailable;

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      if (this.useMockImplementation) {
        console.log('📱 In-app purchases: Using mock implementation');
        this.isInitialized = true;
        return true;
      }

      if (!isModuleAvailable || !InAppPurchases) {
        console.log('📱 In-app purchases: Module not available - falling back to mock');
        this.useMockImplementation = true;
        this.isInitialized = true;
        return true;
      }

      await InAppPurchases.connectAsync();
      this.isInitialized = true;
      console.log('✅ In-app purchases initialized successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to initialize in-app purchases:', error.message);
      // Fall back to mock mode if initialization fails
      this.useMockImplementation = true;
      this.isInitialized = true;
      return true;
    }
  }

  async getProducts(productIds: string[]): Promise<Product[]> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize in-app purchases');
        }
      }

      if (this.useMockImplementation) {
        // Return mock products for development or when module is unavailable
        return productIds.map(productId => ({
          productId,
          price: productId === PRODUCT_IDS.PRO_YEARLY ? '$59.99' : '$9.99',
          title: productId === PRODUCT_IDS.PRO_YEARLY ? 'VIRALYZE Pro (Yearly)' : 'VIRALYZE Pro (Monthly)',
          description: 'Unlimited AI generation and premium features',
        }));
      }

      const { results } = await InAppPurchases.getProductsAsync(productIds);
      
      return results.map((product: any) => ({
        productId: product.productId,
        price: product.price || '$0.00',
        title: product.title || product.productId,
        description: product.description || '',
      }));
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Failed to initialize in-app purchases',
          };
        }
      }

      if (this.useMockImplementation) {
        // Mock purchase for development or when module is unavailable
        console.log(`🛒 Mock purchase: ${productId}`);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              productId,
            });
          }, 1500); // Simulate network delay
        });
      }

      // Check if products are available
      const products = await this.getProducts([productId]);
      if (products.length === 0) {
        return {
          success: false,
          error: 'Product not available',
        };
      }

      // Attempt purchase
      const result = await InAppPurchases.purchaseItemAsync(productId);
      
      if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
        return {
          success: true,
          productId,
        };
      } else {
        return {
          success: false,
          error: this.getErrorMessage(result.responseCode),
        };
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Failed to initialize in-app purchases',
          };
        }
      }

      if (this.useMockImplementation) {
        // Mock restore for development or when module is unavailable
        console.log('🔄 Mock restore purchases');
        return new Promise((resolve) => {
          setTimeout(() => {
            // Randomly succeed or fail for testing
            const hasRestorablePurchases = Math.random() > 0.5;
            resolve({
              success: hasRestorablePurchases,
              productId: hasRestorablePurchases ? PRODUCT_IDS.PRO_YEARLY : undefined,
              error: hasRestorablePurchases ? undefined : 'No purchases to restore',
            });
          }, 1000);
        });
      }

      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (results.length > 0) {
        // Process restored purchases
        const activePurchases = results.filter((purchase: any) => 
          purchase.acknowledged === false || purchase.purchaseState === InAppPurchases.IAPPurchaseState.PURCHASED
        );

        if (activePurchases.length > 0) {
          return {
            success: true,
            productId: activePurchases[0].productId,
          };
        }
      }

      return {
        success: false,
        error: 'No purchases to restore',
      };
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  private getErrorMessage(responseCode: any): string {
    if (!isModuleAvailable) {
      return 'In-app purchases not available in development';
    }

    if (!InAppPurchases?.IAPResponseCode) {
      return 'Purchase service unavailable';
    }

    try {
      switch (responseCode) {
        case InAppPurchases.IAPResponseCode.USER_CANCELED:
          return 'Purchase was cancelled';
        case InAppPurchases.IAPResponseCode.PAYMENT_INVALID:
          return 'Payment method is invalid';
        case InAppPurchases.IAPResponseCode.PAYMENT_NOT_ALLOWED:
          return 'Payment not allowed';
        case InAppPurchases.IAPResponseCode.ITEM_UNAVAILABLE:
          return 'Item is not available';
        case InAppPurchases.IAPResponseCode.UNKNOWN:
          return 'Unknown error occurred';
        case InAppPurchases.IAPResponseCode.SERVICE_UNAVAILABLE:
          return 'Service is unavailable';
        case InAppPurchases.IAPResponseCode.BILLING_UNAVAILABLE:
          return 'Billing is unavailable';
        case InAppPurchases.IAPResponseCode.ITEM_ALREADY_OWNED:
          return 'Item is already owned';
        case InAppPurchases.IAPResponseCode.ITEM_NOT_OWNED:
          return 'Item is not owned';
        case InAppPurchases.IAPResponseCode.ERROR:
        default:
          return 'An error occurred during purchase';
      }
    } catch (error) {
      return 'Purchase service error';
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.useMockImplementation && isModuleAvailable && InAppPurchases) {
        await InAppPurchases.disconnectAsync();
      }
      this.isInitialized = false;
      console.log('📱 In-app purchases disconnected');
    } catch (error) {
      console.error('Failed to disconnect in-app purchases:', error);
    }
  }
}

export const inAppPurchaseManager = new InAppPurchaseManager();

// Product IDs
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
} as const;

// Helper functions
export const showPurchaseAlert = (result: PurchaseResult, onSuccess?: () => void) => {
  if (result.success) {
    Alert.alert(
      'Success!',
      'Welcome to Pro! Your subscription is now active.',
      [{ text: 'Continue', onPress: onSuccess }]
    );
  } else {
    Alert.alert(
      'Purchase Failed',
      result.error || 'Unable to complete your purchase. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

export const showRestoreAlert = (result: PurchaseResult) => {
  if (result.success) {
    Alert.alert(
      'Purchases Restored',
      'Your previous purchases have been restored.',
      [{ text: 'OK' }]
    );
  } else {
    Alert.alert(
      result.error === 'No purchases to restore' ? 'No Purchases Found' : 'Restore Failed',
      result.error || 'Unable to restore purchases. Please try again.',
      [{ text: 'OK' }]
    );
  }
};
