
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { 
  inAppPurchaseManager, 
  PRODUCT_IDS, 
  showPurchaseAlert, 
  showRestoreAlert 
} from '../utils/inAppPurchases';
import { commonStyles, colors } from '../styles/commonStyles';

const { width } = Dimensions.get('window');

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
  const slideAnim = useSharedValue(-50);
  const fadeAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    slideAnim.value = withDelay(index * 100, withSpring(0));
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    glowAnim.value = withDelay(index * 200, withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    ));
  }, [index, slideAnim, fadeAnim, glowAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateX: slideAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
  }));

  return (
    <Animated.View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
      },
      animatedStyle
    ]}>
      <Animated.View style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.neonTeal + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 10,
          elevation: 5,
        },
        glowStyle
      ]}>
        <Ionicons name={icon} size={20} color={colors.neonTeal} />
      </Animated.View>
      <Text style={[commonStyles.text, { flex: 1, fontSize: 16 }]}>
        {text}
      </Text>
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
  badgeText 
}) => {
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      glowAnim.value = withTiming(0, { duration: 300 });
    }
  }, [isSelected, glowAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: isSelected ? colors.neonTeal : colors.backgroundSecondary,
    backgroundColor: isSelected ? colors.neonTeal + '10' : colors.backgroundSecondary + '40',
    shadowOpacity: isSelected ? 0.3 + glowAnim.value * 0.4 : 0,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    onPress();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View style={[
        {
          borderWidth: 2,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          position: 'relative',
          shadowColor: colors.glowNeonTeal,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 15,
          elevation: 8,
        },
        animatedStyle
      ]}>
        {showBadge && badgeText && (
          <View style={{
            position: 'absolute',
            top: -8,
            right: 16,
            backgroundColor: colors.neonGreen,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={[commonStyles.textSmall, { 
              color: colors.background, 
              fontWeight: '600',
              fontSize: 12,
            }]}>
              {badgeText}
            </Text>
          </View>
        )}
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.subtitle, { 
              color: isSelected ? colors.neonTeal : colors.text,
              fontWeight: '600',
              marginBottom: 4,
            }]}>
              {title}
            </Text>
            <Text style={[commonStyles.textSmall, { 
              color: colors.textSecondary,
              marginBottom: 8,
            }]}>
              {subtitle}
            </Text>
          </View>
          <Text style={[commonStyles.headerTitle, { 
            fontSize: 24,
            color: isSelected ? colors.neonTeal : colors.text,
          }]}>
            {price}
          </Text>
        </View>
        
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: isSelected ? colors.neonTeal : colors.textSecondary,
          backgroundColor: isSelected ? colors.neonTeal : 'transparent',
          position: 'absolute',
          top: 20,
          right: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isSelected && (
            <Ionicons name="checkmark" size={12} color={colors.background} />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const logoGlowAnim = useSharedValue(0);

  useEffect(() => {
    // Initial animations
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withTiming(0, { duration: 600 });
    
    // Logo glow animation
    logoGlowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [fadeAnim, slideAnim, logoGlowAnim]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + logoGlowAnim.value * 0.6,
  }));

  const initializeInAppPurchases = async () => {
    try {
      await inAppPurchaseManager.initialize();
    } catch (error) {
      console.error('Failed to initialize in-app purchases:', error);
    }
  };

  useEffect(() => {
    initializeInAppPurchases();
  }, []);

  const handleContinue = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const productId = selectedPlan === 'yearly' ? PRODUCT_IDS.PRO_YEARLY : PRODUCT_IDS.PRO_MONTHLY;
      const result = await inAppPurchaseManager.purchaseProduct(productId);
      
      showPurchaseAlert(result, () => {
        router.back();
      });
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await inAppPurchaseManager.restorePurchases();
      showRestoreAlert(result);
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://viralyze.app/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://viralyze.app/privacy');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[
          colors.background,
          colors.backgroundSecondary + '60',
          colors.background,
        ]}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={[{ padding: 24 }, containerAnimatedStyle]}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  padding: 8,
                }}
                onPress={() => router.back()}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              <Animated.View style={[
                {
                  alignItems: 'center',
                  marginTop: 40,
                  shadowColor: colors.glowNeonTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  elevation: 10,
                },
                logoAnimatedStyle
              ]}>
                <Image
                  source={require('../assets/images/a8b69f5d-7692-41da-84fd-76aebd35c7d4.png')}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    marginBottom: 16,
                  }}
                  resizeMode="contain"
                />
                <Text style={[commonStyles.headerTitle, { 
                  fontSize: 32,
                  color: colors.neonTeal,
                  textShadowColor: colors.glowNeonTeal,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                  marginBottom: 8,
                }]}>
                  VIRALYZE Pro
                </Text>
                <Text style={[commonStyles.subtitle, { 
                  textAlign: 'center',
                  color: colors.textSecondary,
                  marginBottom: 32,
                }]}>
                  Unlock unlimited AI generation and premium features
                </Text>
              </Animated.View>
            </View>

            {/* Benefits */}
            <View style={{ marginBottom: 40 }}>
              <BenefitItem 
                icon="infinite" 
                text="Unlimited AI text generation" 
                index={0} 
              />
              <BenefitItem 
                icon="image" 
                text="Unlimited AI image creation" 
                index={1} 
              />
              <BenefitItem 
                icon="shield-checkmark" 
                text="Guideline Guardian (content safety)" 
                index={2} 
              />
              <BenefitItem 
                icon="trending-up" 
                text="Advanced analytics & insights" 
                index={3} 
              />
              <BenefitItem 
                icon="flash" 
                text="Priority AI processing" 
                index={4} 
              />
              <BenefitItem 
                icon="headset" 
                text="Premium support" 
                index={5} 
              />
            </View>

            {/* Pricing Options */}
            <View style={{ marginBottom: 32 }}>
              <Text style={[commonStyles.subtitle, { 
                textAlign: 'center',
                marginBottom: 24,
                color: colors.text,
              }]}>
                Choose Your Plan
              </Text>

              <ToggleOption
                title="Monthly"
                subtitle="Billed monthly"
                price="$9.99"
                isSelected={selectedPlan === 'monthly'}
                onPress={() => setSelectedPlan('monthly')}
              />

              <ToggleOption
                title="Yearly"
                subtitle="Billed annually • Save 50%"
                price="$59.99"
                isSelected={selectedPlan === 'yearly'}
                onPress={() => setSelectedPlan('yearly')}
                showBadge
                badgeText="BEST VALUE"
              />
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[
                commonStyles.primaryButton,
                {
                  marginBottom: 16,
                  shadowColor: colors.glowNeonTeal,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                  elevation: 8,
                },
                loading && { opacity: 0.7 }
              ]}
              onPress={handleContinue}
              disabled={loading}
            >
              <Text style={[commonStyles.primaryButtonText, { fontSize: 18, fontWeight: '600' }]}>
                {loading ? 'Processing...' : `Start ${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} Plan`}
              </Text>
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity
              style={[commonStyles.secondaryButton, { marginBottom: 24 }]}
              onPress={handleRestorePurchases}
              disabled={loading}
            >
              <Text style={commonStyles.secondaryButtonText}>
                Restore Purchases
              </Text>
            </TouchableOpacity>

            {/* Legal Links */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: 16,
            }}>
              <TouchableOpacity onPress={openTerms}>
                <Text style={[commonStyles.textSmall, { 
                  color: colors.textSecondary,
                  textDecorationLine: 'underline',
                }]}>
                  Terms of Service
                </Text>
              </TouchableOpacity>
              
              <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
                •
              </Text>
              
              <TouchableOpacity onPress={openPrivacy}>
                <Text style={[commonStyles.textSmall, { 
                  color: colors.textSecondary,
                  textDecorationLine: 'underline',
                }]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <Text style={[commonStyles.textSmall, { 
              textAlign: 'center',
              color: colors.textSecondary,
              marginTop: 16,
              lineHeight: 18,
            }]}>
              {Platform.OS === 'ios' 
                ? 'Payment will be charged to your iTunes Account. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.'
                : 'Payment will be charged to your Google Play Account. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.'
              }
            </Text>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
