import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import logger from '../utils/logger.js';

/**
 * Hook for managing campaign operations
 */
export const useCampaignOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(async (campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error creating campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing campaign
   */
  const updateCampaign = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error updating campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a campaign
   */
  const deleteCampaign = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('Error deleting campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a campaign by ID
   */
  const getCampaign = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error fetching campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * List all campaigns
   */
  const listCampaigns = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('campaigns').select('*');

      // Apply filters if any
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error listing campaigns:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaign,
    listCampaigns
  };
};
