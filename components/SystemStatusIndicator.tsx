
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, commonStyles } from '../styles/commonStyles';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface SystemStatusIndicatorProps {
  onPress?: () => void;
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error';
  services: {
    api: boolean;
    database: boolean;
    ai: boolean;
  };
}

export default function SystemStatusIndicator({ onPress }: SystemStatusIndicatorProps) {
  const [status, setStatus] = useState<SystemStatus>({
    overall: 'healthy',
    services: {
      api: true,
      database: true,
      ai: true,
    }
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const pulseAnim = useSharedValue(1);
  const expandAnim = useSharedValue(0);

  const runQuickCheck = useCallback(async () => {
    // Quick system check logic
    try {
      // Simulate API check
      const apiStatus = Math.random() > 0.1; // 90% success rate
      const dbStatus = Math.random() > 0.05; // 95% success rate
      const aiStatus = Math.random() > 0.15; // 85% success rate

      const newStatus: SystemStatus = {
        services: {
          api: apiStatus,
          database: dbStatus,
          ai: aiStatus,
        },
        overall: apiStatus && dbStatus && aiStatus ? 'healthy' : 
                 (apiStatus || dbStatus || aiStatus) ? 'warning' : 'error'
      };

      setStatus(newStatus);
    } catch (error) {
      console.error('System check failed:', error);
      setStatus({
        overall: 'error',
        services: {
          api: false,
          database: false,
          ai: false,
        }
      });
    }
  }, []);

  useEffect(() => {
    runQuickCheck();
    
    // Set up periodic checks
    const interval = setInterval(runQuickCheck, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [runQuickCheck]);

  useEffect(() => {
    // Pulse animation based on status
    if (status.overall === 'healthy') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.8, { duration: 1000 })
        ),
        -1,
        true
      );
    } else if (status.overall === 'warning') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.6, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.4, { duration: 300 })
        ),
        -1,
        true
      );
    }
  }, [status.overall, pulseAnim]);

  useEffect(() => {
    expandAnim.value = withSpring(isExpanded ? 1 : 0, { tension: 300, friction: 8 });
  }, [isExpanded, expandAnim]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  const expandedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expandAnim.value,
    transform: [{ scale: expandAnim.value }],
  }));

  const getStatusColor = () => {
    switch (status.overall) {
      case 'healthy': return colors.neonGreen;
      case 'warning': return colors.neonYellow;
      case 'error': return colors.neonRed;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (status.overall) {
      case 'healthy': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handlePress = () => {
    setIsExpanded(!isExpanded);
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={{
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 100,
    }}>
      <TouchableOpacity onPress={handlePress}>
        <Animated.View style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glassBackground,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: getStatusColor(),
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
            elevation: 4,
          },
          indicatorAnimatedStyle
        ]}>
          <Ionicons 
            name={getStatusIcon() as keyof typeof Ionicons.glyphMap} 
            size={20} 
            color={getStatusColor()} 
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded Status Panel */}
      {isExpanded && (
        <Animated.View style={[
          {
            position: 'absolute',
            top: 50,
            right: 0,
            width: 200,
          },
          expandedAnimatedStyle
        ]}>
          <BlurView intensity={40} style={{
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.glassBorder,
          }}>
            <View style={{
              backgroundColor: colors.glassBackground + 'F0',
              padding: 16,
            }}>
              <Text style={[
                commonStyles.subtitle,
                {
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 12,
                }
              ]}>
                System Status
              </Text>

              {/* Service Status Items */}
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
                    API Service
                  </Text>
                  <Ionicons 
                    name={status.services.api ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={status.services.api ? colors.neonGreen : colors.neonRed} 
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
                    Database
                  </Text>
                  <Ionicons 
                    name={status.services.database ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={status.services.database ? colors.neonGreen : colors.neonRed} 
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[commonStyles.textSmall, { color: colors.textSecondary }]}>
                    AI Service
                  </Text>
                  <Ionicons 
                    name={status.services.ai ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={status.services.ai ? colors.neonGreen : colors.neonRed} 
                  />
                </View>
              </View>

              {/* Overall Status */}
              <View style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.glassBorder,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Text style={[
                  commonStyles.textSmall,
                  {
                    color: getStatusColor(),
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }
                ]}>
                  {status.overall}
                </Text>
                <TouchableOpacity onPress={runQuickCheck}>
                  <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}
