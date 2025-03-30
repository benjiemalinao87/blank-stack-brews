import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { DraggableWindow } from '../window/DraggableWindow';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { FolderTree } from './FolderTree';
import { NotesProvider, useNotes } from '../../context/NotesContext';

const NotesContent = () => {
  const {
    notes,
    selectedNote,
    selectedFolder,
    setSelectedNote,
    setSelectedFolder,
    createNote,
    updateNote,
    loading
  } = useNotes();

  const [isFoldersPanelOpen, setIsFoldersPanelOpen] = useState(true);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleNewNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: '',
        tags: [],
      });
      setSelectedNote(newNote);
    } catch (error) {
      toast({
        title: 'Error creating note',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Flex h="100%" bg={bgColor} borderRadius="lg" overflow="hidden">
      {/* Folders Toggle Button */}
      <IconButton
        icon={isFoldersPanelOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        variant="ghost"
        size="sm"
        position="absolute"
        left={isFoldersPanelOpen ? "180px" : "0"}
        top="2"
        zIndex="1"
        onClick={() => setIsFoldersPanelOpen(!isFoldersPanelOpen)}
        aria-label={isFoldersPanelOpen ? "Collapse folders" : "Expand folders"}
        borderRadius="full"
        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
      />

      {/* Left Sidebar - Folders */}
      <Box
        w={isFoldersPanelOpen ? "200px" : "0"}
        transition="width 0.2s"
        borderRight="1px"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Box p={2}>
          <FolderTree />
        </Box>
      </Box>

      {/* Middle - Notes List */}
      <Box
        w="250px"
        borderRight="1px"
        borderColor={borderColor}
        bg={useColorModeValue('gray.50', 'gray.900')}
      >
        <Flex 
          p={2} 
          borderBottom="1px" 
          borderColor={borderColor}
          justify="space-between"
          align="center"
        >
          <Text fontSize="sm" fontWeight="medium">Notes</Text>
          <IconButton
            size="sm"
            icon={<AddIcon />}
            variant="ghost"
            aria-label="New note"
            onClick={handleNewNote}
          />
        </Flex>
        <NotesList
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
        />
      </Box>

      {/* Right - Note Editor */}
      <Box flex="1">
        <NoteEditor
          note={selectedNote}
          onSave={async (updates) => {
            if (selectedNote) {
              try {
                await updateNote(selectedNote.id, updates);
              } catch (error) {
                toast({
                  title: 'Error updating note',
                  description: error.message,
                  status: 'error',
                  duration: 3000,
                });
              }
            }
          }}
        />
      </Box>
    </Flex>
  );
};

const NotesWindow = ({ onClose }) => {
  return (
    <DraggableWindow
      title="Notes"
      onClose={onClose}
      defaultSize={{ width: 1000, height: 600 }}
      minSize={{ width: 800, height: 400 }}
    >
      <NotesProvider>
        <NotesContent />
      </NotesProvider>
    </DraggableWindow>
  );
};

export default NotesWindow;
