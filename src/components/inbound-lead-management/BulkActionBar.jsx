import React from 'react';
import {
  Box,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Tooltip,
  Divider
} from '@chakra-ui/react';
import { 
  CheckCircle, 
  Trash2, 
  UserPlus, 
  Mail, 
  Tag, 
  X, 
  Download,
  MessageSquare
} from 'lucide-react';

const BulkActionBar = ({ 
  selectedCount, 
  onCheckout, 
  onAssign, 
  onDelete, 
  onEmail, 
  onTag, 
  onExport,
  onMessage,
  onClearSelection 
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (selectedCount === 0) return null;
  
  return (
    <Box
      position="fixed"
      bottom="24px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={1010}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="lg"
      border="1px solid"
      borderColor={borderColor}
      py={2}
      px={4}
      minWidth="600px"
      maxWidth="90%"
    >
      <HStack spacing={4} justifyContent="space-between">
        <HStack>
          <Text fontWeight="medium" fontSize="sm">
            {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} selected
          </Text>
          <Tooltip label="Clear selection">
            <Button 
              size="xs" 
              variant="ghost" 
              onClick={onClearSelection}
              aria-label="Clear selection"
            >
              <X size={14} />
            </Button>
          </Tooltip>
        </HStack>
        
        <HStack spacing={2} divider={<Divider orientation="vertical" height="20px" />}>
          <Tooltip label="Check out leads">
            <Button 
              size="sm" 
              leftIcon={<CheckCircle size={14} />} 
              onClick={onCheckout}
              colorScheme="green"
              variant="ghost"
            >
              Check Out
            </Button>
          </Tooltip>
          
          <Tooltip label="Assign to agent">
            <Button 
              size="sm" 
              leftIcon={<UserPlus size={14} />} 
              onClick={onAssign}
              colorScheme="blue"
              variant="ghost"
            >
              Assign
            </Button>
          </Tooltip>
          
          <Tooltip label="Send email">
            <Button 
              size="sm" 
              leftIcon={<Mail size={14} />} 
              onClick={onEmail}
              colorScheme="purple"
              variant="ghost"
            >
              Email
            </Button>
          </Tooltip>
          
          <Tooltip label="Send message">
            <Button 
              size="sm" 
              leftIcon={<MessageSquare size={14} />} 
              onClick={onMessage}
              colorScheme="teal"
              variant="ghost"
            >
              Message
            </Button>
          </Tooltip>
          
          <Tooltip label="Add tags">
            <Button 
              size="sm" 
              leftIcon={<Tag size={14} />} 
              onClick={onTag}
              colorScheme="orange"
              variant="ghost"
            >
              Tag
            </Button>
          </Tooltip>
          
          <Tooltip label="Export leads">
            <Button 
              size="sm" 
              leftIcon={<Download size={14} />} 
              onClick={onExport}
              colorScheme="gray"
              variant="ghost"
            >
              Export
            </Button>
          </Tooltip>
          
          <Tooltip label="Delete leads">
            <Button 
              size="sm" 
              leftIcon={<Trash2 size={14} />} 
              onClick={onDelete}
              colorScheme="red"
              variant="ghost"
            >
              Delete
            </Button>
          </Tooltip>
        </HStack>
      </HStack>
    </Box>
  );
};

export default BulkActionBar; 