import React, { createContext, useContext, useState } from 'react';

const DockContext = createContext();

export const useDock = () => {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within a DockProvider');
  }
  return context;
};

export const DockProvider = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const setDockItem = (item) => {
    setActiveItem(item);
  };

  return (
    <DockContext.Provider
      value={{
        isMinimized,
        activeItem,
        toggleMinimized,
        setDockItem,
        setIsMinimized,
      }}
    >
      {children}
    </DockContext.Provider>
  );
};

export default DockContext;
