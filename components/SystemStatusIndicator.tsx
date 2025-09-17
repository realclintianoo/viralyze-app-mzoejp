
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { performSystemCheck, SystemCheckResult } from '../utils/systemCheck';

interface SystemStatusIndicatorProps {
  onPress: () => void;
}

export default function SystemStatusIndicator({ onPress }: SystemStatusIndicatorProps) {
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runCheck();
  }, []);

  const runCheck = async () => {
    try {
      const result = await performSystemCheck();
      setSystemCheck(result);
    } catch (error) {
      console.error('System status check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: 'hourglass-outline' as const,
        color: colors.textSecondary,
        text: 'Checking...',
        subtitle: 'Running system diagnostics'
      };
    }

    if (!systemCheck) {
      return {
        icon: 'help-circle-outline' as const,
        color: colors.textSecondary,
        text: 'Unknown',
        subtitle: 'Unable to determine system status'
      };
    }

    if (systemCheck.errors.length > 0) {
      return {
        icon: 'warning-outline' as const,
        color: '#ef4444',
        text: 'Issues Found',
        subtitle: `${systemCheck.errors.length} error${systemCheck.errors.length !== 1 ? 's' : ''} detected`
      };
    }

    if (systemCheck.warnings.length > 0) {
      return {
        icon: 'alert-circle-outline' as const,
        color: '#f59e0b',
        text: 'Minor Issues',
        subtitle: `${systemCheck.warnings.length} warning${systemCheck.warnings.length !== 1 ? 's' : ''} found`
      };
    }

    return {
      icon: 'checkmark-circle-outline' as const,
      color: colors.accent,
      text: 'All Good',
      subtitle: 'System is properly configured'
    };
  };

  const status = getStatusInfo();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={status.icon} size={24} color={status.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>System Status</Text>
        <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
        <Text style={styles.subtitle}>{status.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
