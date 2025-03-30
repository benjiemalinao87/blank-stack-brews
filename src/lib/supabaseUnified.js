import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Track connection status
let isConnected = false;

// Auth state change handler
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Check if Supabase is connected
export const isSupabaseConnected = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logger.error('Error checking Supabase connection:', error);
      return false;
    }
    isConnected = !!data.session;
    return isConnected;
  } catch (error) {
    logger.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Authentication functions
export const signUpWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Sign up error:', error);
    return { data: null, error };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Sign in error:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    logger.error('Sign out error:', error);
    return { error };
  }
};

// Initialize connection status
supabase.auth.onAuthStateChange((event, session) => {
  isConnected = !!session;
  logger.info('Auth state changed:', event, !!session);
});
