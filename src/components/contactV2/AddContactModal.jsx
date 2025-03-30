import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useColorModeValue,
  useToast,
  FormErrorMessage,
  Box,
  Text,
  Collapse,
  IconButton,
  HStack,
  Select,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Flex,
  ModalFooter,
  Spinner
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { isValidPhone as validatePhoneNumber, normalizePhone } from '../../utils/phoneUtils';
import useContactV2Store from '../../services/contactV2State';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabaseUnified';

const AddContactModal = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone_number: '',
    email: '',
    st_address: '',
    city: '',
    state: '',
    zip: '',
    market: '',
    product: '',
    lead_status: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const { currentWorkspace, loading: isLoadingWorkspace } = useWorkspace();
  const toast = useToast();
  const { addContact } = useContactV2Store();
  const [leadStatusOptions, setLeadStatusOptions] = useState([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);

  // Apple-style colors
  const modalBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(30, 30, 30, 0.95)');
  const inputBg = useColorModeValue('rgba(240, 240, 240, 0.8)', 'rgba(45, 45, 45, 0.8)');
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('gray.800', 'white');
  
  // Fetch lead status options when workspace changes
  useEffect(() => {
    const fetchLeadStatusOptions = async () => {
      if (!currentWorkspace?.id) return;
      
      setIsLoadingStatuses(true);
      try {
        // Find the lead status category first
        const { data: categories, error: categoriesError } = await supabase
          .from('status_categories')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .ilike('name', '%lead%');
          
        if (categoriesError) throw categoriesError;
        
        if (categories && categories.length > 0) {
          const leadCategory = categories[0];
          
          // Now fetch the status options for this category
          const { data: statuses, error: statusesError } = await supabase
            .from('status_options')
            .select('*')
            .eq('workspace_id', currentWorkspace.id)
            .eq('category_id', leadCategory.id)
            .order('display_order', { ascending: true });
            
          if (statusesError) throw statusesError;
          
          setLeadStatusOptions(statuses || []);
        }
      } catch (error) {
        console.error('Error fetching lead status options:', error);
        toast({
          title: 'Error fetching lead status options',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingStatuses(false);
      }
    };

    if (currentWorkspace?.id) {
      fetchLeadStatusOptions();
    }
  }, [currentWorkspace?.id]);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Don't proceed if workspace is still loading
    if (isLoadingWorkspace) {
      return;
    }

    // Check workspace first before any other validation
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'No active workspace found. Please refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const newErrors = {};
    
    // Validate required fields
    if (!formData.firstname?.trim()) {
      newErrors.firstname = 'First name is required';
    }
    
    if (!formData.lastname?.trim()) {
      newErrors.lastname = 'Last name is required';
    }
    
    if (!formData.phone_number?.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone_number)) {
      newErrors.phone_number = 'Invalid phone number format';
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.lead_status) {
      newErrors.lead_status = 'Lead status is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const contactData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        phone_number: normalizePhone(formData.phone_number),
        email: formData.email || null,
        st_address: formData.st_address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        market: formData.market || null,
        product: formData.product || null,
        lead_status_id: formData.lead_status,
        opt_in_through: 'manual',
        opted_in_sms: true, // Set default opt-in for SMS since this is a manual add
        notes: formData.notes || null,
        workspace_id: currentWorkspace.id
      };
      
      // Check if contact with this phone number already exists
      try {
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('id, firstname, lastname')
          .eq('phone_number', contactData.phone_number)
          .eq('workspace_id', currentWorkspace.id);
          
        if (existingContacts && existingContacts.length > 0) {
          const existingContact = existingContacts[0];
          const existingName = `${existingContact.firstname} ${existingContact.lastname}`;
          
          toast({
            title: 'Contact Already Exists',
            description: `A contact with this phone number already exists (${existingName})`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          
          setErrors({
            ...errors,
            phone_number: 'Phone number already exists in your contacts'
          });
          
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error checking for existing contact:', error);
        // Continue with adding the contact even if the check fails
      }
      
      await addContact(contactData);
      
      toast({
        title: 'Success',
        description: 'Contact added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form and close modal
      setFormData({
        firstname: '',
        lastname: '',
        phone_number: '',
        email: '',
        st_address: '',
        city: '',
        state: '',
        zip: '',
        market: '',
        product: '',
        lead_status: '',
        notes: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error adding contact:', error);
      
      // Handle specific error cases
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        setErrors({
          ...errors,
          phone_number: 'Phone number already exists in your contacts'
        });
        
        toast({
          title: 'Duplicate Contact',
          description: 'A contact with this phone number already exists',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add contact',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    bg: inputBg,
    border: 'none',
    borderRadius: 'lg',
    h: '44px',
    fontSize: 'md',
    _placeholder: { color: placeholderColor },
    _hover: { bg: useColorModeValue('rgba(235, 235, 235, 0.8)', 'rgba(50, 50, 50, 0.8)') },
    _focus: {
      bg: useColorModeValue('white', 'rgba(60, 60, 60, 0.8)'),
      boxShadow: 'none',
      border: '1px solid',
      borderColor: useColorModeValue('blue.500', 'blue.300'),
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="xl"
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent borderRadius="xl" bg={modalBg}>
        <ModalHeader 
          borderTopRadius="xl" 
          bg={headerBg} 
          color={headerColor}
          fontSize="lg"
          fontWeight="semibold"
          py={4}
        >
          Add New Contact
        </ModalHeader>
        <ModalCloseButton color={headerColor} />
        
        <ModalBody py={5} px={6}>
          <form onSubmit={handleSubmit}>
            <Tabs variant="soft-rounded" colorScheme="blue" size="sm" isFitted>
              <TabList mb={4}>
                <Tab>Basic Info</Tab>
                <Tab>Address</Tab>
                <Tab>Additional Info</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem colSpan={1}>
                      <FormControl isRequired isInvalid={!!errors.firstname}>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          First Name
                        </FormLabel>
                        <Input
                          placeholder="First Name"
                          value={formData.firstname}
                          onChange={(e) => handleChange('firstname', e.target.value)}
                          {...inputStyle}
                        />
                        {errors.firstname && (
                          <FormErrorMessage>{errors.firstname}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>
                    
                    <GridItem colSpan={1}>
                      <FormControl isRequired isInvalid={!!errors.lastname}>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Last Name
                        </FormLabel>
                        <Input
                          placeholder="Last Name"
                          value={formData.lastname}
                          onChange={(e) => handleChange('lastname', e.target.value)}
                          {...inputStyle}
                        />
                        {errors.lastname && (
                          <FormErrorMessage>{errors.lastname}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired isInvalid={!!errors.phone_number}>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Phone Number
                        </FormLabel>
                        <Input
                          placeholder="Phone Number"
                          value={formData.phone_number}
                          onChange={(e) => handleChange('phone_number', e.target.value)}
                          {...inputStyle}
                        />
                        {errors.phone_number && (
                          <FormErrorMessage>{errors.phone_number}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Email
                        </FormLabel>
                        <Input
                          placeholder="Email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired isInvalid={!!errors.lead_status}>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Lead Status
                        </FormLabel>
                        {isLoadingStatuses ? (
                          <HStack spacing={2}>
                            <Spinner size="sm" />
                            <Text fontSize="sm">Loading statuses...</Text>
                          </HStack>
                        ) : (
                          <Select
                            placeholder="Select status"
                            value={formData.lead_status}
                            onChange={(e) => handleChange('lead_status', e.target.value)}
                            {...inputStyle}
                          >
                            {leadStatusOptions.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </Select>
                        )}
                        <FormErrorMessage>{errors.lead_status}</FormErrorMessage>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </TabPanel>

                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Street Address
                        </FormLabel>
                        <Input
                          placeholder="Street Address"
                          value={formData.st_address}
                          onChange={(e) => handleChange('st_address', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={1}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          City
                        </FormLabel>
                        <Input
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={1}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          State
                        </FormLabel>
                        <Input
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          ZIP Code
                        </FormLabel>
                        <Input
                          placeholder="ZIP Code"
                          value={formData.zip}
                          onChange={(e) => handleChange('zip', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </TabPanel>

                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem colSpan={1}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Market
                        </FormLabel>
                        <Input
                          placeholder="Market"
                          value={formData.market}
                          onChange={(e) => handleChange('market', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={1}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Product
                        </FormLabel>
                        <Input
                          placeholder="Product"
                          value={formData.product}
                          onChange={(e) => handleChange('product', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                          Notes
                        </FormLabel>
                        <Input
                          placeholder="Notes"
                          value={formData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          {...inputStyle}
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </TabPanel>
              </TabPanels>
            </Tabs>
            
            <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
              <Button
                mr={3}
                onClick={onClose}
                variant="ghost"
                _hover={{ bg: 'gray.100' }}
                _active={{ bg: 'gray.200' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isSubmitting || isLoadingWorkspace}
                loadingText={isLoadingWorkspace ? 'Loading workspace...' : 'Adding contact...'}
              >
                Add Contact
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddContactModal;
