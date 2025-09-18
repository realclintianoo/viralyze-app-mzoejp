
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles, colors } from '../styles/commonStyles';

interface PremiumFeatureLockProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: string[];
}

const PremiumFeatureLock: React.FC<PremiumFeatureLockProps> = ({
  title,
  description,
  onUpgrade,
  icon = 'diamond',
  gradient = ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)']
}) => {
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowAnim.value * 0.4,
    shadowRadius: 12 + glowAnim.value * 8,
  }));

  React.useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scaleAnim.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onUpgrade();
  };

  return (
    <Animated.View style={[
      commonStyles.ultraCard,
      {
        alignItems: 'center',
        padding: 32,
        margin: 16,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        shadowColor: 'rgba(139, 92, 246, 0.6)',
      },
      glowStyle
    ]}>
      <LinearGradient
        colors={gradient}
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
      
      {/* Premium Icon */}
      <View style={{
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderRadius: 30,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(139, 92, 246, 0.4)',
      }}>
        <Ionicons name={icon} size={32} color="#8B5CF6" />
      </View>
      
      {/* Title */}
      <Text style={[
        commonStyles.title,
        { 
          textAlign: 'center', 
          marginBottom: 12,
          color: colors.text,
          fontSize: 24
        }
      ]}>
        {title}
      </Text>
      
      {/* Description */}
      <Text style={[
        commonStyles.textSmall,
        { 
          textAlign: 'center', 
          marginBottom: 24,
          color: colors.textSecondary,
          lineHeight: 20
        }
      ]}>
        {description}
      </Text>
      
      {/* Upgrade Button */}
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            commonStyles.premiumButton,
            {
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: '#8B5CF6',
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 8,
            }
          ]}
          onPress={handleUpgrade}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={[commonStyles.premiumButton, { margin: 0 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="diamond" size={20} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={[commonStyles.buttonText, { fontSize: 16 }]}>
                Upgrade to Pro
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Features List */}
      <View style={{ marginTop: 20, alignSelf: 'stretch' }}>
        <Text style={[
          commonStyles.textBold,
          { 
            color: colors.accent, 
            marginBottom: 12,
            textAlign: 'center'
          }
        ]}>
          Pro Features:
        </Text>
        
        {[
          'Unlimited AI requests',
          'Advanced content tools',
          'Priority support',
          'Export capabilities'
        ].map((feature, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            justifyContent: 'center'
          }}>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{ marginRight: 8 }} />
            <Text style={[
              commonStyles.textSmall,
              { color: colors.textSecondary }
            ]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

export default PremiumFeatureLock;
