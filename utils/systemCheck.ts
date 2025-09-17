
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
}

export const performSystemCheck = async (): Promise<SystemCheckResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('🔍 Starting system check...');
  
  // Check OpenAI configuration
  const openaiConfig = checkOpenAIConfig();
  
  // Check if URL polyfill is available
  let polyfillsLoaded = false;
  try {
    // Test if URL constructor is available
    new URL('https://example.com');
    polyfillsLoaded = true;
    console.log('✅ URL polyfill loaded successfully');
  } catch (error) {
    errors.push('URL polyfill not loaded properly - this may cause OpenAI API calls to fail');
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
  } else if (envVars.openaiKey === 'your_openai_api_key_here') {
    errors.push('OpenAI API key is still set to placeholder value');
  } else if (!envVars.openaiKey.startsWith('sk-')) {
    warnings.push('OpenAI API key format appears invalid (should start with sk-)');
  } else if (envVars.openaiKey.length < 40) {
    warnings.push('OpenAI API key appears to be too short');
  }
  
  // Enhanced Supabase validation
  if (!envVars.supabaseUrl) {
    warnings.push('EXPO_PUBLIC_SUPABASE_URL not set in environment');
  } else if (!envVars.supabaseUrl.includes('supabase.co')) {
    warnings.push('Supabase URL format appears invalid');
  }
  
  if (!envVars.supabaseKey) {
    warnings.push('EXPO_PUBLIC_SUPABASE_ANON_KEY not set in environment');
  } else if (envVars.supabaseKey.length < 100) {
    warnings.push('Supabase anonymous key appears to be too short');
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
  
  const result = {
    platform: Platform.OS,
    openaiConfigured: openaiConfig.isConfigured,
    hasApiKey: openaiConfig.hasApiKey,
    polyfillsLoaded,
    networkConnectivity,
    environmentVariables: envVars,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0', // You can get this from package.json or app.json
  };
  
  console.log('🔍 System check completed:', result);
  return result;
};

export const logSystemCheck = async () => {
  const result = await performSystemCheck();
  console.log('=== SYSTEM CHECK REPORT ===');
  console.log('Timestamp:', result.timestamp);
  console.log('App Version:', result.appVersion);
  console.log('Platform:', result.platform);
  console.log('OpenAI Configured:', result.openaiConfigured);
  console.log('Has API Key:', result.hasApiKey);
  console.log('Polyfills Loaded:', result.polyfillsLoaded);
  console.log('Network Connectivity:', result.networkConnectivity);
  
  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach(error => console.log('  -', error));
  }
  
  if (result.warnings.length > 0) {
    console.log('⚠️ WARNINGS:');
    result.warnings.forEach(warning => console.log('  -', warning));
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ All checks passed');
  }
  
  console.log('============================');
  
  return result;
};

export const checkOpenAIConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🔗 Testing OpenAI connection...');
    
    const openaiConfig = checkOpenAIConfig();
    if (!openaiConfig.isConfigured) {
      return {
        success: false,
        message: 'OpenAI not configured - missing API key or client initialization failed'
      };
    }
    
    // Test with a simple completion with timeout
    const { aiComplete } = await import('../lib/ai');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const result = await aiComplete({
        kind: 'connection-test',
        profile: null,
        input: 'Respond with exactly: "Connection successful"',
        n: 1,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (result && result[0] && result[0].toLowerCase().includes('connection successful')) {
        console.log('✅ OpenAI connection test passed');
        return {
          success: true,
          message: 'OpenAI connection successful',
          details: { response: result[0] }
        };
      } else {
        console.log('⚠️ OpenAI responded but with unexpected content');
        return {
          success: true,
          message: 'OpenAI connection works but response was unexpected',
          details: { response: result[0] }
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
    if (error.name === 'AbortError') {
      errorCategory = 'Timeout';
    } else if (error.message?.includes('401') || error.message?.includes('Invalid')) {
      errorCategory = 'Authentication';
    } else if (error.message?.includes('429')) {
      errorCategory = 'Rate Limit';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorCategory = 'Network';
    }
    
    return {
      success: false,
      message: `${errorCategory}: ${error.message}`,
      details: { 
        error: error.toString(),
        category: errorCategory,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack
      }
    };
  }
};

export const generateSystemReport = async (): Promise<string> => {
  const systemCheck = await performSystemCheck();
  const connectionTest = await checkOpenAIConnection();
  
  const report = `
VIRALYZE System Report
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
OpenAI Key: ${systemCheck.environmentVariables.openaiKey ? `${systemCheck.environmentVariables.openaiKey.substring(0, 7)}...` : 'Not set'}
Supabase URL: ${systemCheck.environmentVariables.supabaseUrl || 'Not set'}
Supabase Key: ${systemCheck.environmentVariables.supabaseKey ? `${systemCheck.environmentVariables.supabaseKey.substring(0, 10)}...` : 'Not set'}

=== ISSUES ===
${systemCheck.errors.length > 0 ? `ERRORS (${systemCheck.errors.length}):\n${systemCheck.errors.map(e => `- ${e}`).join('\n')}` : 'No errors found ✅'}

${systemCheck.warnings.length > 0 ? `WARNINGS (${systemCheck.warnings.length}):\n${systemCheck.warnings.map(w => `- ${w}`).join('\n')}` : 'No warnings ✅'}

=== RECOMMENDATIONS ===
${systemCheck.errors.length > 0 ? '1. Fix the errors listed above before using AI features' : ''}
${!systemCheck.hasApiKey ? '2. Add your OpenAI API key to the .env file' : ''}
${!systemCheck.networkConnectivity ? '3. Check your internet connection' : ''}
${systemCheck.warnings.length > 0 ? '4. Review warnings for potential issues' : ''}
${systemCheck.errors.length === 0 && systemCheck.warnings.length === 0 ? 'System is properly configured! 🎉' : ''}

=== TROUBLESHOOTING ===
If you're experiencing issues:
1. Ensure your .env file is in the project root
2. Restart the development server after changing environment variables
3. Check that your OpenAI API key has sufficient credits
4. Verify your internet connection is stable
5. Try the connection test in the debug tools

For more help, visit: https://platform.openai.com/docs
`;

  return report.trim();
};

// Quick health check function for periodic monitoring
export const quickHealthCheck = async (): Promise<{ healthy: boolean; criticalIssues: string[] }> => {
  try {
    const systemCheck = await performSystemCheck();
    const criticalIssues = systemCheck.errors.filter(error => 
      error.includes('API key') || 
      error.includes('polyfill') || 
      error.includes('placeholder')
    );
    
    return {
      healthy: criticalIssues.length === 0,
      criticalIssues
    };
  } catch (error) {
    return {
      healthy: false,
      criticalIssues: ['System check failed to run']
    };
  }
};
