
import { Platform } from 'react-native';
import { checkOpenAIConfig } from '../lib/ai';

export interface SystemCheckResult {
  platform: string;
  openaiConfigured: boolean;
  hasApiKey: boolean;
  polyfillsLoaded: boolean;
  networkConnectivity: boolean;
  environmentVariables: {
    openaiKey: string;
    supabaseUrl: string;
    supabaseKey: string;
  };
  errors: string[];
  warnings: string[];
  timestamp: string;
  appVersion: string;
  criticalIssues: string[];
}

const PLACEHOLDER_VALUES = [
  'your_openai_api_key_here',
  'REPLACE_WITH_YOUR_ACTUAL_OPENAI_API_KEY',
  'sk-your-api-key-here',
  'your-api-key-here'
];

export const performSystemCheck = async (): Promise<SystemCheckResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const criticalIssues: string[] = [];
  
  console.log('🔍 Starting comprehensive system check...');
  
  // Check OpenAI configuration
  const openaiConfig = checkOpenAIConfig();
  console.log('OpenAI Config:', openaiConfig);
  
  // Check if URL polyfill is available
  let polyfillsLoaded = false;
  try {
    // Test if URL constructor is available
    new URL('https://example.com');
    polyfillsLoaded = true;
    console.log('✅ URL polyfill loaded successfully');
  } catch (error) {
    errors.push('URL polyfill not loaded properly - this may cause OpenAI API calls to fail');
    criticalIssues.push('URL polyfill missing');
    polyfillsLoaded = false;
    console.log('❌ URL polyfill failed to load');
  }
  
  // Check network connectivity with timeout
  let networkConnectivity = false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    networkConnectivity = response.ok || response.status === 401; // 401 is expected without API key
    console.log('✅ Network connectivity check passed');
  } catch (error: any) {
    if (error.name === 'AbortError') {
      warnings.push('Network connectivity check timed out - slow connection detected');
    } else {
      warnings.push('Network connectivity check failed - may affect API calls');
    }
    networkConnectivity = false;
    console.log('⚠️ Network connectivity check failed:', error.message);
  }
  
  // Check environment variables
  const envVars = {
    openaiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  };
  
  // Enhanced OpenAI API key validation
  if (!envVars.openaiKey) {
    errors.push('EXPO_PUBLIC_OPENAI_API_KEY not set in environment');
    criticalIssues.push('OpenAI API key missing');
  } else if (PLACEHOLDER_VALUES.includes(envVars.openaiKey)) {
    errors.push(`OpenAI API key is still set to placeholder value: "${envVars.openaiKey}". Please replace with your actual API key from https://platform.openai.com/api-keys`);
    criticalIssues.push('OpenAI API key is placeholder');
  } else if (!envVars.openaiKey.startsWith('sk-')) {
    warnings.push('OpenAI API key format appears invalid (should start with sk-)');
    criticalIssues.push('Invalid OpenAI API key format');
  } else if (envVars.openaiKey.length < 40) {
    warnings.push('OpenAI API key appears to be too short');
    criticalIssues.push('OpenAI API key too short');
  } else {
    console.log('✅ OpenAI API key format looks valid');
  }
  
  // Enhanced Supabase validation
  if (!envVars.supabaseUrl) {
    warnings.push('EXPO_PUBLIC_SUPABASE_URL not set in environment');
  } else if (!envVars.supabaseUrl.includes('supabase.co')) {
    warnings.push('Supabase URL format appears invalid');
  } else {
    console.log('✅ Supabase URL looks valid');
  }
  
  if (!envVars.supabaseKey) {
    warnings.push('EXPO_PUBLIC_SUPABASE_ANON_KEY not set in environment');
  } else if (envVars.supabaseKey === 'your_supabase_anon_key_here') {
    warnings.push('Supabase anon key is still set to placeholder value');
  } else if (envVars.supabaseKey.length < 100) {
    warnings.push('Supabase anonymous key appears to be too short');
  } else {
    console.log('✅ Supabase anon key looks valid');
  }
  
  // Check React Native specific configurations
  if (Platform.OS === 'web') {
    warnings.push('Running on web platform - some features may be limited');
  }
  
  // Check for development vs production
  if (__DEV__) {
    console.log('ℹ️ Running in development mode');
  } else {
    warnings.push('Running in production mode - ensure all environment variables are properly set');
  }
  
  // Add initialization error if present
  if (openaiConfig.initializationError) {
    errors.push(`OpenAI initialization failed: ${openaiConfig.initializationError}`);
    if (!criticalIssues.some(issue => issue.includes('OpenAI'))) {
      criticalIssues.push('OpenAI initialization failed');
    }
  }
  
  const result = {
    platform: Platform.OS,
    openaiConfigured: openaiConfig.isConfigured,
    hasApiKey: openaiConfig.hasApiKey,
    polyfillsLoaded,
    networkConnectivity,
    environmentVariables: envVars,
    errors,
    warnings,
    criticalIssues,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0',
  };
  
  console.log('🔍 System check completed:', result);
  
  // Log critical issues prominently
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES DETECTED:');
    criticalIssues.forEach(issue => console.log(`  ❌ ${issue}`));
    console.log('🚨 AI features will not work until these issues are resolved!');
  }
  
  return result;
};

