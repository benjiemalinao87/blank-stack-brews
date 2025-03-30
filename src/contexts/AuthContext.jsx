import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, onAuthStateChange, isSupabaseConnected } from '../lib/supabaseUnified';
import logger from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    const initialize = async () => {
      try {
        // Check if Supabase is properly connected
        const isConnected = await isSupabaseConnected();
        if (!isConnected) {
          throw new Error("Unable to connect to authentication service");
        }

        // Check initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!isSubscribed) return;
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        
        setError(null);
      } catch (error) {
        logger.error('Error during initialization:', error);
        if (isSubscribed) {
          setError(error);
          setUser(null);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
        } else if (event === 'ERROR') {
          throw session.error;
        }
      } catch (error) {
        logger.error('Error during auth state change:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    setUser,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};