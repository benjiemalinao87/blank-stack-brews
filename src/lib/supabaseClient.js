
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycwttshvizkotcwwyjpt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd3R0c2h2aXprb3Rjd3d5anB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDQ5NzUsImV4cCI6MjA1MzgyMDk3NX0.fVZR9xA1CkuExYKBrKbjGW9Z_nLIYS0mS1gFjfPJEAk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Track connection status
let isConnected = false;

// Auth state change handler
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Check if Supabase is connected
export const isSupabaseConnected = () => isConnected;

// Initialize connection status
supabase.auth.onAuthStateChange((event, session) => {
  isConnected = !!session;
});
