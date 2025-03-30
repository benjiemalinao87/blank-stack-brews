import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { getOnboardingStatus, createOnboardingStatus, hasCompletedAnyOnboarding, updateOnboardingStatus } from '../services/onboarding';
import { supabase } from '../lib/supabaseUnified';
import logger from '../utils/logger';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const completeOnboarding = async () => {
    // Simplified mock function
    setIsOnboardingComplete(true);
    localStorage.setItem('onboardingComplete', 'true');
  };

  const value = {
    isOnboardingComplete,
    setIsOnboardingComplete,
    loading,
    error,
    completeOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
