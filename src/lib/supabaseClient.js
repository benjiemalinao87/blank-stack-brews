import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycwttshvizkotcwwyjpt.supabase.co';
const supabaseAnonKey = 'sbp_2bdf45ed453b6f178eda25148a70df1207381920';

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
