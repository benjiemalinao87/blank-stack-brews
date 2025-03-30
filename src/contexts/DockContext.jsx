
import React, { createContext, useContext, useState } from 'react';

const DockContext = createContext();

export const DockProvider = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <DockContext.Provider value={{ isMinimized, toggleMinimized }}>
      {children}
    </DockContext.Provider>
  );
};

export const useDock = () => {
  const context = useContext(DockContext);
  if (context === undefined) {
    return { isMinimized: false, toggleMinimized: () => {} };
  }
  return context;
};
