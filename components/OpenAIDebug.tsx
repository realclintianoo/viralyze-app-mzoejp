
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { performSystemCheck } from '../utils/systemCheck';
import { aiComplete } from '../lib/ai';

interface OpenAIDebugProps {
  visible: boolean;
  onClose: () => void;
}

export default function OpenAIDebug({ visible, onClose }: OpenAIDebugProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await aiComplete({
        kind: 'test',
        profile: null,
        input: 'Say "Hello, VIRALYZE is working!" in exactly those words.',
        n: 1,
      });

      if (result && result[0]) {
        setTestResult(`✅ Success: ${result[0]}`);
      } else {
        setTestResult('❌ No response received');
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const systemCheck = performSystemCheck();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>OpenAI Debug</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Check</Text>
            <View style={styles.checkItem}>
              <Text style={styles.checkLabel}>Platform:</Text>
              <Text style={styles.checkValue}>{systemCheck.platform}</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkLabel}>OpenAI Configured:</Text>
              <Text style={[styles.checkValue, { color: systemCheck.openaiConfigured ? colors.accent : colors.error }]}>
                {systemCheck.openaiConfigured ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkLabel}>Has API Key:</Text>
              <Text style={[styles.checkValue, { color: systemCheck.hasApiKey ? colors.accent : colors.error }]}>
                {systemCheck.hasApiKey ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkLabel}>Polyfills Loaded:</Text>
              <Text style={[styles.checkValue, { color: systemCheck.polyfillsLoaded ? colors.accent : colors.error }]}>
                {systemCheck.polyfillsLoaded ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
          </View>

          {systemCheck.errors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Errors</Text>
              {systemCheck.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Test</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestConnection}
              disabled={isTestingConnection || !systemCheck.openaiConfigured}
            >
              <Text style={styles.testButtonText}>
                {isTestingConnection ? 'Testing...' : 'Test OpenAI Connection'}
              </Text>
            </TouchableOpacity>

            {testResult && (
              <View style={styles.testResult}>
                <Text style={styles.testResultText}>{testResult}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setup Instructions</Text>
            <Text style={styles.instructionText}>
              1. Get your OpenAI API key from https://platform.openai.com/api-keys
            </Text>
            <Text style={styles.instructionText}>
              2. Add it to your .env file as EXPO_PUBLIC_OPENAI_API_KEY
            </Text>
            <Text style={styles.instructionText}>
              3. Restart the development server
            </Text>
            <Text style={styles.instructionText}>
              4. Make sure you have billing set up in your OpenAI account
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  checkValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  testResult: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  testResultText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});
