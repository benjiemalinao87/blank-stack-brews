// This file is maintained for backward compatibility
// All Supabase client functionality is now in lib/supabaseUnified.js
// This file simply re-exports everything from there

import {
  supabase,
  isSupabaseConnected,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  onAuthStateChange
} from '../lib/supabaseUnified.js';

// Re-export everything
export {
  supabase,
  isSupabaseConnected,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  onAuthStateChange
};

// Log a warning about the deprecated import path
console.warn(
  'Warning: Importing from services/supabase.js is deprecated. ' +
  'Please update your imports to use lib/supabaseUnified.js instead.'
);
