
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { commonStyles, colors } from '../styles/commonStyles';
import { 
  inAppPurchaseManager, 
  PRODUCT_IDS, 
  showPurchaseAlert, 
  showRestoreAlert 
} from '../utils/inAppPurchases';

const { width, height } = Dimensions.get('window');

interface BenefitItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  index: number;
}

interface ToggleOptionProps {
  title: string;
  subtitle: string;
  price: string;
  isSelected: boolean;
  onPress: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon, text, index }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);

  useEffect(() => {
    opacity.value = withDelay(index * 150, withTiming(1, { duration: 600 }));
    translateX.value = withDelay(index * 150, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }]}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
          shadowColor: colors.glowPrimary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.white} />
      </View>
      <Text style={[commonStyles.text, { fontSize: 16, flex: 1 }]}>{text}</Text>
    </Animated.View>
  );
};

const ToggleOption: React.FC<ToggleOptionProps> = ({
  title,
  subtitle,
  price,
  isSelected,
  onPress,
  showBadge,
  badgeText,
}) => {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(isSelected ? 2 : 1);
  const glowOpacity = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    borderWidth.value = withSpring(isSelected ? 2 : 1, { damping: 15, stiffness: 200 });
    glowOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 300 });
  }, [isSelected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: isSelected ? colors.primary : colors.glassBorder,
    shadowOpacity: glowOpacity.value * 0.8,
  }));

  return (
    <Animated.View style={[animatedStyle, { position: 'relative', marginBottom: 16 }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            borderAnimatedStyle,
            {
              backgroundColor: colors.glassBackgroundStrong,
              borderRadius: 20,
              padding: 20,
              shadowColor: colors.glowPrimary,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 16,
              elevation: 12,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.textBold, { fontSize: 18, marginBottom: 4 }]}>
                {title}
              </Text>
              <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                {subtitle}
              </Text>
            </View>
            <Text style={[commonStyles.title, { fontSize: 24, color: colors.primary }]}>
              {price}
            </Text>
          </View>
        </Animated.View>

        {showBadge && badgeText && (
          <View
            style={{
              position: 'absolute',
              top: -8,
              right: 16,
              backgroundColor: colors.warning,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              shadowColor: colors.warning,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '800' }}>
              {badgeText}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Initialize in-app purchases
    initializeInAppPurchases();

    // Animate entrance
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    headerScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
    contentOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    contentTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const initializeInAppPurchases = async () => {
    try {
      const initialized = await inAppPurchaseManager.initialize();
      if (!initialized) {
        console.warn('In-app purchases not available');
      }
    } catch (error) {
      console.error('Failed to initialize in-app purchases:', error);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      buttonScale.value = withSequence(
        withSpring(0.95, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const productId = selectedPlan === 'yearly' ? PRODUCT_IDS.PRO_YEARLY : PRODUCT_IDS.PRO_MONTHLY;
      const result = await inAppPurchaseManager.purchaseProduct(productId);
      
      showPurchaseAlert(result, () => {
        router.back();
      });
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        'Unable to complete your purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await inAppPurchaseManager.restorePurchases();
      showRestoreAlert(result);
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://viralyze.app/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://viralyze.app/privacy');
  };

  const benefits = [
    { icon: 'infinite-outline' as const, text: 'Unlimited AI text & images' },
    { icon: 'flash-outline' as const, text: 'Priority speed' },
    { icon: 'shield-checkmark-outline' as const, text: 'Guideline Guardian' },
    { icon: 'analytics-outline' as const, text: 'Advanced analytics' },
    { icon: 'document-text-outline' as const, text: 'Custom templates' },
  ];

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={{ flex: 1 }}
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            top: 60,
            right: 20,
            zIndex: 10,
            padding: 12,
            borderRadius: 16,
            backgroundColor: colors.glassBackgroundStrong,
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Development Notice */}
          {__DEV__ && (
            <View
              style={{
                backgroundColor: colors.warning + '20',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.warning + '40',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="code-outline" size={20} color={colors.warning} />
                <Text style={[commonStyles.textBold, { color: colors.warning, marginLeft: 8 }]}>
                  Development Mode
                </Text>
              </View>
              <Text style={[commonStyles.textSmall, { color: colors.warning, opacity: 0.9 }]}>
                This is a mock purchase flow for testing. No real transactions will be processed.
              </Text>
            </View>
          )}
          {/* Header Section */}
          <Animated.View style={[headerAnimatedStyle, { alignItems: 'center', marginBottom: 40 }]}>
            {/* Diamond Pro Badge */}
            <LinearGradient
              colors={[colors.primary, colors.gradientEnd]}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: colors.glowPrimary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 24,
                elevation: 20,
              }}
            >
              <Ionicons name="diamond" size={50} color={colors.white} />
            </LinearGradient>

            <Text style={[commonStyles.title, { fontSize: 32, textAlign: 'center', marginBottom: 12 }]}>
              Upgrade to Pro
            </Text>
            <Text style={[commonStyles.text, { fontSize: 18, textAlign: 'center', opacity: 0.8 }]}>
              Unlock unlimited AI and premium tools.
            </Text>
          </Animated.View>

          <Animated.View style={contentAnimatedStyle}>
            {/* Subscription Toggle */}
            <View style={{ marginBottom: 32 }}>
              <ToggleOption
                title="Yearly"
                subtitle="Save 40%"
                price="$59.99"
                isSelected={selectedPlan === 'yearly'}
                onPress={() => setSelectedPlan('yearly')}
                showBadge
                badgeText="SAVE 40%"
              />
              <ToggleOption
                title="Monthly"
                subtitle="Cancel anytime"
                price="$9.99"
                isSelected={selectedPlan === 'monthly'}
                onPress={() => setSelectedPlan('monthly')}
              />
            </View>

            {/* Price Display */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text style={[commonStyles.title, { fontSize: 48, color: colors.primary }]}>
                {selectedPlan === 'yearly' ? '$59.99' : '$9.99'}
              </Text>
              <Text style={[commonStyles.text, { fontSize: 18, opacity: 0.8 }]}>
                per {selectedPlan === 'yearly' ? 'year' : 'month'}
              </Text>
            </View>

            {/* Benefits List */}
            <View style={{ marginBottom: 40 }}>
              {benefits.map((benefit, index) => (
                <BenefitItem
                  key={index}
                  icon={benefit.icon}
                  text={benefit.text}
                  index={index}
                />
              ))}
            </View>

            {/* Testimonial */}
            <View
              style={{
                backgroundColor: colors.glassBackgroundStrong,
                borderRadius: 20,
                padding: 24,
                marginBottom: 40,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <Text style={[commonStyles.text, { fontSize: 16, fontStyle: 'italic', marginBottom: 12 }]}>
                "Totally worth it — I went Pro and cut my content time in half."
              </Text>
              <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                — Ada, Lagos
              </Text>
            </View>

            {/* Continue Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleContinue}
                disabled={isLoading}
                style={{ marginBottom: 16 }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.gradientEnd]}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    alignItems: 'center',
                    shadowColor: colors.glowPrimary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <Text style={[commonStyles.textBold, { fontSize: 18, color: colors.white }]}>
                    {isLoading
                      ? 'Processing...'
                      : __DEV__ 
                        ? 'Try Mock Purchase'
                        : `Continue — ${selectedPlan === 'yearly' ? '$59.99/year' : '$9.99/month'}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Restore Purchases Button */}
            <TouchableOpacity
              onPress={handleRestorePurchases}
              disabled={isLoading}
              style={{
                backgroundColor: colors.glassBackground,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <Text style={[commonStyles.text, { fontSize: 16, opacity: 0.8 }]}>
                Restore Purchases
              </Text>
            </TouchableOpacity>

            {/* Trust Text */}
            <Text style={[commonStyles.textSmall, { textAlign: 'center', marginBottom: 24, opacity: 0.6 }]}>
              {__DEV__ ? 'Development Mode • Mock Purchases' : 'Secure payment • Cancel anytime • 7-day trial'}
            </Text>

            {/* Terms and Privacy */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
              <TouchableOpacity onPress={openTerms}>
                <Text style={[commonStyles.textSmall, { color: colors.primary, textDecorationLine: 'underline' }]}>
                  Terms
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openPrivacy}>
                <Text style={[commonStyles.textSmall, { color: colors.primary, textDecorationLine: 'underline' }]}>
                  Privacy
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
