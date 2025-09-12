
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../app/integrations/supabase/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vcgqzbqyknxaekniddfl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZ3F6YnF5a254YWVrbmlkZGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkwNzMsImV4cCI6MjA3MzI2NTA3M30.dmzndTJaJPsmcgX3JsQjOlBiQA_NgFIv-9DfwSotc94';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://natively.dev/email-confirmed'
    }
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const getSession = () => {
  return supabase.auth.getSession();
};
