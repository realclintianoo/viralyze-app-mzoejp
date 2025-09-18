
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { quickHealthCheck } from '../utils/systemCheck';

interface StartupNotificationProps {
  onDismiss?: () => void;
}

export default function StartupNotification({ onDismiss }: StartupNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [criticalIssues, setCriticalIssues] = useState<string[]>([]);
  const slideAnim = useState(new Animated.Value(-100))[0];

  const checkSystemOnStartup = async () => {
    try {
      console.log('🚀 Running startup system check...');
      const health = await quickHealthCheck();
      
      setSystemHealthy(health.healthy);
      setCriticalIssues(health.criticalIssues);
      
      if (!health.healthy && health.criticalIssues.length > 0) {
        console.log('⚠️ Critical issues detected on startup:', health.criticalIssues);
        showNotification();
      } else {
        console.log('✅ System healthy on startup');
      }
    } catch (error) {
      console.error('❌ Startup system check failed:', error);
      setSystemHealthy(false);
      setCriticalIssues(['System check failed to run']);
      showNotification();
    }
  };

  useEffect(() => {
    checkSystemOnStartup();
  }, [checkSystemOnStartup]);

  const showNotification = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  const handleFixConfiguration = () => {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'not set';
    
    Alert.alert(
      'OpenAI Configuration Required',
      `AI features are not working because of configuration issues.\n\nCurrent API key: "${apiKey}"\n\nTo fix this:\n\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key (or copy an existing one)\n3. Open the .env file in your project root\n4. Replace the current value with your actual API key\n5. Restart the development server\n6. Make sure billing is set up in your OpenAI account\n\nYour API key should start with "sk-proj-" and be about 164 characters long.`,
      [
        { text: 'Open OpenAI Dashboard', onPress: () => Linking.openURL('https://platform.openai.com/api-keys') },
        { text: 'Dismiss', onPress: hideNotification, style: 'cancel' }
      ]
    );
  };

  const getMessage = () => {
    if (criticalIssues.includes('OpenAI API key missing')) {
      return 'OpenAI API key not found. AI features will not work.';
    } else if (criticalIssues.includes('OpenAI API key is placeholder')) {
      return 'OpenAI API key is still set to placeholder value. Please replace it with your actual key.';
    } else if (criticalIssues.includes('Invalid OpenAI API key format')) {
      return 'OpenAI API key format appears invalid. Please check your key.';
    } else if (criticalIssues.includes('OpenAI initialization failed')) {
      return 'OpenAI client failed to initialize. Please check your configuration.';
    } else {
      return 'System configuration issues detected. AI features may not work properly.';
    }
  };

  if (!visible || systemHealthy) {
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <Text style={styles.title}>Configuration Required</Text>
          <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.message}>
          {getMessage()}
        </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.fixButton}
            onPress={handleFixConfiguration}
          >
            <Text style={styles.fixButtonText}>Fix Configuration</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={hideNotification}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    padding: 16,
    paddingTop: 60, // Account for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  fixButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  fixButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  dismissButtonText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