export const logSystemCheck = async () => {
  const result = await performSystemCheck();
  console.log('=== VIRALYZE SYSTEM CHECK REPORT ===');
  console.log('Timestamp:', result.timestamp);
  console.log('App Version:', result.appVersion);
  console.log('Platform:', result.platform);
  console.log('OpenAI Configured:', result.openaiConfigured);
  console.log('Has API Key:', result.hasApiKey);
  console.log('Polyfills Loaded:', result.polyfillsLoaded);
  console.log('Network Connectivity:', result.networkConnectivity);
  
  if (result.criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    result.criticalIssues.forEach(issue => console.log('  -', issue));
  }
  
  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach(error => console.log('  -', error));
  }
  
  if (result.warnings.length > 0) {
    console.log('⚠️ WARNINGS:');
    result.warnings.forEach(warning => console.log('  -', warning));
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ All checks passed - AI should work properly!');
  }
  
  console.log('====================================');
  
  return result;
};

export const checkOpenAIConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🔗 Testing OpenAI connection...');
    
    const openaiConfig = checkOpenAIConfig();
    if (!openaiConfig.isConfigured) {
      let message = 'OpenAI not configured';
      
      if (openaiConfig.initializationError) {
        message += ` - ${openaiConfig.initializationError}`;
      } else if (!openaiConfig.hasApiKey) {
        message += ' - missing API key';
      } else if (!openaiConfig.isValidKey) {
        message += ' - API key is placeholder value';
      } else {
        message += ' - client initialization failed';
      }
      
      return {
        success: false,
        message
      };
    }
    
    // Check if API key is still placeholder
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (PLACEHOLDER_VALUES.includes(apiKey || '')) {
      return {
        success: false,
        message: `OpenAI API key is still set to placeholder value: "${apiKey}". Please replace with your actual API key from https://platform.openai.com/api-keys`
      };
    }
    
    // Test with a simple completion with timeout
    const { aiComplete } = await import('../lib/ai');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      console.log('🧪 Testing AI completion with simple prompt...');
      const result = await aiComplete({
        kind: 'connection-test',
        profile: null,
        input: 'Respond with exactly: "Connection successful"',
        n: 1,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (result && result[0]) {
        console.log('✅ OpenAI connection test passed, response:', result[0]);
        return {
          success: true,
          message: 'OpenAI connection successful',
          details: { response: result[0] }
        };
      } else {
        console.log('⚠️ OpenAI responded but with empty content');
        return {
          success: false,
          message: 'OpenAI connection works but returned empty response',
          details: { response: result }
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    console.log('❌ OpenAI connection test failed:', error.message);
    
    // Enhanced error categorization
    let errorCategory = 'Unknown';
    let userFriendlyMessage = error.message;
    
    if (error.name === 'AbortError') {
      errorCategory = 'Timeout';
      userFriendlyMessage = 'Connection test timed out. Check your internet connection.';
    } else if (error.message?.includes('401') || error.message?.includes('Invalid')) {
      errorCategory = 'Authentication';
      userFriendlyMessage = 'Invalid OpenAI API key. Please check your API key in the .env file.';
    } else if (error.message?.includes('429')) {
      errorCategory = 'Rate Limit';
      userFriendlyMessage = 'OpenAI API rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorCategory = 'Network';
      userFriendlyMessage = 'Network error. Please check your internet connection.';
    } else if (error.message?.includes('browser-like environment')) {
      errorCategory = 'Configuration';
      userFriendlyMessage = 'OpenAI configuration error. Please restart the app.';
    } else if (error.message?.includes('placeholder')) {
      errorCategory = 'Configuration';
      userFriendlyMessage = 'OpenAI API key is still set to placeholder value. Please replace with your actual key.';
    }
    
    return {
      success: false,
      message: `${errorCategory}: ${userFriendlyMessage}`,
      details: { 
        error: error.toString(),
        category: errorCategory,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
    };
  }
};

export const generateSystemReport = async (): Promise<string> => {
  const systemCheck = await performSystemCheck();
  const connectionTest = await checkOpenAIConnection();
  
  const apiKey = systemCheck.environmentVariables.openaiKey;
  const isPlaceholder = PLACEHOLDER_VALUES.includes(apiKey);
  
  const report = `
VIRALYZE System Diagnostic Report
Generated: ${systemCheck.timestamp}
App Version: ${systemCheck.appVersion}

=== PLATFORM INFO ===
Platform: ${systemCheck.platform}
Development Mode: ${__DEV__ ? 'Yes' : 'No'}
React Native Version: ${Platform.constants?.reactNativeVersion?.major}.${Platform.constants?.reactNativeVersion?.minor}.${Platform.constants?.reactNativeVersion?.patch}

=== CONFIGURATION STATUS ===
OpenAI Configured: ${systemCheck.openaiConfigured ? '✅' : '❌'}
Has API Key: ${systemCheck.hasApiKey ? '✅' : '❌'}
Polyfills Loaded: ${systemCheck.polyfillsLoaded ? '✅' : '❌'}
Network Connectivity: ${systemCheck.networkConnectivity ? '✅' : '❌'}

=== CONNECTION TEST ===
OpenAI Connection: ${connectionTest.success ? '✅' : '❌'}
Test Message: ${connectionTest.message}
${connectionTest.details ? `Details: ${JSON.stringify(connectionTest.details, null, 2)}` : ''}

=== ENVIRONMENT VARIABLES ===
OpenAI Key: ${!apiKey ? '❌ Not set' : 
  isPlaceholder ? `❌ PLACEHOLDER VALUE: "${apiKey}"` : 
  `✅ ${apiKey.substring(0, 7)}...`}
Supabase URL: ${systemCheck.environmentVariables.supabaseUrl || 'Not set'}
Supabase Key: ${systemCheck.environmentVariables.supabaseKey ? 
  (systemCheck.environmentVariables.supabaseKey === 'your_supabase_anon_key_here' ? 
    '⚠️ PLACEHOLDER VALUE' : 
    `✅ ${systemCheck.environmentVariables.supabaseKey.substring(0, 10)}...`) : 
  'Not set'}

=== CRITICAL ISSUES ===
${systemCheck.criticalIssues.length > 0 ? 
  `🚨 ${systemCheck.criticalIssues.length} critical issue(s) found:\n${systemCheck.criticalIssues.map(i => `- ${i}`).join('\n')}` : 
  '✅ No critical issues found'}

=== ISSUES ===
${systemCheck.errors.length > 0 ? `ERRORS (${systemCheck.errors.length}):\n${systemCheck.errors.map(e => `- ${e}`).join('\n')}` : 'No errors found ✅'}

${systemCheck.warnings.length > 0 ? `WARNINGS (${systemCheck.warnings.length}):\n${systemCheck.warnings.map(w => `- ${w}`).join('\n')}` : 'No warnings ✅'}

=== QUICK FIX GUIDE ===
${isPlaceholder ? 
`🔧 TO FIX AI GENERATION:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key (or copy an existing one)
3. Open the .env file in your project root
4. Replace "${apiKey}" with your actual API key
5. Restart the development server (stop and run 'npm run dev' again)
6. Test the AI generation again

Your API key should look like: sk-proj-1234567890abcdef...

IMPORTANT: Make sure you have billing set up in your OpenAI account!` : ''}

=== TROUBLESHOOTING ===
If you're still experiencing issues:
1. Ensure your .env file is in the project root directory
2. Restart the development server after changing environment variables
3. Check that your OpenAI API key has sufficient credits
4. Verify your internet connection is stable
5. Try the connection test in the debug tools (Settings → System Status)
6. Check the console logs for detailed error messages

For more help:
- OpenAI Documentation: https://platform.openai.com/docs
- OpenAI API Keys: https://platform.openai.com/api-keys
- OpenAI Billing: https://platform.openai.com/account/billing

${systemCheck.criticalIssues.length === 0 && systemCheck.errors.length === 0 ? 
  '🎉 System is properly configured! AI should work perfectly.' : 
  '⚠️ Please fix the issues above for AI to work properly.'}
`;

  return report.trim();
};

// Quick health check function for periodic monitoring
export const quickHealthCheck = async (): Promise<{ healthy: boolean; criticalIssues: string[] }> => {
  try {
    const systemCheck = await performSystemCheck();
    
    return {
      healthy: systemCheck.criticalIssues.length === 0,
      criticalIssues: systemCheck.criticalIssues
    };
  } catch (error) {
    return {
      healthy: false,
      criticalIssues: ['System check failed to run']
    };
  }
};
