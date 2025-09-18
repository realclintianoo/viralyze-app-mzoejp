
import React, { useEffect, useState, useCallback } from 'react';
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  healthy: {
    backgroundColor: '#D4F4DD',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  unhealthy: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  warning: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  loading: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  healthyText: {
    color: '#15803D',
  },
  unhealthyText: {
    color: '#DC2626',
  },
  warningText: {
    color: '#D97706',
  },
  loadingText: {
    color: colors.text,
  },
  subText: {
    fontSize: 10,
    opacity: 0.8,
  },
});

export default function SystemStatusIndicator({ onPress }: SystemStatusIndicatorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    runCheck();
    
    // Run periodic checks every 30 seconds
    const interval = setInterval(runQuickCheck, 30000);
    return () => clearInterval(interval);
  }, [runQuickCheck]);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running full system check...');
      const result = await performSystemCheck();
      setSystemCheck(result);
      setLastChecked(new Date());
      console.log('✅ System check completed:', result.criticalIssues.length === 0 ? 'Healthy' : 'Issues found');
    } catch (error) {
      console.log('❌ System check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickCheck = useCallback(async () => {
    try {
      const health = await quickHealthCheck();
      if (systemCheck) {
        setSystemCheck({
          ...systemCheck,
          criticalIssues: health.criticalIssues,
          timestamp: new Date().toISOString(),
        });
      }
      setLastChecked(new Date());
    } catch (error) {
      console.log('Quick health check failed:', error);
    }
  }, [systemCheck]);

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: 'sync' as keyof typeof Ionicons.glyphMap,
        text: 'Checking...',
        subText: 'System status',
        style: styles.loading,
        textStyle: styles.loadingText,
        iconColor: colors.text,
      };
    }

    if (!systemCheck) {
      return {
        icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        text: 'Check Failed',
        subText: 'Tap to retry',
        style: styles.unhealthy,
        textStyle: styles.unhealthyText,
        iconColor: '#DC2626',
      };
    }

    const hasCriticalIssues = systemCheck.criticalIssues.length > 0;
    const hasErrors = systemCheck.errors.length > 0;
    const hasWarnings = systemCheck.warnings.length > 0;

    if (hasCriticalIssues || hasErrors) {
      const apiKeyIssue = systemCheck.criticalIssues.some(issue => 
        issue.includes('OpenAI API key') || issue.includes('placeholder')
      );
      
      return {
        icon: 'warning' as keyof typeof Ionicons.glyphMap,
        text: apiKeyIssue ? 'API Key Required' : 'Configuration Error',
        subText: apiKeyIssue ? 'OpenAI not configured' : `${systemCheck.criticalIssues.length + systemCheck.errors.length} issue(s)`,
        style: styles.unhealthy,
        textStyle: styles.unhealthyText,
        iconColor: '#DC2626',
      };
    }

    if (hasWarnings) {
      return {
        icon: 'alert' as keyof typeof Ionicons.glyphMap,
        text: 'Minor Issues',
        subText: `${systemCheck.warnings.length} warning(s)`,
        style: styles.warning,
        textStyle: styles.warningText,
        iconColor: '#D97706',
      };
    }

    return {
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      text: 'All Systems OK',
      subText: 'AI ready',
      style: styles.healthy,
      textStyle: styles.healthyText,
      iconColor: '#22C55E',
    };
  };

  const formatLastChecked = () => {
    if (!lastChecked) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastChecked.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[styles.container, statusInfo.style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Ionicons name={statusInfo.icon} size={16} color={statusInfo.iconColor} />
      )}
      
      <View style={{ flex: 1 }}>
        <Text style={[styles.text, statusInfo.textStyle]}>
          {statusInfo.text}
        </Text>
        <Text style={[styles.subText, statusInfo.textStyle]}>
          {statusInfo.subText} {lastChecked && `• ${formatLastChecked()}`}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={12} color={statusInfo.textStyle.color} />
    </TouchableOpacity>
  );
}
