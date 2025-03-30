import React, { createContext, useContext, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Create a context for drag-and-drop operations
const DragDropContext = createContext({
  moveContact: () => {},
  isDragging: false,
  setIsDragging: () => {},
  draggedContact: null,
  setDraggedContact: () => {},
  sourceBoardId: null,
  setSourceBoardId: () => {},
});

// Custom hook to use the drag-drop context
export const useDragDrop = () => useContext(DragDropContext);

// Provider component that wraps the application
export const DragDropProvider = ({ children, onMoveContact, boardId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedContact, setDraggedContact] = useState(null);
  const [sourceBoardId, setSourceBoardId] = useState(null);

  // Function to handle moving a contact between columns or boards
  const moveContact = (contactId, sourceColumnId, targetColumnId, targetBoardId = null) => {
    if (sourceColumnId === targetColumnId && (!targetBoardId || targetBoardId === boardId)) return;
    
    // Call the callback provided by the parent component
    if (onMoveContact) {
      onMoveContact(contactId, sourceColumnId, targetColumnId, targetBoardId);
    }
  };

  const value = {
    moveContact,
    isDragging,
    setIsDragging,
    draggedContact,
    setDraggedContact,
    sourceBoardId,
    setSourceBoardId,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DragDropContext.Provider value={value}>
        {children}
      </DragDropContext.Provider>
    </DndProvider>
  );
};

export default DragDropContext;
