
import { Platform } from 'react-native';
import { checkOpenAIConfig } from '../lib/ai';

export interface SystemCheckResult {
  platform: string;
  openaiConfigured: boolean;
  hasApiKey: boolean;
  polyfillsLoaded: boolean;
  errors: string[];
}

export const performSystemCheck = (): SystemCheckResult => {
  const errors: string[] = [];
  
  // Check OpenAI configuration
  const openaiConfig = checkOpenAIConfig();
  
  // Check if URL polyfill is available
  let polyfillsLoaded = false;
  try {
    // Test if URL constructor is available
    new URL('https://example.com');
    polyfillsLoaded = true;
  } catch (error) {
    errors.push('URL polyfill not loaded properly');
    polyfillsLoaded = false;
  }
  
  // Check environment variables
  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    errors.push('EXPO_PUBLIC_OPENAI_API_KEY not set in environment');
  }
  
  if (process.env.EXPO_PUBLIC_OPENAI_API_KEY === 'your_openai_api_key_here') {
    errors.push('OpenAI API key is still set to placeholder value');
  }
  
  return {
    platform: Platform.OS,
    openaiConfigured: openaiConfig.isConfigured,
    hasApiKey: openaiConfig.hasApiKey,
    polyfillsLoaded,
    errors
  };
};

export const logSystemCheck = () => {
  const result = performSystemCheck();
  console.log('=== SYSTEM CHECK ===');
  console.log('Platform:', result.platform);
  console.log('OpenAI Configured:', result.openaiConfigured);
  console.log('Has API Key:', result.hasApiKey);
  console.log('Polyfills Loaded:', result.polyfillsLoaded);
  
  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach(error => console.log('  -', error));
  } else {
    console.log('✅ All checks passed');
  }
  console.log('==================');
  
  return result;
};
