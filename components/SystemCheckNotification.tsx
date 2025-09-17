
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
import { performSystemCheck, SystemCheckResult } from '../utils/systemCheck';

interface SystemCheckNotificationProps {
  onOpenDebug: () => void;
}

export default function SystemCheckNotification({ onOpenDebug }: SystemCheckNotificationProps) {
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    runInitialCheck();
  }, []);

  const runInitialCheck = async () => {
    try {
      const result = await performSystemCheck();
      setSystemCheck(result);
      
      // Show notification if there are critical errors
      if (result.errors.length > 0) {
        setIsVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          hideNotification();
        }, 10000);
      }
    } catch (error) {
      console.error('Initial system check failed:', error);
    }
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
    onOpenDebug();
  };

  if (!isVisible || !systemCheck || systemCheck.errors.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Configuration Issues Detected</Text>
          <Text style={styles.subtitle}>
            {systemCheck.errors.length} error{systemCheck.errors.length !== 1 ? 's' : ''} found. Tap to view details.
          </Text>
        </View>
        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
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
    borderLeftColor: '#f59e0b',
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
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
