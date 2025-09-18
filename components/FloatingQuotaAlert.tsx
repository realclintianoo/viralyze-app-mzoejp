
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { colors, commonStyles } from '../styles/commonStyles';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface FloatingQuotaAlertProps {
  visible: boolean;
  onClose: () => void;
}

const FloatingQuotaAlert: React.FC<FloatingQuotaAlertProps> = ({ visible, onClose }) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const slideAnim = useSharedValue(50);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 400 });
      scaleAnim.value = withSpring(1, { tension: 300, friction: 8 });
      slideAnim.value = withSpring(0, { tension: 300, friction: 8 });
      
      // Continuous glow effect
      glowAnim.value = withDelay(
        200,
        withTiming(1, { duration: 1000 })
      );
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      scaleAnim.value = withTiming(0.8, { duration: 300 });
      slideAnim.value = withTiming(50, { duration: 300 });
      glowAnim.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { scale: scaleAnim.value },
      { translateY: slideAnim.value }
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + glowAnim.value * 0.6,
    shadowRadius: 16 + glowAnim.value * 12,
  }));

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/paywall');
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Animated.View style={[
          {
            backgroundColor: colors.glassBackgroundUltra,
            borderRadius: 28,
            padding: 28,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.warning + '60',
            shadowColor: colors.warning,
            shadowOffset: { width: 0, height: 0 },
            elevation: 20,
            maxWidth: width - 40,
            width: '100%',
          },
          animatedStyle,
          glowStyle
        ]}>
          <LinearGradient
            colors={[colors.warning + '15', colors.error + '10']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 28,
            }}
          />
          
          <BlurView intensity={20} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 28,
          }} />
          
          {/* Alert Icon */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.glassBackgroundStrong,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 2,
            borderColor: colors.warning + '40',
            shadowColor: colors.warning,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 16,
            elevation: 12,
          }}>
            <Ionicons name="flash-off" size={36} color={colors.warning} />
          </View>
          
          {/* Alert Title */}
          <Text style={[
            commonStyles.title,
            {
              fontSize: 24,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 12,
              fontWeight: '800',
            }
          ]}>
            Daily Limit Reached
          </Text>
          
          {/* Alert Message */}
          <Text style={[
            commonStyles.text,
            {
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 32,
              paddingHorizontal: 8,
            }
          ]}>
            You've hit your daily free limit. Come back tomorrow to refresh or upgrade to Pro for unlimited access.
          </Text>
          
          {/* Action Buttons */}
          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: 'transparent',
                borderRadius: 20,
                padding: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: colors.neonGreen,
                shadowColor: colors.glowNeonGreen,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                elevation: 12,
                overflow: 'hidden',
              }}
              onPress={handleUpgrade}
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
                    fontSize: 16,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    fontWeight: '800',
                  }
                ]}>
                  Upgrade Now
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                padding: 16,
                alignItems: 'center',
              }}
              onPress={handleClose}
            >
              <Text style={[
                commonStyles.textSmall,
                {
                  color: colors.textSecondary,
                  fontSize: 14,
                  textDecorationLine: 'underline',
                }
              ]}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default FloatingQuotaAlert;
