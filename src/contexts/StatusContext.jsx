import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStatusCategories,
  getStatusOptionsByCategory,
  createStatusOption,
  updateStatusOption,
  deleteStatusOption,
  reorderStatusOptions,
  setDefaultStatus,
  updateContactStatus
} from '../services/statusService';
import { useWorkspace } from './WorkspaceContext';

const StatusContext = createContext();

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};

export const StatusProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [optionsByCategory, setOptionsByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentWorkspace } = useWorkspace();

  const fetchData = async () => {
    if (!currentWorkspace?.id) {
      console.log('No workspace ID available for fetching status data');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch categories
      const categoriesData = await getStatusCategories(currentWorkspace.id);
      setCategories(categoriesData);
      
      // Fetch options for each category
      const optionsMap = {};
      
      await Promise.all(categoriesData.map(async (category) => {
        const options = await getStatusOptionsByCategory(category.id, currentWorkspace.id);
        optionsMap[category.id] = options;
      }));
      
      setOptionsByCategory(optionsMap);
    } catch (err) {
      setError(err);
      console.error('Error fetching status data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchData();
    }
  }, [currentWorkspace?.id]);

  const refreshData = async () => {
    await fetchData();
  };

  const createOption = async (params) => {
    const newOption = await createStatusOption(params);
    await refreshData(); // Refresh data to update context
    return newOption;
  };

  const updateOption = async (id, params) => {
    const updatedOption = await updateStatusOption(id, params);
    await refreshData(); // Refresh data to update context
    return updatedOption;
  };

  const deleteOption = async (id) => {
    await deleteStatusOption(id);
    await refreshData(); // Refresh data to update context
  };

  const reorderOptions = async (params) => {
    await reorderStatusOptions(params);
    await refreshData(); // Refresh data to update context
  };

  const setDefault = async (categoryId, statusId) => {
    await setDefaultStatus(categoryId, statusId);
    await refreshData(); // Refresh data to update context
  };

  const updateContactStatusField = async (params) => {
    await updateContactStatus(params);
  };

  // Helper to get the default status option for a category
  const getDefaultForCategory = (categoryId) => {
    const options = optionsByCategory[categoryId] || [];
    return options.find(option => option.is_default);
  };

  // Helper to get category name by ID
  const getCategoryNameById = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const value = {
    categories,
    optionsByCategory,
    isLoading,
    error,
    refreshData,
    createOption,
    updateOption,
    deleteOption,
    reorderOptions,
    setDefault,
    updateContactStatusField,
    getDefaultForCategory,
    getCategoryNameById
  };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
};
