import React, { createContext, useContext, useState } from 'react';

const BoardContext = createContext(null);

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

export const BoardProvider = ({ children, initialBoard }) => {
  const [board, setBoard] = useState(initialBoard);
  const [phoneNumber, setPhoneNumber] = useState(initialBoard.phone_number);

  const updateBoardName = (newName) => {
    setBoard(prev => ({ ...prev, name: newName }));
  };

  const updatePhoneNumber = (newNumber) => {
    setPhoneNumber(newNumber);
    setBoard(prev => ({ ...prev, phone_number: newNumber }));
  };

  return (
    <BoardContext.Provider 
      value={{ 
        board,
        phoneNumber,
        updateBoardName,
        updatePhoneNumber,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};
