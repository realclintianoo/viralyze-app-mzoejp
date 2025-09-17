
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { performSystemCheck, checkOpenAIConnection, generateSystemReport, SystemCheckResult } from '../utils/systemCheck';
import { aiComplete, aiImage } from '../lib/ai';

interface OpenAIDebugProps {
  visible: boolean;
  onClose: () => void;
}

export default function OpenAIDebug({ visible, onClose }: OpenAIDebugProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [imageTestResult, setImageTestResult] = useState<string | null>(null);
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      runSystemCheck();
    }
  }, [visible]);

  const runSystemCheck = async () => {
    setIsLoading(true);
    try {
      const result = await performSystemCheck();
      setSystemCheck(result);
    } catch (error) {
      console.error('System check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await checkOpenAIConnection();
      
      if (result.success) {
        setTestResult(`✅ ${result.message}\nResponse: ${result.details?.response || 'No response details'}`);
      } else {
        setTestResult(`❌ ${result.message}\nDetails: ${result.details?.error || 'No error details'}`);
      }
    } catch (error: any) {
      setTestResult(`❌ Unexpected error: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestImage = async () => {
    setIsTestingImage(true);
    setImageTestResult(null);

    try {
      const imageUrl = await aiImage({
        prompt: 'A simple test image of a blue circle on white background',
        size: '1024x1024'
      });

      if (imageUrl) {
        setImageTestResult(`✅ Image generation successful\nURL: ${imageUrl.substring(0, 50)}...`);
      } else {
        setImageTestResult('❌ No image URL returned');
      }
    } catch (error: any) {
      setImageTestResult(`❌ Image generation failed: ${error.message}`);
    } finally {
      setIsTestingImage(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateSystemReport();
      
      // Try to share the report
      try {
        await Share.share({
          message: report,
          title: 'VIRALYZE System Report',
        });
      } catch (shareError) {
        // If sharing fails, show in alert
        Alert.alert(
          'System Report',
          report,
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to generate report: ${error.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status: boolean) => {
    return status ? colors.accent : '#ef4444';
  };

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.title, { marginTop: 16 }]}>Running System Check...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>OpenAI Debug Tools</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* System Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Platform</Text>
                <Text style={styles.statusValue}>{systemCheck?.platform}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>OpenAI Config</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(systemCheck?.openaiConfigured || false) }]}>
                  {getStatusIcon(systemCheck?.openaiConfigured || false)}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>API Key</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(systemCheck?.hasApiKey || false) }]}>
                  {getStatusIcon(systemCheck?.hasApiKey || false)}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Polyfills</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(systemCheck?.polyfillsLoaded || false) }]}>
                  {getStatusIcon(systemCheck?.polyfillsLoaded || false)}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Network</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(systemCheck?.networkConnectivity || false) }]}>
                  {getStatusIcon(systemCheck?.networkConnectivity || false)}
                </Text>
              </View>
            </View>
          </View>

          {/* Issues */}
          {(systemCheck?.errors.length || 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Errors</Text>
              <View style={styles.issuesContainer}>
                {systemCheck?.errors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {(systemCheck?.warnings.length || 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Warnings</Text>
              <View style={styles.issuesContainer}>
                {systemCheck?.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>
                    • {warning}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Connection Tests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Tests</Text>
            
            <TouchableOpacity
              style={[styles.testButton, { opacity: (!systemCheck?.openaiConfigured || isTestingConnection) ? 0.5 : 1 }]}
              onPress={handleTestConnection}
              disabled={isTestingConnection || !systemCheck?.openaiConfigured}
            >
              {isTestingConnection ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.testButtonText}>Test Text Generation</Text>
              )}
            </TouchableOpacity>

            {testResult && (
              <View style={styles.testResult}>
                <Text style={styles.testResultText}>{testResult}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.testButton, { opacity: (!systemCheck?.openaiConfigured || isTestingImage) ? 0.5 : 1, marginTop: 12 }]}
              onPress={handleTestImage}
              disabled={isTestingImage || !systemCheck?.openaiConfigured}
            >
              {isTestingImage ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.testButtonText}>Test Image Generation</Text>
              )}
            </TouchableOpacity>

            {imageTestResult && (
              <View style={styles.testResult}>
                <Text style={styles.testResultText}>{imageTestResult}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={runSystemCheck}
            >
              <Ionicons name="refresh" size={20} color={colors.accent} />
              <Text style={[styles.actionButtonText, { color: colors.accent }]}>Refresh System Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent, marginTop: 12 }]}
              onPress={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color={colors.background} />
                  <Text style={[styles.actionButtonText, { color: colors.background }]}>Generate Full Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Setup Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setup Instructions</Text>
            <View style={styles.instructionsContainer}>
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
              <Text style={styles.instructionText}>
                5. Test the connection using the buttons above
              </Text>
            </View>
          </View>

          <View style={{ height: 50 }} />
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  issuesContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
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
    marginTop: 12,
  },
  testResultText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    minHeight: 50,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});
