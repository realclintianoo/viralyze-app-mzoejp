
import { 
  BannerAd, 
  BannerAdSize, 
  TestIds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  MobileAds,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Test IDs for development - replace with your actual Ad Unit IDs for production
const AD_UNIT_IDS = {
  banner: __DEV__ ? TestIds.BANNER : Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your iOS banner ad unit ID
    android: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your Android banner ad unit ID
  }),
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your iOS interstitial ad unit ID
    android: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your Android interstitial ad unit ID
  }),
  rewarded: __DEV__ ? TestIds.REWARDED : Platform.select({
    ios: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your iOS rewarded ad unit ID
    android: 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy', // Replace with your Android rewarded ad unit ID
  }),
};

class AdMobService {
  private interstitialAd: InterstitialAd | null = null;
  private rewardedAd: RewardedAd | null = null;
  private isInitialized = false;

  async initialize() {
    try {
      if (this.isInitialized) return;
      
      console.log('🎯 Initializing AdMob...');
      await MobileAds().initialize();
      
      // Set request configuration for better ad targeting
      await MobileAds().setRequestConfiguration({
        // Set your max ad content rating
        maxAdContentRating: 'T', // Teen
        // Set tag for under age of consent
        tagForUnderAgeOfConsent: false,
        // Set tag for child directed treatment
        tagForChildDirectedTreatment: false,
      });

      this.isInitialized = true;
      console.log('✅ AdMob initialized successfully');
      
      // Preload interstitial and rewarded ads
      this.loadInterstitialAd();
      this.loadRewardedAd();
      
    } catch (error) {
      console.error('❌ AdMob initialization failed:', error);
    }
  }

  // Banner Ad Component (to be used in React components)
  getBannerAdComponent() {
    if (!AD_UNIT_IDS.banner) {
      console.warn('⚠️ Banner ad unit ID not configured');
      return null;
    }

    return BannerAd;
  }

  getBannerAdUnitId() {
    return AD_UNIT_IDS.banner;
  }

  // Interstitial Ad Methods
  private loadInterstitialAd() {
    if (!AD_UNIT_IDS.interstitial) {
      console.warn('⚠️ Interstitial ad unit ID not configured');
      return;
    }

    this.interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ Interstitial ad loaded');
    });

    this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('❌ Interstitial ad error:', error);
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 Interstitial ad closed');
      // Preload the next interstitial ad
      this.loadInterstitialAd();
    });

    this.interstitialAd.load();
  }

  async showInterstitialAd(): Promise<boolean> {
    try {
      if (!this.interstitialAd) {
        console.warn('⚠️ Interstitial ad not loaded');
        return false;
      }

      const loaded = this.interstitialAd.loaded;
      if (loaded) {
        await this.interstitialAd.show();
        return true;
      } else {
        console.warn('⚠️ Interstitial ad not ready');
        return false;
      }
    } catch (error) {
      console.error('❌ Error showing interstitial ad:', error);
      return false;
    }
  }

  // Rewarded Ad Methods
  private loadRewardedAd() {
    if (!AD_UNIT_IDS.rewarded) {
      console.warn('⚠️ Rewarded ad unit ID not configured');
      return;
    }

    this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: false,
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ Rewarded ad loaded');
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      console.error('❌ Rewarded ad error:', error);
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('🎁 User earned reward:', reward);
    });

    this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('📱 Rewarded ad closed');
      // Preload the next rewarded ad
      this.loadRewardedAd();
    });

    this.rewardedAd.load();
  }

  async showRewardedAd(): Promise<{ success: boolean; reward?: any }> {
    try {
      if (!this.rewardedAd) {
        console.warn('⚠️ Rewarded ad not loaded');
        return { success: false };
      }

      const loaded = this.rewardedAd.loaded;
      if (loaded) {
        return new Promise((resolve) => {
          const rewardListener = this.rewardedAd!.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
              rewardListener();
              resolve({ success: true, reward });
            }
          );

          const closeListener = this.rewardedAd!.addAdEventListener(
            AdEventType.CLOSED,
            () => {
              closeListener();
              // If no reward was earned, resolve with success: false
              setTimeout(() => resolve({ success: false }), 100);
            }
          );

          this.rewardedAd!.show();
        });
      } else {
        console.warn('⚠️ Rewarded ad not ready');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Error showing rewarded ad:', error);
      return { success: false };
    }
  }

  // Check if ads are available
  isInterstitialReady(): boolean {
    return this.interstitialAd?.loaded || false;
  }

  isRewardedReady(): boolean {
    return this.rewardedAd?.loaded || false;
  }

  // Get ad sizes for banner ads
  getBannerSizes() {
    return {
      BANNER: BannerAdSize.BANNER,
      LARGE_BANNER: BannerAdSize.LARGE_BANNER,
      MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE,
      FULL_BANNER: BannerAdSize.FULL_BANNER,
      LEADERBOARD: BannerAdSize.LEADERBOARD,
      SMART_BANNER: BannerAdSize.SMART_BANNER,
    };
  }
}

export const adMobService = new AdMobService();
export { BannerAd, BannerAdSize, TestIds };
