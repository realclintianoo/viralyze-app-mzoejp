
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { performSystemCheck, SystemCheckResult, quickHealthCheck } from '../utils/systemCheck';

interface SystemCheckNotificationProps {
  onOpenDebug: () => void;
}

export default function SystemCheckNotification({ onOpenDebug }: SystemCheckNotificationProps) {
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const slideAnim = new Animated.Value(-100);

  const runInitialCheck = async () => {
    try {
      const result = await performSystemCheck();
      setSystemCheck(result);
      
      // Show notification if there are critical errors and not dismissed
      if (result.errors.length > 0 && !isDismissed) {
        showNotification();
      }
    } catch (error) {
      console.error('Initial system check failed:', error);
    }
  };

  const runPeriodicCheck = async () => {
    try {
      const healthCheck = await quickHealthCheck();
      
      // Only show notification for new critical issues
      if (!healthCheck.healthy && !isVisible && !isDismissed) {
        const result = await performSystemCheck();
        setSystemCheck(result);
        showNotification();
      }
    } catch (error) {
      console.error('Periodic health check failed:', error);
    }
  };

  useEffect(() => {
    runInitialCheck();
    
    // Set up periodic health checks (every 5 minutes)
    const interval = setInterval(runPeriodicCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const showNotification = () => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    // Auto-hide after 15 seconds (increased from 10)
    setTimeout(() => {
      if (isVisible) {
        hideNotification();
      }
    }, 15000);
  };

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handlePress = () => {
    hideNotification();
    setIsDismissed(true); // Prevent showing again until app restart
    onOpenDebug();
  };

  const handleDismiss = () => {
    hideNotification();
    setIsDismissed(true); // Prevent showing again until app restart
  };

  if (!isVisible || !systemCheck || systemCheck.errors.length === 0) {
    return null;
  }

  const criticalErrors = systemCheck.errors.filter(error => 
    error.includes('API key') || 
    error.includes('polyfill') || 
    error.includes('placeholder')
  );

  const severity = criticalErrors.length > 0 ? 'critical' : 'warning';
  const iconName = severity === 'critical' ? 'alert-circle' : 'warning';
  const iconColor = severity === 'critical' ? '#ef4444' : '#f59e0b';
  const borderColor = severity === 'critical' ? '#ef4444' : '#f59e0b';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={[styles.content, { borderLeftColor: borderColor }]} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {severity === 'critical' ? 'Critical Configuration Issues' : 'Configuration Issues Detected'}
          </Text>
          <Text style={styles.subtitle}>
            {systemCheck.errors.length} error{systemCheck.errors.length !== 1 ? 's' : ''} found. 
            {severity === 'critical' ? ' AI features may not work.' : ''} Tap to view details.
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
