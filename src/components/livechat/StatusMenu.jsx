import React, { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useColorModeValue,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

const statusColors = {
  Open: 'blue',
  Pending: 'yellow',
  Done: 'green',
  Invalid: 'red',
  Spam: 'purple'
};

export const StatusMenu = ({ currentStatus = 'Open', onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toast = useToast();

  // Pre-compute color values
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  // Get button text based on current status
  const getButtonText = (status) => {
    if (isLoading) return 'Updating...';
    
    switch (status) {
      case 'Open':
        return 'Move to Done';
      case 'Done':
        return 'Reopen';
      case 'Pending':
        return 'Move to Done';
      case 'Invalid':
        return 'Invalid';
      case 'Spam':
        return 'Spam';
      default:
        return status;
    }
  };

  // Get menu options based on current status
  const getMenuOptions = (status) => {
    switch (status) {
      case 'Open':
        return ['Done', 'Pending', 'Invalid', 'Spam'];
      case 'Done':
        return ['Open', 'Pending', 'Invalid', 'Spam'];
      case 'Pending':
        return ['Done', 'Open', 'Invalid', 'Spam'];
      case 'Invalid':
      case 'Spam':
        return ['Open', 'Pending', 'Done'];
      default:
        return ['Open', 'Pending', 'Done', 'Invalid', 'Spam'];
    }
  };

  // Handle status change with loading state and error handling
  const handleStatusChange = async (newStatus) => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    setIsMenuOpen(false);
    
    try {
      await onStatusChange(newStatus);
      
      // Don't show success toast here since ChatArea handles it
    } catch (error) {
      console.error('Status update error:', error);
      // Don't show error toast here since ChatArea handles it
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct button click with error handling
  const handleDirectAction = async (e) => {
    if (isLoading) return;
    
    e.preventDefault(); // Prevent menu from opening
    
    try {
      switch (currentStatus) {
        case 'Open':
          await handleStatusChange('Done');
          break;
        case 'Done':
          await handleStatusChange('Open');
          break;
        case 'Pending':
          await handleStatusChange('Done');
          break;
        default:
          // For other statuses, let the menu handle it
          e.stopPropagation();
          setIsMenuOpen(true);
          break;
      }
    } catch (error) {
      console.error('Direct action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shouldShowMenu = !['Open', 'Done', 'Pending'].includes(currentStatus);

  return (
    <Menu isOpen={isMenuOpen} onOpen={() => setIsMenuOpen(true)} onClose={() => setIsMenuOpen(false)}>
      <MenuButton
        as={Button}
        rightIcon={!isLoading && shouldShowMenu ? <ChevronDownIcon /> : undefined}
        colorScheme={statusColors[currentStatus]?.toLowerCase()}
        size="sm"
        onClick={handleDirectAction}
        isDisabled={isLoading}
        leftIcon={isLoading ? <Spinner size="xs" /> : undefined}
      >
        {getButtonText(currentStatus)}
      </MenuButton>
      {shouldShowMenu && !isLoading && (
        <MenuList
          bg={menuBg}
          borderColor={menuBorderColor}
          boxShadow="md"
          zIndex={1400}
        >
          {getMenuOptions(currentStatus).map((status) => (
            <MenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              _hover={{ bg: hoverBg }}
              isDisabled={isLoading}
            >
              {status}
            </MenuItem>
          ))}
        </MenuList>
      )}
    </Menu>
  );
};

export default StatusMenu;