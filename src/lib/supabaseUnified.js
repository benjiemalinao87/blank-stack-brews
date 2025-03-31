
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Initialize Supabase client with fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ycwttshvizkotcwwyjpt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd3R0c2h2aXprb3Rjd3d5anB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDQ5NzUsImV4cCI6MjA1MzgyMDk3NX0.fVZR9xA1CkuExYKBrKbjGW9Z_nLIYS0mS1gFjfPJEAk';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey?.length);

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
