
import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adMobService } from '../utils/admob';
import { colors, commonStyles } from '../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface AdBannerProps {
  size?: keyof typeof BannerAdSize;
  style?: any;
  showFallback?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  size = 'BANNER', 
  style,
  showFallback = true 
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const adUnitId = adMobService.getBannerAdUnitId();

  if (!adUnitId) {
    console.warn('⚠️ AdMob banner ad unit ID not configured');
    return showFallback ? <FallbackAd /> : null;
  }

  // For web platform, show fallback
  if (Platform.OS === 'web') {
    return showFallback ? <FallbackAd /> : null;
  }

  const handleAdLoaded = () => {
    console.log('✅ Banner ad loaded');
    setAdLoaded(true);
    setAdError(false);
  };

  const handleAdError = (error: any) => {
    console.error('❌ Banner ad error:', error);
    setAdError(true);
    setAdLoaded(false);
  };

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {!adLoaded && !adError && showFallback && <FallbackAd />}
      
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize[size]}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdError}
      />
      
      {adError && showFallback && <FallbackAd />}
    </View>
  );
};

// Fallback component when ads can't be loaded
const FallbackAd: React.FC = () => {
  return (
    <View style={{
      height: 50,
      backgroundColor: colors.glassBackgroundUltra,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorderUltra,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
      overflow: 'hidden',
    }}>
      <LinearGradient
        colors={[colors.neonTeal + '08', colors.neonGreen + '08']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      <BlurView intensity={10} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }} />
      
      <Text style={[
        commonStyles.textSmall,
        { 
          color: colors.textTertiary,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1
        }
      ]}>
        🚀 VIRALYZE Pro - Unlock Premium Features
      </Text>
    </View>
  );
};

export default AdBanner;
