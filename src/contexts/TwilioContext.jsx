import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabaseUnified';
import { useToast } from '@chakra-ui/react';

const TwilioContext = createContext();

export function TwilioProvider({ children }) {
  const [twilioConfig, setTwilioConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const saveTwilioConfig = async (workspaceId, { accountSid, authToken }) => {
    if (!workspaceId || !accountSid || !authToken) {
      throw new Error('Missing required Twilio configuration parameters');
    }

    try {
      // First save to workspace_twilio_config
      const { data, error } = await supabase
        .from('workspace_twilio_config')
        .upsert({
          workspace_id: workspaceId,
          account_sid: accountSid,
          auth_token: authToken,
          is_configured: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Sync phone numbers from Twilio
      const syncResponse = await fetch('https://cc.automate8.com/api/twilio/sync-numbers/' + workspaceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountSid, authToken })
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Failed to sync phone numbers');
      }

      // Transform the data to match our frontend naming convention
      const transformedData = {
        accountSid: data.account_sid,
        authToken: data.auth_token,
        isConfigured: data.is_configured,
        updatedAt: data.updated_at
      };

      setTwilioConfig(transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error saving Twilio config:', error);
      throw error;
    }
  };

  const getTwilioConfig = async (workspaceId, { showError = false } = {}) => {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    try {
      // Use the API endpoint instead of direct Supabase access
      const apiUrl = process.env.REACT_APP_API_URL || 'https://cc.automate8.com';
      const response = await fetch(`${apiUrl}/api/twilio/config/${workspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Twilio configuration');
      }

      const data = await response.json();

      if (data && data.success) {
        const transformedData = {
          accountSid: data.config.account_sid,
          authToken: data.config.auth_token,
          isConfigured: data.config.is_configured,
          updatedAt: data.config.updated_at
        };
        setTwilioConfig(transformedData);
        setIsLoading(false);
        return transformedData;
      }

      setTwilioConfig(null);
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error fetching Twilio config:', error);
      setTwilioConfig(null);
      setIsLoading(false);
      if (showError) {
        toast({
          title: 'Error',
          description: 'Failed to fetch Twilio configuration',
          status: 'error',
          duration: 3000,
        });
      }
      return null;
    }
  };

  const testTwilioConnection = async (accountSid, authToken, workspaceId) => {
    try {
      const response = await fetch('https://cc.automate8.com/api/twilio/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountSid, authToken, workspaceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to validate Twilio credentials');
      }

      return true;
    } catch (error) {
      console.error('Error testing Twilio connection:', error);
      throw error;
    }
  };

  return (
    <TwilioContext.Provider value={{
      twilioConfig,
      isLoading,
      saveTwilioConfig,
      getTwilioConfig,
      testTwilioConnection
    }}>
      {children}
    </TwilioContext.Provider>
  );
}

export const useTwilio = () => {
  const context = useContext(TwilioContext);
  if (!context) {
    throw new Error('useTwilio must be used within a TwilioProvider');
  }
  return context;
};
