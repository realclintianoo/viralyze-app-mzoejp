
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, commonStyles } from '../styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'text' | 'image';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ visible, onClose, type }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement actual upgrade flow
    console.log(`Upgrade to Pro - ${plan} plan`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[colors.glassBackground, colors.glassBackgroundStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 1,
              shadowColor: colors.glowPrimary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 32,
              elevation: 24,
            }}
          >
            <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
              <View
                style={{
                  backgroundColor: colors.glassBackgroundStrong,
                  padding: 32,
                  width: width - 40,
                  maxWidth: 400,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    padding: 8,
                    borderRadius: 12,
                    backgroundColor: colors.backgroundTertiary,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                  <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      shadowColor: colors.glowPrimary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 20,
                      elevation: 16,
                    }}
                  >
                    <Ionicons 
                      name={type === 'text' ? 'document-text' : 'image'} 
                      size={40} 
                      color={colors.white} 
                    />
                  </LinearGradient>

                  <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
                    Upgrade to Pro
                  </Text>
                  <Text style={[commonStyles.textSmall, { textAlign: 'center', opacity: 0.8 }]}>
                    You&apos;ve reached your daily limit for {type === 'text' ? 'AI text generation' : 'AI image generation'}
                  </Text>
                </View>

                {/* Features */}
                <View style={{ marginBottom: 32 }}>
                  {[
                    'Unlimited AI text generation',
                    'Unlimited AI image creation',
                    'Guideline Guardian tool',
                    'Priority support',
                    'Advanced analytics',
                    'Custom templates',
                  ].map((feature, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[commonStyles.text, { fontSize: 15 }]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Pricing Plans */}
                <View style={{ gap: 16 }}>
                  {/* Monthly Plan */}
                  <TouchableOpacity
                    onPress={() => handleUpgrade('monthly')}
                    style={{
                      backgroundColor: colors.glassBackground,
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={[commonStyles.textBold, { fontSize: 18 }]}>Monthly</Text>
                        <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                          Cancel anytime
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[commonStyles.title, { fontSize: 24, color: colors.primary }]}>
                          $9.99
                        </Text>
                        <Text style={[commonStyles.textSmall, { opacity: 0.6 }]}>
                          per month
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Yearly Plan */}
                  <TouchableOpacity
                    onPress={() => handleUpgrade('yearly')}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.gradientEnd]}
                      style={{
                        borderRadius: 16,
                        padding: 1,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.glassBackgroundStrong,
                          borderRadius: 16,
                          padding: 20,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={[commonStyles.textBold, { fontSize: 18, color: colors.primary }]}>
                              Yearly
                            </Text>
                            <Text style={[commonStyles.textSmall, { opacity: 0.8 }]}>
                              Save 40% • Best value
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[commonStyles.title, { fontSize: 24, color: colors.primary }]}>
                              $59.99
                            </Text>
                            <Text style={[commonStyles.textSmall, { opacity: 0.6 }]}>
                              per year
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>

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
                        shadowOpacity: 0.6,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <Text style={{ color: colors.white, fontSize: 12, fontWeight: '800' }}>
                        POPULAR
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={[commonStyles.textSmall, { textAlign: 'center', marginTop: 20, opacity: 0.6 }]}>
                  Secure payment • Cancel anytime • 7-day free trial
                </Text>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default UpgradeModal;
