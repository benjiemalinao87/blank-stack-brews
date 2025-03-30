import React from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';

const FilterSidebar = ({ isOpen, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
    >
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px" borderColor={borderColor}>
          Filter Contacts
        </DrawerHeader>

        <DrawerBody>
          <Stack spacing={4} mt={4}>
            <FormControl>
              <FormLabel>Search</FormLabel>
              <Input
                placeholder="Search by name, message..."
                size="md"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Agent</FormLabel>
              <Select placeholder="Select agent">
                <option value="all">All Agents</option>
                <option value="sarah">Sarah Johnson</option>
                <option value="michael">Michael Chen</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Date Range</FormLabel>
              <Select placeholder="Select range">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select placeholder="Select status">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
              </Select>
            </FormControl>
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default FilterSidebar;
