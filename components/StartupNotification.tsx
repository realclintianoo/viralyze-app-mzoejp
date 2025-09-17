
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default function StartupNotification({ onDismiss }: StartupNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [criticalIssues, setCriticalIssues] = useState<string[]>([]);

  useEffect(() => {
    checkSystemOnStartup();
  }, []);

  const checkSystemOnStartup = async () => {
    try {
      console.log('🚀 Running startup system check...');
      const health = await quickHealthCheck();
      
      if (!health.healthy) {
        console.log('🚨 Critical issues detected on startup:', health.criticalIssues);
        setCriticalIssues(health.criticalIssues);
        showNotification();
      } else {
        console.log('✅ System healthy on startup');
      }
    } catch (error) {
      console.log('❌ Startup system check failed:', error);
      setCriticalIssues(['System check failed']);
      showNotification();
    }
  };

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
    const hasApiKeyIssue = criticalIssues.some(issue => 
      issue.includes('OpenAI API key') || issue.includes('placeholder')
    );

    if (hasApiKeyIssue) {
      Alert.alert(
        'OpenAI API Key Required',
        'To use AI features, you need to:\n\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Open the .env file in your project\n4. Replace "your_openai_api_key_here" with your actual key\n5. Restart the app\n\nWould you like to open the OpenAI website?',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Open Website', 
            onPress: () => Linking.openURL('https://platform.openai.com/api-keys')
          },
        ]
      );
    } else {
      Alert.alert(
        'Configuration Issues',
        `Found ${criticalIssues.length} critical issue(s):\n\n${criticalIssues.map(issue => `• ${issue}`).join('\n')}\n\nPlease check your configuration and restart the app.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getMessage = () => {
    const hasApiKeyIssue = criticalIssues.some(issue => 
      issue.includes('OpenAI API key') || issue.includes('placeholder')
    );

    if (hasApiKeyIssue) {
      return {
        title: 'OpenAI API Key Required',
        message: 'AI features won\'t work until you configure your OpenAI API key in the .env file.',
      };
    }

    return {
      title: 'Configuration Issues Detected',
      message: `${criticalIssues.length} critical issue(s) found. AI features may not work properly.`,
    };
  };

  if (!visible) return null;

  const { title, message } = getMessage();

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="warning" size={20} color="#DC2626" />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleFixConfiguration}
        >
          <Text style={styles.actionText}>Fix</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideNotification}
        >
          <Ionicons name="close" size={16} color="#B91C1C" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
