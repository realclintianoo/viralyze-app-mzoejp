
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://vcgqzbqyknxaekniddfl.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3F6YnF5a254YWVrbmlkZGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkwNzMsImV4cCI6MjA3MzI2NTA3M30.dmzndTJaJPsmcgX3JsQjOlBiQA_NgFIv-9DfwSotc94";

console.log('Supabase client initialized with:', {
  url: supabaseUrl ? 'configured' : 'missing',
  key: supabaseAnonKey ? 'configured' : 'missing'
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Check environment configuration
export const checkSupabaseConfig = () => {
  return {
    url: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    key: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    isConfigured: !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  };
};
