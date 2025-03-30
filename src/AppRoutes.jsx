import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import AuthPage from './components/auth/AuthPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import Profile from './components/profile/Profile';
import ContactDetailPage from './components/contactV2/ContactDetailPage';
import MainLayout from './components/MainLayout';

/**
 * AppRoutes Component
 * 
 * Centralized routing configuration for the application.
 * Defines all available routes and their associated components.
 * 
 * Note: Campaign Manager views are handled through draggable windows
 * in MainContent to maintain the Mac OS design philosophy.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes */}
      <Route path="/onboarding" element={<RequireAuth><OnboardingFlow /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/contact/:contactId" element={<RequireAuth><ContactDetailPage /></RequireAuth>} />
      
      {/* Main App Route */}
      <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>} />
      
      {/* Redirect all campaign routes to main app */}
      <Route path="/broadcast2/*" element={<Navigate to="/" replace />} />
      <Route path="/campaigns/*" element={<Navigate to="/" replace />} />
      
      {/* Default route - redirects to home page */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 