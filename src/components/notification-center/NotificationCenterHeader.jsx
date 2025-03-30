import React from 'react';
import { 
  Flex, 
  Text, 
  IconButton, 
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { ChevronDownIcon, CloseIcon, CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import { FiMoreVertical } from 'react-icons/fi';

const NotificationCenterHeader = ({ onClose, onClearAll, onMarkAllAsRead }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <>
      <Flex 
        p={3} 
        justifyContent="space-between" 
        alignItems="center"
        borderBottom="1px solid" 
        borderColor={borderColor}
      >
        <Text fontWeight="bold" fontSize="lg">Activity</Text>
        
        <Flex>
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
            />
            <MenuList zIndex={1001}>
              <MenuItem icon={<CheckIcon />} onClick={onMarkAllAsRead}>
                Mark all as read
              </MenuItem>
              <MenuItem icon={<DeleteIcon />} onClick={onClearAll}>
                Clear all
              </MenuItem>
            </MenuList>
          </Menu>
          
          <IconButton
            aria-label="Close notification center"
            icon={<CloseIcon />}
            onClick={onClose}
            variant="ghost"
            size="sm"
            ml={1}
          />
        </Flex>
      </Flex>
    </>
  );
};

export default NotificationCenterHeader; 