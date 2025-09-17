
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';
import { aiComplete, aiImage, checkOpenAIConfig } from '../lib/ai';

interface OpenAITestButtonProps {
  onTestComplete?: (success: boolean, message: string) => void;
}

export default function OpenAITestButton({ onTestComplete }: OpenAITestButtonProps) {
  const [isTestingText, setIsTestingText] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{
    text?: { success: boolean; message: string };
    image?: { success: boolean; message: string };
  }>({});

  const testTextGeneration = async () => {
    setIsTestingText(true);
    
    try {
      console.log('🧪 Testing OpenAI text generation...');
      
      const config = checkOpenAIConfig();
      console.log('OpenAI Config:', config);
      
      if (!config.isConfigured) {
        throw new Error(config.initializationError || 'OpenAI not configured');
      }
      
      const result = await aiComplete({
        kind: 'test',
        profile: null,
        input: 'Respond with exactly: "OpenAI text generation is working!"',
        n: 1,
      });
      
      if (result && result[0]) {
        const message = 'Text generation test successful!';
        console.log('✅ Text generation test passed:', result[0]);
        setLastTestResult(prev => ({ ...prev, text: { success: true, message } }));
        onTestComplete?.(true, message);
        Alert.alert('Success', `${message}\n\nResponse: "${result[0]}"`);
      } else {
        throw new Error('Empty response from OpenAI');
      }
    } catch (error: any) {
      const message = `Text generation failed: ${error.message}`;
      console.error('❌ Text generation test failed:', error);
      setLastTestResult(prev => ({ ...prev, text: { success: false, message } }));
      onTestComplete?.(false, message);
      Alert.alert('Test Failed', message);
    } finally {
      setIsTestingText(false);
    }
  };

  const testImageGeneration = async () => {
    setIsTestingImage(true);
    
    try {
      console.log('🎨 Testing OpenAI image generation...');
      
      const config = checkOpenAIConfig();
      if (!config.isConfigured) {
        throw new Error(config.initializationError || 'OpenAI not configured');
      }
      
      const imageUrl = await aiImage({
        prompt: 'A simple test image of a blue circle on white background',
        size: '1024x1024',
      });
      
      if (imageUrl) {
        const message = 'Image generation test successful!';
        console.log('✅ Image generation test passed:', imageUrl);
        setLastTestResult(prev => ({ ...prev, image: { success: true, message } }));
        onTestComplete?.(true, message);
        Alert.alert('Success', `${message}\n\nImage URL: ${imageUrl.substring(0, 50)}...`);
      } else {
        throw new Error('No image URL returned from OpenAI');
      }
    } catch (error: any) {
      const message = `Image generation failed: ${error.message}`;
      console.error('❌ Image generation test failed:', error);
      setLastTestResult(prev => ({ ...prev, image: { success: false, message } }));
      onTestComplete?.(false, message);
      Alert.alert('Test Failed', message);
    } finally {
      setIsTestingImage(false);
    }
  };

  const getStatusIcon = (success?: boolean) => {
    if (success === undefined) return 'help-circle';
    return success ? 'checkmark-circle' : 'close-circle';
  };

  const getStatusColor = (success?: boolean) => {
    if (success === undefined) return colors.textSecondary;
    return success ? '#22C55E' : '#EF4444';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenAI Integration Test</Text>
      
      <View style={styles.testSection}>
        <View style={styles.testHeader}>
          <Text style={styles.testTitle}>Text Generation</Text>
          <Ionicons 
            name={getStatusIcon(lastTestResult.text?.success)} 
            size={20} 
            color={getStatusColor(lastTestResult.text?.success)} 
          />
        </View>
        
        <TouchableOpacity
          style={[styles.testButton, isTestingText && styles.testButtonDisabled]}
          onPress={testTextGeneration}
          disabled={isTestingText}
        >
          {isTestingText ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.testButtonText}>Test Text Generation</Text>
          )}
        </TouchableOpacity>
        
        {lastTestResult.text && (
          <Text style={[
            styles.resultText,
            { color: lastTestResult.text.success ? '#22C55E' : '#EF4444' }
          ]}>
            {lastTestResult.text.message}
          </Text>
        )}
      </View>

      <View style={styles.testSection}>
        <View style={styles.testHeader}>
          <Text style={styles.testTitle}>Image Generation</Text>
          <Ionicons 
            name={getStatusIcon(lastTestResult.image?.success)} 
            size={20} 
            color={getStatusColor(lastTestResult.image?.success)} 
          />
        </View>
        
        <TouchableOpacity
          style={[styles.testButton, isTestingImage && styles.testButtonDisabled]}
          onPress={testImageGeneration}
          disabled={isTestingImage}
        >
          {isTestingImage ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.testButtonText}>Test Image Generation</Text>
          )}
        </TouchableOpacity>
        
        {lastTestResult.image && (
          <Text style={[
            styles.resultText,
            { color: lastTestResult.image.success ? '#22C55E' : '#EF4444' }
          ]}>
            {lastTestResult.image.message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  testButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
