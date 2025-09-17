
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { performSystemCheck, SystemCheckResult, quickHealthCheck } from '../utils/systemCheck';

interface SystemStatusIndicatorProps {
  onPress: () => void;
}

export default function SystemStatusIndicator({ onPress }: SystemStatusIndicatorProps) {
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    runCheck();
    
    // Set up periodic checks every 2 minutes
    const interval = setInterval(runQuickCheck, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const runCheck = async () => {
    try {
      const result = await performSystemCheck();
      setSystemCheck(result);
      setLastChecked(new Date());
    } catch (error) {
      console.error('System status check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickCheck = async () => {
    try {
      const healthCheck = await quickHealthCheck();
      
      // If health status changed, run full check
      if (systemCheck && (
        (healthCheck.healthy && systemCheck.errors.length > 0) ||
        (!healthCheck.healthy && systemCheck.errors.length === 0)
      )) {
        await runCheck();
      }
    } catch (error) {
      console.error('Quick health check failed:', error);
    }
  };

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: 'hourglass-outline' as const,
        color: colors.textSecondary,
        text: 'Checking...',
        subtitle: 'Running system diagnostics',
        pulse: true
      };
    }

    if (!systemCheck) {
      return {
        icon: 'help-circle-outline' as const,
        color: colors.textSecondary,
        text: 'Unknown',
        subtitle: 'Unable to determine system status',
        pulse: false
      };
    }

    const criticalErrors = systemCheck.errors.filter(error => 
      error.includes('API key') || 
      error.includes('polyfill') || 
      error.includes('placeholder')
    );

    if (criticalErrors.length > 0) {
      return {
        icon: 'alert-circle' as const,
        color: '#ef4444',
        text: 'Critical Issues',
        subtitle: `${criticalErrors.length} critical error${criticalErrors.length !== 1 ? 's' : ''} - AI features disabled`,
        pulse: true
      };
    }

    if (systemCheck.errors.length > 0) {
      return {
        icon: 'warning-outline' as const,
        color: '#f59e0b',
        text: 'Issues Found',
        subtitle: `${systemCheck.errors.length} error${systemCheck.errors.length !== 1 ? 's' : ''} detected`,
        pulse: false
      };
    }

    if (systemCheck.warnings.length > 0) {
      return {
        icon: 'alert-circle-outline' as const,
        color: '#f59e0b',
        text: 'Minor Issues',
        subtitle: `${systemCheck.warnings.length} warning${systemCheck.warnings.length !== 1 ? 's' : ''} found`,
        pulse: false
      };
    }

    return {
      icon: 'checkmark-circle' as const,
      color: colors.accent,
      text: 'All Good',
      subtitle: 'System is properly configured',
      pulse: false
    };
  };

  const formatLastChecked = () => {
    if (!lastChecked) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const status = getStatusInfo();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size={24} color={status.color} />
        ) : (
          <Ionicons 
            name={status.icon} 
            size={24} 
            color={status.color}
            style={status.pulse ? styles.pulseIcon : undefined}
          />
        )}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>System Status</Text>
          {lastChecked && (
            <Text style={styles.timestamp}>{formatLastChecked()}</Text>
          )}
        </View>
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  pulseIcon: {
    opacity: 0.8,
  },
});
