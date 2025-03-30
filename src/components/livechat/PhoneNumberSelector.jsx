import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Text,
  useColorModeValue,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { ChevronDownIcon, PhoneIcon, WarningIcon } from '@chakra-ui/icons';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const PhoneNumberSelector = ({ onSelect, selectedNumber }) => {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentWorkspace } = useWorkspace();
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');
  const toast = useToast();

  // Load phone numbers when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadPhoneNumbers();
    } else {
      console.warn('No workspace available for loading phone numbers');
    }
  }, [currentWorkspace?.id]);

  const loadPhoneNumbers = async () => {
    if (!currentWorkspace?.id) {
      console.error('Cannot load phone numbers: No workspace ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading phone numbers for workspace:', currentWorkspace.id);
      
      const { data: numbers, error: fetchError } = await supabase
        .from('twilio_numbers')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      if (fetchError) {
        throw fetchError;
      }

      console.log('Loaded phone numbers:', numbers);
      
      if (numbers && numbers.length > 0) {
        setPhoneNumbers(numbers);
        
        // If no number is selected yet, select the first one
        if (!selectedNumber && numbers.length > 0) {
          console.log('Auto-selecting first phone number:', numbers[0]);
          onSelect(numbers[0]);
        }
      } else {
        console.warn('No phone numbers found for workspace');
        setError('No phone numbers available');
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      setError(error.message);
      toast({
        title: 'Error loading phone numbers',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    // Format E.164 to (XXX) XXX-XXXX
    const match = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  // If there's an error or no phone numbers, show a warning button
  if (error || (phoneNumbers.length === 0 && !isLoading)) {
    return (
      <Button
        size="sm"
        variant="outline"
        colorScheme="red"
        leftIcon={<WarningIcon />}
        onClick={loadPhoneNumbers}
      >
        {error ? 'Error loading numbers' : 'No phone numbers'}
      </Button>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        leftIcon={isLoading ? <Spinner size="xs" /> : <PhoneIcon />}
        isDisabled={isLoading || phoneNumbers.length === 0}
      >
        {selectedNumber ? formatPhoneNumber(selectedNumber.phone_number) : 'Select Number'}
      </MenuButton>
      <MenuList bg={menuBg}>
        {phoneNumbers.length === 0 ? (
          <MenuItem isDisabled>No phone numbers available</MenuItem>
        ) : (
          phoneNumbers.map((number) => (
            <MenuItem
              key={number.id}
              onClick={() => onSelect(number)}
              bg={selectedNumber?.id === number.id ? menuHoverBg : 'transparent'}
              _hover={{ bg: menuHoverBg }}
            >
              <HStack spacing={2}>
                <Text>{formatPhoneNumber(number.phone_number)}</Text>
              </HStack>
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
};
