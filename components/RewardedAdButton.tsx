
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { adMobService } from '../utils/admob';
import { colors, commonStyles } from '../styles/commonStyles';
import { storage } from '../utils/storage';

interface RewardedAdButtonProps {
  onRewardEarned?: (reward: any) => void;
  disabled?: boolean;
  style?: any;
}

const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  onRewardEarned,
  disabled = false,
  style
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdReady, setIsAdReady] = useState(false);

  useEffect(() => {
    // Check if rewarded ad is ready
    const checkAdStatus = () => {
      setIsAdReady(adMobService.isRewardedReady());
    };

    checkAdStatus();
    
    // Check every 5 seconds
    const interval = setInterval(checkAdStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleWatchAd = async () => {
    if (disabled || isLoading || !isAdReady) return;

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('🎬 Showing rewarded ad...');
      const result = await adMobService.showRewardedAd();

      if (result.success) {
        console.log('🎁 User earned reward:', result.reward);
        
        // Give user extra AI requests
        await giveReward();
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          '🎉 Reward Earned!',
          'You\'ve earned 3 extra AI requests! Keep creating amazing content.',
          [{ text: 'Awesome!' }]
        );

        onRewardEarned?.(result.reward);
      } else {
        console.log('❌ User did not complete the ad');
        Alert.alert(
          'Ad Not Completed',
          'You need to watch the full ad to earn your reward. Try again!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error showing rewarded ad:', error);
      Alert.alert(
        'Ad Unavailable',
        'Sorry, no ads are available right now. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const giveReward = async () => {
    try {
      // Get current quota
      const currentQuota = await storage.getQuotaUsage();
      
      // Reduce used quota by 3 (giving 3 extra requests)
      const newTextUsage = Math.max(0, currentQuota.text - 3);
      
      // Update quota
      await storage.setItem('quota_usage', JSON.stringify({
        text: newTextUsage,
        image: currentQuota.image,
        lastReset: currentQuota.lastReset || new Date().toISOString(),
      }));

      console.log('🎁 Reward applied: 3 extra AI requests');
    } catch (error) {
      console.error('❌ Error applying reward:', error);
    }
  };

  if (!isAdReady && !isLoading) {
    return (
      <View style={[
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          opacity: 0.6,
        },
        style
      ]}>
        <Text style={[
          commonStyles.textSmall,
          { color: colors.textTertiary, textAlign: 'center' }
        ]}>
          Loading ad...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: colors.glowNeonGreen,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 16,
          elevation: 12,
          opacity: (disabled || isLoading || !isAdReady) ? 0.6 : 1,
        },
        style
      ]}
      onPress={handleWatchAd}
      disabled={disabled || isLoading || !isAdReady}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.neonGreen, colors.neonTeal]}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <>
            <Ionicons 
              name="play-circle" 
              size={20} 
              color={colors.background} 
              style={{ marginRight: 8 }}
            />
            <Text style={[
              commonStyles.textBold,
              {
                color: colors.background,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }
            ]}>
              Watch Ad for +3 Requests
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default RewardedAdButton;
