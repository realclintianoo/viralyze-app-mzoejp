
import { checkOpenAIConfig } from '../lib/ai';
import { checkSupabaseConfig } from '../app/integrations/supabase/client';

export const logSystemStatus = () => {
  console.log('=== VIRALYZE SYSTEM STATUS ===');
  
  // Environment Variables
  console.log('Environment Variables:');
  const openaiConfig = checkOpenAIConfig();
  const supabaseConfig = checkSupabaseConfig();
  
  console.log('- OpenAI API Key:', openaiConfig.hasApiKey ? 'configured (masked)' : 'missing');
  console.log('- Supabase URL:', supabaseConfig.url ? 'configured' : 'missing');
  console.log('- Supabase Key:', supabaseConfig.key ? 'configured (masked)' : 'missing');
  
  // Configuration Status
  console.log('\nConfiguration Status:');
  console.log('- OpenAI:', openaiConfig.isConfigured ? '✅ Ready' : '❌ Not configured');
  console.log('- Supabase:', supabaseConfig.isConfigured ? '✅ Ready' : '⚠️ Incomplete');
  
  // Overall Status
  const allConfigured = openaiConfig.isConfigured && supabaseConfig.isConfigured;
  console.log('\nOverall Status:', allConfigured ? '✅ Ready: OpenAI + Supabase connected; quota active' : '⚠️ Configuration incomplete');
  
  console.log('==============================');
  
  return {
    openai: openaiConfig,
    supabase: supabaseConfig,
    ready: allConfigured
  };
};
