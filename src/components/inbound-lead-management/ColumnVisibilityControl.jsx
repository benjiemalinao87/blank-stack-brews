import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Text,
  Switch,
  Box,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { Columns, Check, EyeOff } from 'lucide-react';

const ColumnVisibilityControl = ({ columns, visibleColumns, onToggleColumn, onShowAll, onHideAll }) => {
  const menuBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={Button}
        size="sm"
        leftIcon={<Columns size={16} />}
        variant="outline"
        colorScheme="gray"
      >
        Columns
      </MenuButton>
      <MenuList minWidth="200px" bg={menuBg} shadow="lg" borderRadius="md" p={2}>
        <Box px={3} py={2}>
          <HStack justifyContent="space-between" mb={2}>
            <Button size="xs" leftIcon={<Check size={12} />} onClick={onShowAll} variant="ghost">
              Show All
            </Button>
            <Button size="xs" leftIcon={<EyeOff size={12} />} onClick={onHideAll} variant="ghost">
              Hide All
            </Button>
          </HStack>
        </Box>
        <Divider my={2} />
        {columns.map((column) => (
          <MenuItem 
            key={column.id} 
            _hover={{ bg: hoverBg }}
            onClick={(e) => {
              // Prevent the MenuItem's onClick from firing when clicking the Switch
              e.stopPropagation();
            }}
          >
            <HStack justifyContent="space-between" width="100%">
              <Text 
                fontSize="sm"
                onClick={() => onToggleColumn(column.id)}
                cursor="pointer"
                flex="1"
              >
                {column.label}
              </Text>
              <Switch 
                size="sm" 
                isChecked={visibleColumns.includes(column.id)} 
                colorScheme="purple"
                onChange={() => onToggleColumn(column.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default ColumnVisibilityControl; 