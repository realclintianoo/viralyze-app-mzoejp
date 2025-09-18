
import { SafeAreaView } from 'react-native-safe-area-context';
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
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  inAppPurchaseManager, 
  PRODUCT_IDS, 
  showPurchaseAlert, 
  showRestoreAlert 
} from '../utils/inAppPurchases';
import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { commonStyles, colors } from '../styles/commonStyles';
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
  const slideAnim = useSharedValue(30);
  const fadeAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  
  useEffect(() => {
    slideAnim.value = withDelay(index * 100, withSpring(0, { tension: 300, friction: 8 }));
    fadeAnim.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    
    glowAnim.value = withDelay(
      index * 100 + 500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        true
      )
    );
  }, [index, slideAnim, fadeAnim, glowAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
    opacity: fadeAnim.value,
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
    shadowRadius: 8 + glowAnim.value * 8,
  }));

  return (
    <Animated.View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: colors.glassBackground,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.glowNeonGreen,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
      },
      animatedStyle
    ]}>
      <LinearGradient
        colors={[colors.neonGreen + '15', colors.neonTeal + '10']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
        }}
      />
      
      <View style={{
        backgroundColor: colors.neonGreen + '20',
        borderRadius: 16,
        padding: 12,
        marginRight: 16,
        shadowColor: colors.glowNeonGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
      }}>
        <Ionicons name={icon} size={20} color={colors.neonGreen} />
      </View>
      
      <Text style={[
        commonStyles.text,
        {
          flex: 1,
          fontSize: 16,
          color: colors.text,
          fontWeight: '600',
          lineHeight: 24,
        }
      ]}>
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
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  useEffect(() => {
    if (isSelected) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      glowAnim.value = withTiming(0, { duration: 300 });
    }
  }, [isSelected, glowAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    shadowOpacity: isSelected ? 0.6 + glowAnim.value * 0.4 : 0.2,
    shadowRadius: isSelected ? 16 + glowAnim.value * 8 : 8,
  }));

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          {
            backgroundColor: isSelected ? colors.glassBackgroundUltra : colors.glassBackground,
            borderRadius: 24,
            padding: 20,
            marginVertical: 8,
            borderWidth: 2,
            borderColor: isSelected ? colors.neonGreen + '60' : colors.glassBorder,
            shadowColor: isSelected ? colors.glowNeonGreen : colors.neuDark,
            shadowOffset: { width: 0, height: 0 },
            elevation: isSelected ? 16 : 8,
            position: 'relative',
          }
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isSelected 
            ? [colors.neonGreen + '20', colors.neonTeal + '15'] 
            : [colors.glassBackground, colors.glassBackgroundStrong]
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
        
        {showBadge && badgeText && (
          <View style={{
            position: 'absolute',
            top: -8,
            right: 20,
            backgroundColor: colors.warning,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
            shadowColor: colors.warning,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={[
              commonStyles.textBold,
              {
                color: colors.background,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }
            ]}>
              {badgeText}
            </Text>
          </View>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[
              commonStyles.textBold,
              {
                fontSize: 18,
                color: isSelected ? colors.neonGreen : colors.text,
                marginBottom: 4,
              }
            ]}>
              {title}
            </Text>
            
            <Text style={[
              commonStyles.textSmall,
              {
                color: isSelected ? colors.text : colors.textSecondary,
                fontSize: 14,
              }
            ]}>
              {subtitle}
            </Text>
          </View>
          
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[
              commonStyles.textBold,
              {
                fontSize: 24,
                color: isSelected ? colors.neonGreen : colors.text,
                textShadowColor: isSelected ? colors.glowNeonGreen : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: isSelected ? 8 : 0,
              }
            ]}>
              {price}
            </Text>
          </View>
        </View>
        
        {/* Selection indicator */}
        <View style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: isSelected ? colors.neonGreen : 'transparent',
          borderWidth: 2,
          borderColor: isSelected ? colors.neonGreen : colors.glassBorder,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: isSelected ? colors.glowNeonGreen : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isSelected ? 0.8 : 0,
          shadowRadius: isSelected ? 8 : 0,
          elevation: isSelected ? 6 : 0,
        }}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color={colors.background} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PaywallScreen() {
  console.log('💎 Paywall screen rendered');
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const logoGlowAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.6 + logoGlowAnim.value * 0.4,
    shadowRadius: 16 + logoGlowAnim.value * 12,
  }));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
    
    // Continuous logo glow
    logoGlowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
    
    initializeInAppPurchases();
  }, [fadeAnim, slideAnim, logoGlowAnim]);

  const initializeInAppPurchases = async () => {
    try {
      await inAppPurchaseManager.initialize();
    } catch (error) {
      console.error('Failed to initialize in-app purchases:', error);
    }
  };

  const handleContinue = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const productId = selectedPlan === 'monthly' 
        ? PRODUCT_IDS.MONTHLY_PRO 
        : PRODUCT_IDS.YEARLY_PRO;
      
      const result = await inAppPurchaseManager.purchaseProduct(productId);
      
      if (result.success) {
        showPurchaseAlert(true, selectedPlan);
        // Navigate back or to main app
        router.back();
      } else {
        showPurchaseAlert(false, selectedPlan);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      showPurchaseAlert(false, selectedPlan);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await inAppPurchaseManager.restorePurchases();
      showRestoreAlert(result.success, result.restoredCount || 0);
    } catch (error) {
      console.error('Restore failed:', error);
      showRestoreAlert(false, 0);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://viralyze.com/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://viralyze.com/privacy');
  };

  const benefits = [
    { icon: 'flash' as const, text: 'Unlimited AI requests & content generation' },
    { icon: 'images' as const, text: 'AI image creation with multiple styles' },
    { icon: 'shield-checkmark' as const, text: 'Guideline Guardian for safe content' },
    { icon: 'trending-up' as const, text: 'Advanced analytics & performance insights' },
    { icon: 'calendar' as const, text: 'Smart scheduling & content calendar' },
    { icon: 'people' as const, text: 'Team collaboration & brand management' },
    { icon: 'diamond' as const, text: 'Priority support & early access to features' },
    { icon: 'download' as const, text: 'Export content in multiple formats' },
  ];

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View style={[commonStyles.container, animatedStyle]}>
        {/* Header with VIRALYZE branding */}
        <View style={[
          commonStyles.header,
          {
            backgroundColor: colors.glassBackgroundUltra,
            borderBottomWidth: 1,
            borderBottomColor: colors.glassBorderStrong,
            shadowColor: colors.glowNeonTeal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }
        ]}>
          <TouchableOpacity
            style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: colors.glassBackgroundStrong,
              borderWidth: 2,
              borderColor: colors.glassBorderStrong,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <Animated.View style={[
            { alignItems: 'center', flexDirection: 'row' },
            logoAnimatedStyle
          ]}>
            <Image
              source={require('../assets/images/a8b69f5d-7692-41da-84fd-76aebd35c7d4.png')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                marginRight: 12,
                shadowColor: colors.glowNeonTeal,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }}
              resizeMode="contain"
            />
            <View style={{ alignItems: 'center' }}>
              <Text style={[
                commonStyles.headerTitle, 
                { 
                  fontSize: 24,
                  color: colors.neonTeal,
                  textShadowColor: colors.glowNeonTeal,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 12,
                }
              ]}>
                VIRALYZE
              </Text>
              <Text style={[
                commonStyles.textSmall,
                { 
                  color: colors.neonGreen, 
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginTop: -4
                }
              ]}>
                Pro
              </Text>
            </View>
          </Animated.View>
          
          <TouchableOpacity
            style={{
              padding: 12,
              borderRadius: 16,
              backgroundColor: colors.glassBackgroundStrong,
              borderWidth: 2,
              borderColor: colors.glassBorderStrong,
            }}
            onPress={handleRestorePurchases}
          >
            <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={{
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.glassBackgroundUltra,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              borderWidth: 3,
              borderColor: colors.neonGreen + '40',
              shadowColor: colors.glowNeonGreen,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 24,
              elevation: 20,
            }}>
              <Ionicons name="diamond" size={48} color={colors.neonGreen} />
            </View>
            
            <Text style={[
              commonStyles.title,
              {
                fontSize: 32,
                textAlign: 'center',
                color: colors.text,
                marginBottom: 12,
                textShadowColor: colors.glowNeonTeal,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }
            ]}>
              Unlock VIRALYZE Pro
            </Text>
            
            <Text style={[
              commonStyles.text,
              {
                textAlign: 'center',
                color: colors.textSecondary,
                fontSize: 18,
                lineHeight: 26,
                paddingHorizontal: 20,
              }
            ]}>
              Transform your content creation with unlimited AI power and premium features
            </Text>
          </View>

          {/* Pricing Options */}
          <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
            <Text style={[
              commonStyles.subtitle,
              {
                textAlign: 'center',
                marginBottom: 20,
                color: colors.text,
              }
            ]}>
              Choose Your Plan
            </Text>
            
            <ToggleOption
              title="Yearly Pro"
              subtitle="Best value • Save 60%"
              price="$4.99/mo"
              isSelected={selectedPlan === 'yearly'}
              onPress={() => setSelectedPlan('yearly')}
              showBadge={true}
              badgeText="Most Popular"
            />
            
            <ToggleOption
              title="Monthly Pro"
              subtitle="Flexible monthly billing"
              price="$12.99/mo"
              isSelected={selectedPlan === 'monthly'}
              onPress={() => setSelectedPlan('monthly')}
            />
          </View>

          {/* Benefits */}
          <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
            <Text style={[
              commonStyles.subtitle,
              {
                textAlign: 'center',
                marginBottom: 24,
                color: colors.text,
              }
            ]}>
              Everything You Get
            </Text>
            
            {benefits.map((benefit, index) => (
              <BenefitItem
                key={index}
                icon={benefit.icon}
                text={benefit.text}
                index={index}
              />
            ))}
          </View>

          {/* Social Proof */}
          <View style={{
            backgroundColor: colors.glassBackgroundUltra,
            borderRadius: 24,
            padding: 24,
            marginHorizontal: 20,
            marginBottom: 32,
            borderWidth: 2,
            borderColor: colors.glassBorderUltra,
            shadowColor: colors.glowNeonPurple,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 12,
          }}>
            <LinearGradient
              colors={[colors.neonPurple + '15', colors.neonTeal + '10']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 24,
              }}
            />
            
            <View style={{ alignItems: 'center' }}>
              <View style={{
                flexDirection: 'row',
                marginBottom: 16,
              }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name="star" 
                    size={20} 
                    color={colors.warning} 
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
              </View>
              
              <Text style={[
                commonStyles.text,
                {
                  textAlign: 'center',
                  color: colors.text,
                  fontSize: 16,
                  fontStyle: 'italic',
                  lineHeight: 24,
                  marginBottom: 12,
                }
              ]}>
                "VIRALYZE Pro completely transformed my content strategy. I'm creating viral content consistently now!"
              </Text>
              
              <Text style={[
                commonStyles.textBold,
                {
                  color: colors.neonTeal,
                  fontSize: 14,
                }
              ]}>
                - Sarah K., Content Creator
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.glassBackgroundUltra,
          borderTopWidth: 2,
          borderTopColor: colors.glassBorderUltra,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}>
          <BlurView intensity={20} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }} />
          
          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              borderRadius: 24,
              padding: 18,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.neonGreen,
              shadowColor: colors.glowNeonGreen,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 20,
              elevation: 16,
              overflow: 'hidden',
              marginBottom: 16,
            }}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={[colors.neonGreen, colors.neonTeal]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="diamond" size={20} color={colors.background} style={{ marginRight: 8 }} />
              <Text style={[
                commonStyles.textBold,
                {
                  color: colors.background,
                  fontSize: 18,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }
              ]}>
                Start Free Trial
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
          }}>
            <TouchableOpacity onPress={openTerms}>
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  fontSize: 12,
                  textDecorationLine: 'underline',
                }
              ]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={openPrivacy}>
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  fontSize: 12,
                  textDecorationLine: 'underline',
                }
              ]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[
            commonStyles.textSmall,
            {
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: 11,
              marginTop: 12,
              lineHeight: 16,
            }
          ]}>
            7-day free trial, then {selectedPlan === 'yearly' ? '$59.99/year' : '$12.99/month'}
            {'\n'}Cancel anytime in Settings
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
