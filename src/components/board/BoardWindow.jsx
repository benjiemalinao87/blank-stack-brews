import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  IconButton,
  Tooltip,
  Flex,
  Spacer,
  Spinner,
  Center,
  Input,
  Spinner as ChakraSpinner,
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import SpeedToLeadBoard from './sections/SpeedToLeadBoard';
import AudienceSegment from './sections/AudienceSegment';
import CampaignBuilder from './sections/CampaignBuilder';
import Automation from './sections/Automation';
import AIAgent from './sections/AIAgent';
import ConfigureBoard from './sections/ConfigureBoard';
import BoardNav from './components/BoardNav';
import { BoardProvider, useBoardContext } from './context/BoardContext';
import { DraggableWindow } from '../window/DraggableWindow';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import boardActivityService from '../../services/boardActivityService';
import logger from '../../utils/logger';
import { StatusProvider } from '../../contexts/StatusContext';

const BoardContent = () => {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState('');
  const [activeView, setActiveView] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const { board } = useBoardContext();
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBgColor = useColorModeValue('white', 'gray.800');
  const { currentWorkspace: workspace, loading: workspaceLoading } = useWorkspace();
  const dataFetchedRef = useRef(false);
  const boardStateStoredRef = useRef(false);
  
  // Only log workspace on first mount
  useEffect(() => {
    logger.info('Current workspace in BoardWindow');
  }, []);

  // Only fetch boards once when workspace is available
  useEffect(() => {
    const fetchBoards = async () => {
      setIsLoading(true);
      try {
        if (!workspace || !workspace.id) {
          logger.error('No workspace available for fetching boards');
          setIsLoading(false);
          return;
        }

        logger.info(`Fetching boards for workspace`);
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('*')
          .eq('workspace_id', workspace.id)
          .order('created_at', { ascending: true });

        if (boardsError) {
          logger.error('Error fetching boards');
          return;
        }

        if (boardsData) {
          logger.info(`Retrieved ${boardsData.length} boards`);
          setBoards(boardsData);
          if (boardsData.length > 0 && !activeBoard) {
            setActiveBoard(boardsData[0].id);
          }
        }
      } catch (error) {
        logger.error('Error in fetchBoards');
      } finally {
        setIsLoading(false);
      }
    };

    if (workspace && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchBoards();
    }
  }, [workspace, activeBoard]);

  // Store board state in localStorage when it changes, but avoid excessive stores
  useEffect(() => {
    if (activeBoard && boards.length > 0 && !boardStateStoredRef.current) {
      boardStateStoredRef.current = true;
      
      // Use setTimeout to debounce and batch state updates
      const timeoutId = setTimeout(() => {
        logger.info('Storing board state in localStorage');
        const boardState = {
          activeBoard,
          activeView,
          boards: JSON.stringify(boards),
          timestamp: Date.now()
        };
        localStorage.setItem('boardWindowState', JSON.stringify(boardState));
        boardStateStoredRef.current = false;
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeBoard, activeView, boards]);

  // Load board state from localStorage only once on mount
  useEffect(() => {
    const loadBoardState = () => {
      try {
        const savedState = localStorage.getItem('boardWindowState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Check if the stored state is still valid (not too old)
          const isStateValid = 
            parsedState.timestamp && 
            (Date.now() - parsedState.timestamp < 24 * 60 * 60 * 1000); // 24 hours
            
          if (parsedState.boards && isStateValid) {
            logger.info('Loading board state from localStorage');
            const parsedBoards = JSON.parse(parsedState.boards);
            setBoards(parsedBoards);
            setActiveBoard(parsedState.activeBoard || '');
            setActiveView(parsedState.activeView || '');
            setIsLoading(false);
            return true;
          }
        }
        return false;
      } catch (error) {
        logger.error('Error loading board state from localStorage');
        return false;
      }
    };

    // Only try to load state once during component mount
    const hasCachedState = loadBoardState();
  }, []);

  const handleBoardSelect = (boardId, view = '') => {
    setActiveBoard(boardId);
    setActiveView(view);
  };

  const handleBoardRename = async (boardId, newName) => {
    try {
      if (!newName || newName.trim() === '') {
        setIsEditing(false);
        return; 
      }
      
      const originalBoard = boards.find(board => board.id === boardId);
      
      const { error } = await supabase
        .from('boards')
        .update({ name: newName })
        .eq('id', boardId);
      
      if (error) throw error;
      
      setBoards(boards.map(board =>
        board.id === boardId ? { ...board, name: newName } : board
      ));
      
      setIsEditing(false);
      
      logger.info(`Board renamed`);
      
      await boardActivityService.logActivity({
        boardId,
        workspaceId: workspace.id,
        activityType: 'board_renamed',
        description: `Board renamed`,
        beforeState: { name: originalBoard.name },
        afterState: { name: newName }
      });
    } catch (error) {
      logger.error('Error renaming board');
      setIsEditing(false);
    }
  };

  const handleBoardCreate = async (name) => {
    try {
      if (!workspace || !workspace.id) {
        logger.error('No workspace available for creating board');
        return;
      }
      
      const { data, error } = await supabase
        .from('boards')
        .insert([{ 
          name,
          status: 'active',
          workspace_id: workspace.id
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setBoards([...boards, data[0]]);
        setActiveBoard(data[0].id);
        
        logger.info(`Board created`);
        
        await boardActivityService.logActivity({
          boardId: data[0].id,
          workspaceId: workspace.id,
          activityType: 'board_created',
          description: `Board created`,
          afterState: data[0]
        });
      }
    } catch (error) {
      logger.error('Error creating board');
    }
  };

  const handleBoardDelete = async (boardId) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);
      
      if (error) throw error;
      
      const updatedBoards = boards.filter(board => board.id !== boardId);
      setBoards(updatedBoards);
      
      if (activeBoard === boardId) {
        setActiveBoard(updatedBoards[0]?.id || '');
      }
      
      logger.info(`Board deleted`);
    } catch (error) {
      logger.error('Error deleting board');
    }
  };

  const handleBoardReorder = async (result) => {
    if (!result.destination) return;
    
    const reorderedBoards = Array.from(boards);
    const [removed] = reorderedBoards.splice(result.source.index, 1);
    reorderedBoards.splice(result.destination.index, 0, removed);
    
    setBoards(reorderedBoards);
    
    // You could implement backend persistence of the order here
    // by updating a 'display_order' field for each board
  };

  const handleBoardUpdate = async (updatedBoard) => {
    try {
      const { error } = await supabase
        .from('boards')
        .update(updatedBoard)
        .eq('id', updatedBoard.id);
      
      if (error) throw error;
      
      setBoards(boards.map(board => 
        board.id === updatedBoard.id ? updatedBoard : board
      ));
      
      logger.info(`Board updated`);
    } catch (error) {
      logger.error('Error updating board');
    }
  };

  const handleEditClick = () => {
    setEditedName(currentBoard.name);
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    await handleBoardRename(currentBoard.id, editedName);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const currentBoard = boards.find(b => b.id === activeBoard) || {
    name: '',
    phone_number: '',
    id: '',
  };

  if (workspaceLoading) {
    return (
      <Center h="100%">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading workspace...</Text>
        </VStack>
      </Center>
    );
  }

  if (!workspace || !workspace.id) {
    return (
      <Center h="100%">
        <VStack spacing={4}>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="red.50">
            <Text color="red.500" fontWeight="bold">No active workspace found</Text>
            <Text mt={2}>Please refresh the page or check your account settings.</Text>
          </Box>
        </VStack>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'audience-segment':
        return <AudienceSegment board={currentBoard} />;
      case 'campaign-builder':
        return <CampaignBuilder board={currentBoard} />;
      case 'automation':
        return <Automation board={currentBoard} />;
      case 'ai-agent':
        return <AIAgent board={currentBoard} />;
      case 'configure-board':
        return <ConfigureBoard 
          board={currentBoard} 
          onUpdateBoard={handleBoardUpdate}
        />;
      default:
        return <SpeedToLeadBoard board={currentBoard} />;
    }
  };

  return (
    <Flex h="100%">
      <BoardNav
        boards={boards}
        activeBoard={activeBoard}
        onBoardSelect={handleBoardSelect}
        onBoardCreate={handleBoardCreate}
        onBoardDelete={handleBoardDelete}
        onBoardReorder={handleBoardReorder}
      />
      <Box flex="1" h="100%" overflow="hidden" display="flex" flexDirection="column">
        <Flex 
          px={6} 
          py={4} 
          borderBottomWidth="1px" 
          borderColor={borderColor} 
          align="center"
          bg={headerBgColor}
        >
          {isEditing ? (
            <HStack>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                fontSize="xl"
                fontWeight="semibold"
                variant="flushed"
                autoFocus
                onKeyDown={handleKeyDown}
              />
              <Tooltip label="Save" hasArrow>
                <IconButton
                  icon={<CheckIcon />}
                  size="sm"
                  colorScheme="green"
                  onClick={handleSaveName}
                  aria-label="Save board name"
                />
              </Tooltip>
              <Tooltip label="Cancel" hasArrow>
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  aria-label="Cancel editing"
                />
              </Tooltip>
            </HStack>
          ) : (
            <HStack>
              <Text fontSize="xl" fontWeight="semibold">
                {currentBoard.name}
              </Text>
              <Tooltip label="Edit name" hasArrow>
                <IconButton
                  icon={<EditIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={handleEditClick}
                  aria-label="Edit board name"
                />
              </Tooltip>
            </HStack>
          )}
          {currentBoard.phone_number && (
            <Text ml={4} color="gray.500">
              {currentBoard.phone_number}
            </Text>
          )}
        </Flex>
        <Box flex="1" overflow="auto">
          {renderContent()}
        </Box>
      </Box>
    </Flex>
  );
};

const BoardWindow = ({ onClose, workspace }) => {
  return (
    <StatusProvider>
      <BoardProvider initialBoard={{ phone_number: null }}>
        <DraggableWindow
          title="Board"
          onClose={onClose}
          defaultSize={{ width: 1200, height: 800 }}
          minSize={{ width: 800, height: 600 }}
        >
          <BoardContent />
        </DraggableWindow>
      </BoardProvider>
    </StatusProvider>
  );
};

export default BoardWindow;
