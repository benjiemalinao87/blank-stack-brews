import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseUnified';
import logger from '../../utils/logger';

/**
 * RequireAuth Component
 * 
 * Temporarily modified to always allow access
 */
export const RequireAuth = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        logger.info('Session check:', currentSession ? 'authenticated' : 'not authenticated');
      } catch (error) {
        logger.error('Error checking session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      logger.info('Auth state changed:', session ? 'authenticated' : 'not authenticated');
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    logger.info('No session found, redirecting to /auth');
    // Save the location they were trying to go to
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  logger.info('Session found, rendering protected content');
  return children;
}; 