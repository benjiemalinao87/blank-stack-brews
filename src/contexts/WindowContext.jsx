import React, { createContext, useContext, useState } from 'react';

const WindowContext = createContext();

export const WindowProvider = ({ children }) => {
  // Store window-specific states
  const [windowStates, setWindowStates] = useState(new Map());

  const getWindowState = (windowId) => {
    return windowStates.get(windowId) || {};
  };

  const updateWindowState = (windowId, newState) => {
    setWindowStates(prev => {
      const updated = new Map(prev);
      updated.set(windowId, { ...getWindowState(windowId), ...newState });
      return updated;
    });
  };

  const clearWindowState = (windowId) => {
    setWindowStates(prev => {
      const updated = new Map(prev);
      updated.delete(windowId);
      return updated;
    });
  };

  return (
    <WindowContext.Provider value={{ getWindowState, updateWindowState, clearWindowState }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindowState = (windowId) => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindowState must be used within a WindowProvider');
  }

  const { getWindowState, updateWindowState, clearWindowState } = context;
  const state = getWindowState(windowId);

  return {
    windowState: state,
    updateWindowState: (newState) => updateWindowState(windowId, newState),
    clearWindowState: () => clearWindowState(windowId)
  };
}; 