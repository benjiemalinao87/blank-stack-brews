import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spinner,
  Avatar,
  IconButton,
  useToast,
  useDisclosure,
  useColorModeValue,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  FormControl,
  FormLabel,
  Input,
  Grid,
  GridItem,
  Container,
  Icon,
  Collapse,
  Textarea,
  Select,
  useColorMode,
  Center,
  Heading,
  Tooltip
} from '@chakra-ui/react';
import { 
  PhoneIcon, 
  EmailIcon, 
  EditIcon, 
  ChatIcon, 
  TimeIcon,
  DeleteIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  CheckIcon,
  CloseIcon,
  AddIcon
} from '@chakra-ui/icons';
import { supabase } from '../../../services/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import ContactForm from './ContactForm';
import ContactActivityLog from './ContactActivityLog';
import contactActivityService from '../../../services/contactActivityService';
import AppointmentHistory from '../../appointments/AppointmentHistory';
import AppointmentFollowUps from '../../appointments/AppointmentFollowUps';
import ChatPopUp from '../../chat/ChatPopUp';
import { format } from 'date-fns';
import { addNameToContact } from '../../../utils/contactUtils';
import UnmappedFieldMappingModal from './UnmappedFieldMappingModal';
import ActivityHistory from './ActivityHistory';
import ContactActivitiesService from '../../../services/ContactActivitiesService';
import useContactV2Store from '../../../services/contactV2State';

// Add this new component for the progress stepper
const ProgressStepper = ({ onStepClick, statuses, currentStatus }) => {
  // Check if the current status is marked as completed
  // Use optional chaining and default to false if the property doesn't exist
  const isCompleted = currentStatus?.is_completed ?? false;
  
  // Calculate which steps are active (current or already passed)
  const getStepState = (status, index) => {
    if (!currentStatus) return { isActive: false, isPassed: false };
    
    // Find the index of the current status
    const currentIndex = statuses.findIndex(s => s.id === currentStatus.id);
    
    // If completed, all steps are gray
    if (isCompleted) {
      return { 
        isActive: false, 
        isPassed: false,
        isCompleted: status.id === currentStatus.id
      };
    }
    
    // Current step is active
    if (status.id === currentStatus.id) {
      return { isActive: true, isPassed: false, isCompleted: false };
    }
    
    // Steps before current are passed
    if (currentIndex > -1 && index < currentIndex) {
      return { isActive: false, isPassed: true, isCompleted: false };
    }
    
    // Steps after current are inactive
    return { isActive: false, isPassed: false, isCompleted: false };
  };
  
  // Get color based on step state
  const getStepColors = (stepState) => {
    if (stepState.isCompleted) return { bg: "#4CAF50", color: "white" }; // Green for completed
    if (stepState.isActive) return { bg: "#4169E1", color: "white" }; // Blue for active
    if (stepState.isPassed) return { bg: "#A0AEC0", color: "white" }; // Gray for passed
    return { bg: "#E8EEF9", color: "gray.600" }; // Light blue for inactive
  };
  
  return (
    <Box w="100%" position="relative" overflowX="auto" pb={1}>
      <HStack spacing={0} position="relative" minW="max-content">
        {statuses?.map((status, index) => {
          const stepState = getStepState(status, index);
          const { bg, color } = getStepColors(stepState);
          const isFirst = index === 0;
          const isLast = index === statuses.length - 1;
          
          return (
            <Box
              key={status.id}
              minW="120px"
              flex="1"
              h="40px"
              bg={bg}
              color={color}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight={stepState.isActive || stepState.isCompleted ? "600" : "normal"}
              position="relative"
              cursor="pointer"
              onClick={() => onStepClick(status)}
              borderLeftRadius={isFirst ? "md" : 0}
              borderRightRadius={isLast && !stepState.isActive ? "md" : 0}
              mr={!isLast ? "15px" : 0}
              _after={!isLast ? {
                content: '""',
                position: "absolute",
                right: "-15px",
                top: 0,
                borderTop: "20px solid transparent",
                borderBottom: "20px solid transparent",
                borderLeft: `15px solid ${bg}`,
                zIndex: 1
              } : {}}
              _before={!isFirst ? {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                borderTop: "20px solid transparent",
                borderBottom: "20px solid transparent",
                borderLeft: `15px solid #F5F7FC`,
                zIndex: 0
              } : {}}
              fontSize="sm"
              whiteSpace="nowrap"
              px={2}
              textOverflow="ellipsis"
            >
              {status.name}
            </Box>
          );
        })}
        {currentStatus && (
          <Button
            position="static" // Changed from absolute to static
            ml={4}
            h="40px"
            minW="150px"
            bg={isCompleted ? "#4CAF50" : "#4169E1"} // Green if completed, blue otherwise
            color="white"
            borderRadius="md"
            _hover={{ bg: isCompleted ? "#43A047" : "#3A5FCC" }}
            onClick={() => {
              // Toggle completion state
              const updatedStatus = {
                ...currentStatus,
                is_completed: !isCompleted
              };
              onStepClick(updatedStatus);
            }}
            fontSize="sm"
          >
            {isCompleted ? "Completed Stage" : "Complete Stage"}
          </Button>
        )}
      </HStack>
    </Box>
  );
};

const ContactDetailView = ({ isOpen = true, onClose, contactId, onContactUpdated, onContactDeleted }) => {
  // Color mode hooks - moved to top level
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('gray.500', 'gray.400');
  const iconHoverColor = useColorModeValue('blue.500', 'blue.300');
  const bgColor = useColorModeValue("gray.50", "gray.900");

  const [contact, setContact] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [statusesLoaded, setStatusesLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activities, setActivities] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isStageCompleted, setIsStageCompleted] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    contactInfo: true,
    systemInfo: false,
    additionalInfo: false
  });
  const [isActivityExpanded, setIsActivityExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [hasObsoleteStatus, setHasObsoleteStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [boardSettings, setBoardSettings] = useState({
    show_appointment_status: true,
    show_appointment_result: true
  });
  const [isChatPopUpOpen, setIsChatPopUpOpen] = useState(false);
  const [contactWasUpdated, setContactWasUpdated] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { currentWorkspace } = useWorkspace();
  const toast = useToast();
  const cancelRef = useRef();
  
  // Detect if we're in a modal (contact page) or directly in the DOM (board view)
  const isInModal = typeof document !== 'undefined' && document.querySelector('.chakra-modal__content') !== null;
  
  // Reference to track last fetch time to prevent excessive fetching
  const lastFetchTimeRef = useRef(Date.now());
  const FETCH_COOLDOWN_MS = 2000; // 2 seconds cooldown between fetches
  
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  
  const [isUnmappedFieldModalOpen, setIsUnmappedFieldModalOpen] = useState(false);

  // Handle modal close
  const handleClose = useCallback(() => {
    // Notify parent component of updates when modal is explicitly closed
    if (contactWasUpdated && onContactUpdated) {
      onContactUpdated();
    }
    
    // Reset the update flag
    setContactWasUpdated(false);
    
    // Call the original onClose
    onClose();
  }, [contactWasUpdated, onClose, onContactUpdated]);

  // Memoize the fetchContact and fetchStatuses functions to avoid dependency issues
  const memoizedFetchContact = useCallback(async () => {
    if (!contactId) return;
    
    // Prevent fetching if already loading
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      
      // If contact is not found (deleted), close the modal
      if (!data) {
        handleClose();
        return;
      }

      if (error) throw error;
      
      // Add name field if missing
      const processedContact = addNameToContact(data);
      
      setContact(processedContact);
      console.log('Fetched contact:', processedContact);
      
      // Check if this contact has a lead_status_id
      if (processedContact.lead_status_id && statuses.length > 0) {
        // Try to find the matching status
        const contactStatus = statuses.find(s => s.id === processedContact.lead_status_id);
        
        if (contactStatus) {
          // If we find a matching status, set it as current
          setCurrentStatus(contactStatus);
          console.log('Setting current status to:', contactStatus.name);
        } else {
          // Status not found - might have been deleted from configuration
          console.warn(`Status ID ${processedContact.lead_status_id} not found in available statuses. It may have been deleted.`);
          
          // Set a flag to indicate obsolete status
          setHasObsoleteStatus(true);
          
          // Still show the pipeline, but don't highlight any status
          setCurrentStatus(null);
          
          // Show warning toast about obsolete status
          toast({
            title: "Obsolete Status Detected",
            description: `This contact has status "${processedContact.lead_status}" which no longer exists. Please select a new status.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      } else if (statuses.length > 0) {
        // If the contact doesn't have a status but we have statuses available,
        // set the default status
        const defaultStatus = statuses.find(s => s.is_default) || statuses[0];
        setCurrentStatus(defaultStatus);
        console.log('Setting default status to:', defaultStatus?.name);
      }
      
      // Set the initial load done flag
      setInitialLoadDone(true);
    } catch (error) {
      // Only show error toast if the component is still mounted and modal is open
      if (isOpen) {
        console.error('Error fetching contact:', error);
        toast({
          title: "Error",
          description: `Failed to fetch contact details: ${error.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
      setStatusesLoaded(true); // Mark statuses as loaded regardless
    }
  }, [contactId, statuses, toast, isLoading, handleClose, isOpen]);

  const memoizedFetchStatuses = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      // Get the Lead Status category first
      const { data: categories, error: categoryError } = await supabase
        .from('status_categories')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .eq('name', 'Lead Status')
        .single();
        
      if (categoryError) throw categoryError;
      
      // Then get status options for that category
      const { data, error } = await supabase
        .from('status_options')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('category_id', categories.id)
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      
      console.log('Fetched statuses:', data);
      setStatuses(data || []);
      setStatusesLoaded(true);
      
      // Now that statuses are loaded, if we have contact data, update the current status
      if (contact?.lead_status_id && data?.length > 0) {
        console.log('Statuses loaded, now setting current status based on contact');
        const contactStatus = data.find(s => s.id === contact.lead_status_id);
        if (contactStatus) {
          console.log('Setting current status to:', contactStatus.name);
          setCurrentStatus(contactStatus);
        } else {
          // If we can't find the status, use the default
          const defaultStatus = data.find(s => s.is_default) || data[0];
          console.log('Status not found, setting default status to:', defaultStatus?.name);
          setCurrentStatus(defaultStatus);
        }
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
      toast({
        title: 'Error fetching statuses',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  }, [currentWorkspace?.id, contact, toast]);

  // Effect to load statuses when the modal is opened or workspace changes
  useEffect(() => {
    // In modal mode, only load when isOpen is true
    // In direct mode (board), always load when workspace changes
    if ((isInModal && isOpen && currentWorkspace?.id) || (!isInModal && currentWorkspace?.id)) {
      console.log('Loading statuses for workspace:', currentWorkspace.id);
      memoizedFetchStatuses();
    }
  }, [isInModal, isOpen, currentWorkspace?.id, memoizedFetchStatuses]);

  // Effect to load initial contact data when the component is mounted
  useEffect(() => {
    // In modal mode, only load when isOpen is true
    // In direct mode (board), always load when contactId changes
    if ((isInModal && isOpen && contactId && !initialLoadDone) || (!isInModal && contactId && !initialLoadDone)) {
      console.log('Loading initial contact data for:', contactId);
      memoizedFetchContact();
      memoizedFetchStatuses();
      setInitialLoadDone(true);
    }
  }, [isInModal, isOpen, contactId, initialLoadDone, memoizedFetchContact, memoizedFetchStatuses]);

  // Effect to refetch contact when needed
  useEffect(() => {
    // In modal mode, only refetch when isOpen is true
    // In direct mode (board), always refetch when contactId changes
    if ((isInModal && isOpen && contactId && initialLoadDone) || (!isInModal && contactId && initialLoadDone)) {
      const now = Date.now();
      // Only fetch if it's been more than FETCH_COOLDOWN_MS since the last fetch
      if (now - lastFetchTimeRef.current > FETCH_COOLDOWN_MS) {
        lastFetchTimeRef.current = now;
        console.log('Refetching contact data');
        memoizedFetchContact();
      }
    }
  }, [isInModal, isOpen, contactId, initialLoadDone, memoizedFetchContact]);

  // Function to reset component state
  const resetState = useCallback(() => {
    console.log('Resetting state');
    setContact(null);
    setInitialLoadDone(false);
    setStatusesLoaded(false);
    setMessages([]);
    setActivities(null);
    setStatuses([]);
    setCurrentStatus(null);
    setIsStageCompleted(false);
    setIsDeleteConfirmOpen(false);
    setExpandedSections({
      contactInfo: true,
      systemInfo: false,
      additionalInfo: false
    });
    setIsActivityExpanded(true);
    setActiveStep(0);
    setHasObsoleteStatus(false);
    setIsLoading(false);
    setBoardSettings({
      show_appointment_status: true,
      show_appointment_result: true
    });
    setIsChatPopUpOpen(false);
    setIsUnmappedFieldModalOpen(false);
  }, []);

  // Effect to reset state when modal closes (only in modal mode)
  useEffect(() => {
    if (isInModal && !isOpen) {
      resetState();
    }
  }, [isInModal, isOpen, resetState]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStepClick = async (status) => {
    if (!contactId) {
      console.error('No contact ID provided');
      return;
    }

    // Prevent multiple clicks while processing
    if (isLoading) {
      console.log('Already processing a status update, ignoring click');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get the old status before updating
      const oldStatus = currentStatus;
      
      // Variable to store the lead status value
      let leadStatusValue = null;
      
      // Check if this is a completion toggle
      const isCompletionToggle = status.hasOwnProperty('is_completed');
      
      // If not a completion toggle, determine the lead status value
      if (!isCompletionToggle) {
        // Simply use the name of the status directly from the database
        // This ensures we always use the exact status that was configured
        leadStatusValue = status.name;
        console.log(`Using status name directly: ${status.name}`);
      } else {
        // If it's a completion toggle, keep the current lead status value
        leadStatusValue = contact?.lead_status;
      }
      
      console.log(`Updating contact ${contactId} status:`, 
        isCompletionToggle 
          ? `Marking as ${status.is_completed ? 'completed' : 'not completed'}`
          : `Changing to ${status.name} (${leadStatusValue})`
      );
      
      // Immediately update local state to reflect the change
      if (isCompletionToggle) {
        // For completion toggle, just update the is_completed flag
        setCurrentStatus({
          ...currentStatus,
          is_completed: status.is_completed
        });
        
        if (contact) {
          setContact({
            ...contact,
            is_completed: status.is_completed
          });
        }
      } else {
        // For status change, update the status
        setCurrentStatus(status);
        
        if (contact) {
          setContact({
            ...contact,
            lead_status_id: status.id,
            lead_status: leadStatusValue,
            is_completed: false // Reset completion when changing status
          });
        }

        // Log the status change
        await ContactActivitiesService.logStatusChange({
          contactId,
          workspaceId: currentWorkspace.id,
          oldStatusId: oldStatus?.id,
          newStatusId: status.id,
          oldStatusName: oldStatus?.name,
          newStatusName: status.name
        });
      }
      
      // Prepare the update data
      const updateData = isCompletionToggle
        ? { is_completed: status.is_completed }
        : { 
            lead_status_id: status.id,
            lead_status: leadStatusValue,
            is_completed: false // Reset completion when changing status
          };
      
      // Update the contact in the database
      const { error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId);

      if (updateError) throw updateError;

      // Notify parent component about the update
      if (onContactUpdated) {
        onContactUpdated();
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast({
        title: 'Error updating status',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      
      // Store the contact data before deletion for potential rollback
      const contactToDelete = { ...contact };

      // Close the delete confirmation dialog
      setIsDeleteConfirmOpen(false);
      
      // Close the detail view modal
      handleClose();

      // Notify parent about deletion immediately (optimistic update)
      if (onContactDeleted) {
        onContactDeleted(contactToDelete.id);
      }

      // Delete the contact using the store's function
      const { deleteContact } = useContactV2Store.getState();
      await deleteContact(contactToDelete.id);

      // Show success message
      toast({
        title: "Contact deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

    } catch (err) {
      console.error('Error deleting contact:', err);
      
      // If deletion fails, reopen the modal and show error
      onClose(false); // Don't reset state
      setIsDeleteConfirmOpen(false);

      // Show error message
      toast({
        title: "Error deleting contact",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });

      // Since deletion failed, we need to notify parent to refresh the contact
      if (onContactUpdated) {
        onContactUpdated();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContactUpdated = useCallback(() => {
    // Only fetch if we're not already loading and enough time has passed
    if (!isLoading) {
      const now = Date.now();
      if (now - lastFetchTimeRef.current > FETCH_COOLDOWN_MS) {
        console.log('Contact was updated, refetching');
        lastFetchTimeRef.current = now; // Set this BEFORE calling fetch to prevent loops
        
        // Directly set a timeout to avoid immediate state change loops
        setTimeout(() => {
          memoizedFetchContact();
        }, 100);
      }
    }
    
    if (onContactUpdated) {
      onContactUpdated();
    }
  }, [memoizedFetchContact, isLoading, onContactUpdated]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const logContactUpdate = async (updatedData) => {
    if (!contact || !contact.workspace_id) return;
    
    try {
      // Determine what fields were changed
      const changedFields = [];
      for (const [key, value] of Object.entries(updatedData)) {
        if (contact[key] !== value && key !== 'updated_at') {
          changedFields.push(key);
        }
      }
      
      if (changedFields.length > 0) {
        await contactActivityService.logActivity({
          contactId,
          workspaceId: contact.workspace_id,
          activityType: 'contact_updated',
          description: `Contact details updated: ${changedFields.join(', ')}`,
          metadata: {
            changedFields,
            previousValues: changedFields.reduce((acc, field) => {
              acc[field] = contact[field];
              return acc;
            }, {}),
            newValues: changedFields.reduce((acc, field) => {
              acc[field] = updatedData[field];
              return acc;
            }, {})
          }
        });
      }
    } catch (error) {
      console.error('Error logging contact update activity:', error);
    }
  };

  const handleContactUpdate = (updatedContact) => {
    // Add name field if missing
    const processedContact = addNameToContact(updatedContact);
    
    setContact(processedContact);
    setContactWasUpdated(true);
    onEditClose();
    
    // Show success message
    toast({
      title: 'Contact updated',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Add function to fetch board settings
  const fetchBoardSettings = useCallback(async () => {
    if (!contact?.board_id) return;
    
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('show_appointment_status, show_appointment_result')
        .eq('id', contact.board_id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setBoardSettings({
          show_appointment_status: data.show_appointment_status !== false,
          show_appointment_result: data.show_appointment_result !== false
        });
      }
    } catch (error) {
      console.error('Error fetching board settings:', error);
      // Don't show error toast, just use default settings
    }
  }, [contact?.board_id]);

  // Update useEffect to fetch board settings when contact changes
  useEffect(() => {
    if (contact?.board_id) {
      fetchBoardSettings();
    }
  }, [contact?.board_id, fetchBoardSettings]);

  const parseTags = (tagsJson) => {
    try {
      if (!tagsJson) return [];
      if (Array.isArray(tagsJson)) {
        return tagsJson.map(tag => {
          if (typeof tag === 'string') return tag;
          return tag.name || tag.label || String(tag);
        });
      }
      if (tagsJson.length === 0) return [];
      const parsed = JSON.parse(tagsJson);
      return Array.isArray(parsed) ? parsed.map(tag => {
        if (typeof tag === 'string') return tag;
        return tag.name || tag.label || String(tag);
      }) : [];
    } catch (error) {
      console.error("Error parsing tags:", error);
      return [];
    }
  };

  // Add this function to handle field mapping updates
  const handleFieldsMapped = (updatedContact) => {
    // Update the local contact state with the new data
    setContact(prev => ({
      ...prev,
      ...updatedContact,
      metadata: {
        ...prev.metadata,
        ...updatedContact.metadata
      }
    }));
    
    // Notify parent component if needed
    if (onContactUpdated) {
      onContactUpdated({
        ...contact,
        ...updatedContact,
        metadata: {
          ...contact.metadata,
          ...updatedContact.metadata
        }
      });
    }
    
    // Show success message
    toast({
      title: "Fields mapped successfully",
      description: "The contact has been updated with the new field mappings.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Add this function to handle chat actions
  const handleOpenChat = () => {
    setIsChatPopUpOpen(true);
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Contact Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
  
  if (!contact) {
    return null;
  }
  
  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="5xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottomWidth="1px" bg="white" py={4} px={6}>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="medium" color="gray.700">
                {contact.name} - {contact.email || contact.phone_number}
              </Text>
              <HStack spacing={2}>
                <Button size="sm" variant="outline" leftIcon={<EditIcon />} onClick={onEditOpen}>
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  colorScheme="red" 
                  variant="outline"
                  leftIcon={<DeleteIcon />}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  Delete
                </Button>
                <Button 
                  size="sm" 
                  colorScheme="blue"
                  leftIcon={<ChatIcon />}
                  onClick={handleOpenChat}
                >
                  Open Chat
                </Button>
              </HStack>
            </Flex>
          </ModalHeader>
          
          {/* Pipeline View */}
          {statusesLoaded && statuses.length > 0 && (
            <Box bg="#F5F7FC" py={3} px={6} borderTopWidth="0px" borderBottomWidth="1px" borderColor="gray.200">
            {hasObsoleteStatus && (
              <Box mb={3} p={2} bg="yellow.50" color="orange.800" borderRadius="md" fontSize="sm">
                <Flex alignItems="center">
                  <Icon as={InfoIcon} color="orange.500" mr={2} />
                  <Text>
                    This contact has an obsolete status. Please select a new status below.
                  </Text>
                </Flex>
              </Box>
            )}
            <ProgressStepper 
              statuses={statuses}
              currentStatus={currentStatus} 
              onStepClick={handleStepClick}
            />
          </Box>
          )}
          
          <ModalBody p={0} bg={bgColor}>
            <Container maxW="container.xl" py={6}>
              <Flex gap={6}>
                <Box flex={1}>
                  <Box bg="white" rounded="lg" borderWidth={1}>
                    <Tabs variant="line" size="sm">
                      <TabList px={2} minH="36px" borderBottomColor="gray.200">
                        <Tab 
                          py={2} 
                          px={3} 
                          fontSize="sm" 
                          fontWeight="medium"
                          color="gray.600"
                          _hover={{ color: "blue.500", bg: "gray.50" }}
                          _selected={{ color: "blue.500", fontWeight: "semibold", borderColor: "blue.500" }}
                          transition="all 0.2s"
                        >Details</Tab>
                        <Tab 
                          py={2} 
                          px={3} 
                          fontSize="sm" 
                          fontWeight="medium"
                          color="gray.600"
                          _hover={{ color: "blue.500", bg: "gray.50" }}
                          _selected={{ color: "blue.500", fontWeight: "semibold", borderColor: "blue.500" }}
                          transition="all 0.2s"
                        >Messages</Tab>
                        <Tab 
                          py={2} 
                          px={3} 
                          fontSize="sm" 
                          fontWeight="medium"
                          color="gray.600"
                          _hover={{ color: "blue.500", bg: "gray.50" }}
                          _selected={{ color: "blue.500", fontWeight: "semibold", borderColor: "blue.500" }}
                          transition="all 0.2s"
                        >Additional Information</Tab>
                        {boardSettings.show_appointment_status && (
                          <Tab 
                            py={2} 
                            px={3} 
                            fontSize="sm" 
                            fontWeight="medium"
                            color="gray.600"
                            _hover={{ color: "blue.500", bg: "gray.50" }}
                            _selected={{ color: "blue.500", fontWeight: "semibold", borderColor: "blue.500" }}
                            transition="all 0.2s"
                          >Appointment History</Tab>
                        )}
                        {boardSettings.show_appointment_result && (
                          <Tab 
                            py={2} 
                            px={3} 
                            fontSize="sm" 
                            fontWeight="medium"
                            color="gray.600"
                            _hover={{ color: "blue.500", bg: "gray.50" }}
                            _selected={{ color: "blue.500", fontWeight: "semibold", borderColor: "blue.500" }}
                            transition="all 0.2s"
                          >Follow-up Tasks</Tab>
                        )}
                      </TabList>
                      
                      <TabPanels>
                        <TabPanel p={0}>
                          {/* Contact Information Section */}
                          <Box 
                            as="button" 
                            w="100%" 
                            onClick={() => toggleSection("contactInfo")} 
                            bg="gray.50" 
                            _hover={{ bg: "gray.100" }} 
                            transition="all 0.2s" 
                            py={3} 
                            px={4} 
                            display="flex" 
                            alignItems="center" 
                            borderBottom="1px" 
                            borderColor="gray.200"
                          >
                            {expandedSections.contactInfo ? 
                              <ChevronDownIcon mr={2} /> : 
                              <ChevronRightIcon mr={2} />
                            }
                            <Text fontWeight="medium" textAlign="left">
                              Contact Information
                            </Text>
                          </Box>
                          
                          <Box 
                            overflow="hidden" 
                            transition="all 0.2s" 
                            maxH={expandedSections.contactInfo ? "1000px" : "0"} 
                            opacity={expandedSections.contactInfo ? 1 : 0}
                          >
                            <Box p={6}>
                              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                                <GridItem>
                                  <VStack align="stretch" spacing={4}>
                                    <FormControl>
                                      <FormLabel color="gray.600">Name</FormLabel>
                                      <Input value={contact.name || ''} readOnly />
                                    </FormControl>
                                    <FormControl>
                                      <FormLabel color="gray.600">Email</FormLabel>
                                      <Input value={contact.email || ''} readOnly />
                                    </FormControl>
                                    <FormControl>
                                      <FormLabel color="gray.600">Phone</FormLabel>
                                      <Input value={contact.phone_number || ''} readOnly />
                                    </FormControl>
                                  </VStack>
                                </GridItem>
                                
                                <GridItem>
                                  <VStack align="stretch" spacing={4}>
                                    <FormControl>
                                      <FormLabel color="gray.600">Tags</FormLabel>
                                      <Box p={2} minH="40px" border="1px" borderColor="gray.200" borderRadius="md">
                                        <HStack spacing={2} wrap="wrap">
                                          {contact.tags && contact.tags.length > 0 ? 
                                            parseTags(contact.tags).map((tag, index) => (
                                              <Badge key={index} colorScheme="blue" borderRadius="full" px={2} py={1}>
                                                {tag}
                                              </Badge>
                                            )) : 
                                            <Text color="gray.500">No tags</Text>
                                          }
                                        </HStack>
                                      </Box>
                                    </FormControl>
                                    <FormControl>
                                      <FormLabel color="gray.600">Source</FormLabel>
                                      <Input value={contact.source || 'Not specified'} readOnly />
                                    </FormControl>
                                    <FormControl>
                                      <FormLabel color="gray.600">Status</FormLabel>
                                      <Input value={contact.status || 'Active'} readOnly />
                                    </FormControl>
                                  </VStack>
                                </GridItem>
                              </Grid>
                              
                              {contact.notes && (
                                <Box mt={6}>
                                  <Text color="gray.600" fontWeight="medium" mb={2}>
                                    Notes
                                  </Text>
                                  <Box p={3} borderRadius="md" borderWidth="1px" borderColor="gray.200">
                                    <Text>{contact.notes}</Text>
                                  </Box>
                                </Box>
                              )}
                              
                              <Grid templateColumns="repeat(2, 1fr)" gap={6} mt={6}>
                                <Box>
                                  <HStack spacing={2} color="gray.600">
                                    <TimeIcon />
                                    <Text>Created on {formatDate(contact.created_at)}</Text>
                                  </HStack>
                                </Box>
                                <Box>
                                  <HStack spacing={2} color="gray.600">
                                    <InfoIcon />
                                    <Text>Last Updated: {formatDate(contact.updated_at)}</Text>
                                  </HStack>
                                </Box>
                              </Grid>
                            </Box>
                          </Box>
                          
                          {/* System Information Section */}
                          <Box 
                            as="button" 
                            w="100%" 
                            onClick={() => toggleSection("systemInfo")} 
                            bg="gray.50" 
                            _hover={{ bg: "gray.100" }} 
                            transition="all 0.2s" 
                            py={3} 
                            px={4} 
                            display="flex" 
                            alignItems="center" 
                            borderTop="1px" 
                            borderBottom="1px" 
                            borderColor="gray.200"
                          >
                            {expandedSections.systemInfo ? 
                              <ChevronDownIcon mr={2} /> : 
                              <ChevronRightIcon mr={2} />
                            }
                            <Text fontWeight="medium" textAlign="left">
                              System Information
                            </Text>
                          </Box>
                          
                          <Box 
                            overflow="hidden" 
                            transition="all 0.2s" 
                            maxH={expandedSections.systemInfo ? "1000px" : "0"} 
                            opacity={expandedSections.systemInfo ? 1 : 0}
                          >
                            <Box p={6}>
                              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                                <Box>
                                  <Text color="gray.600" fontSize="sm">
                                    Contact ID
                                  </Text>
                                  <Text fontFamily="monospace">{contact.id}</Text>
                                </Box>
                                <Box>
                                  <Text color="gray.600" fontSize="sm">
                                    Workspace ID
                                  </Text>
                                  <Text fontFamily="monospace">{contact.workspace_id}</Text>
                                </Box>
                              </Grid>
                              
                              {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
                                <Box mt={4}>
                                  <Text color="gray.600" fontSize="sm" mb={2}>
                                    Custom Fields
                                  </Text>
                                  <Box p={3} bg="gray.50" borderRadius="md">
                                    <pre>{JSON.stringify(contact.custom_fields, null, 2)}</pre>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </TabPanel>
                        
                        {/* Messages Tab */}
                        <TabPanel>
                          <Box 
                            height="400px" 
                            overflowY="auto" 
                            pr={2}
                            sx={{
                              "&::-webkit-scrollbar": {
                                width: "4px"
                              },
                              "&::-webkit-scrollbar-track": {
                                width: "6px",
                                background: "gray.50"
                              },
                              "&::-webkit-scrollbar-thumb": {
                                background: "gray.300",
                                borderRadius: "24px"
                              }
                            }}
                          >
                            <Flex direction="column" align="center" justify="center" h="100%">
                              <Text color="gray.500" mb={4}>No messages found</Text>
                              <Button 
                                colorScheme="blue" 
                                size="sm"
                                leftIcon={<ChatIcon />}
                                onClick={() => {
                                  window.location.href = `/livechat/${contact.id}`;
                                }}
                              >
                                Start conversation
                              </Button>
                            </Flex>
                          </Box>
                        </TabPanel>
                        
                        {/* Info Tab - Renamed to Additional Information */}
                        <TabPanel>
                          <VStack align="stretch" spacing={3}>
                            <Box>
                              <Text fontWeight="bold">Contact ID:</Text>
                              <Text fontFamily="monospace">{contact.id}</Text>
                            </Box>
                            
                            {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
                              <Box>
                                <Text fontWeight="bold">Custom Fields:</Text>
                                <Box p={2} mt={1} bg="gray.50" borderRadius="md">
                                  <pre>{JSON.stringify(contact.custom_fields, null, 2)}</pre>
                                </Box>
                              </Box>
                            )}
                            
                            {/* New section for unmapped fields */}
                            {contact.metadata && contact.metadata.unmapped_fields && 
                             Object.keys(contact.metadata.unmapped_fields).length > 0 && (
                              <Box>
                                <Text fontWeight="bold" mb={2}>Unmapped Fields:</Text>
                                <Box p={3} bg="gray.50" borderRadius="md">
                                  <VStack align="stretch" spacing={2}>
                                    {Object.entries(contact.metadata.unmapped_fields).map(([key, value]) => (
                                      <Flex key={key} justify="space-between" p={2} borderBottom="1px" borderColor="gray.200">
                                        <Box>
                                          <Text fontWeight="medium" color="gray.700">{key}</Text>
                                        </Box>
                                        <Box>
                                          <Text>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
                                        </Box>
                                      </Flex>
                                    ))}
                                  </VStack>
                                </Box>
                                <Button 
                                  mt={2} 
                                  size="sm" 
                                  colorScheme="blue" 
                                  variant="outline"
                                  leftIcon={<AddIcon />}
                                  onClick={() => setIsUnmappedFieldModalOpen(true)}
                                >
                                  Map to Custom Fields
                                </Button>
                              </Box>
                            )}
                            
                            <Box>
                              <Text fontWeight="bold">Created:</Text>
                              <Text>{formatDate(contact.created_at)}</Text>
                            </Box>
                            
                            <Box>
                              <Text fontWeight="bold">Last Updated:</Text>
                              <Text>{formatDate(contact.updated_at)}</Text>
                            </Box>
                          </VStack>
                        </TabPanel>
                        
                        {boardSettings.show_appointment_status && (
                          <TabPanel p={0}>
                            <Box p={6}>
                              <Text fontSize="lg" fontWeight="medium" mb={4}>Appointment History</Text>
                              <AppointmentHistory contactId={contactId} workspaceId={contact.workspace_id} />
                            </Box>
                          </TabPanel>
                        )}
                        
                        {boardSettings.show_appointment_result && (
                          <TabPanel p={0}>
                            <Box p={6}>
                              <Text fontSize="lg" fontWeight="medium" mb={4}>Follow-up Tasks</Text>
                              <AppointmentFollowUps contactId={contactId} workspaceId={contact.workspace_id} />
                            </Box>
                          </TabPanel>
                        )}
                      </TabPanels>
                    </Tabs>
                  </Box>
                </Box>
                
                {/* Sidebar */}
                <Box w="350px">
                  <VStack spacing={4}>
                    {/* Quick Actions */}
                    <Box bg="white" p={4} rounded="lg" borderWidth={1} w="full">
                      <Text fontSize="lg" fontWeight="medium" mb={4}>
                        Quick Actions
                      </Text>
                      <VStack spacing={3}>
                        <Button
                          leftIcon={<ChatIcon />}
                          colorScheme="blue"
                          onClick={handleOpenChat}
                          width="100%"
                        >
                          Send Message
                        </Button>
                        <Button
                          leftIcon={<PhoneIcon />}
                          onClick={() => {/* TODO: Implement call functionality */}}
                          width="100%"
                        >
                          Call Contact
                        </Button>
                        <Button
                          leftIcon={<EmailIcon />}
                          onClick={() => {/* TODO: Implement email functionality */}}
                          width="100%"
                        >
                          Send Email
                        </Button>
                      </VStack>
                    </Box>
                    
                    {/* Contact Info Summary */}
                    <Box bg="white" p={4} rounded="lg" borderWidth={1} w="full">
                      <Text fontSize="lg" fontWeight="medium" mb={4}>
                        Contact Details
                      </Text>
                      <VStack spacing={3} align="stretch">
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <EmailIcon />
                            <Text>{contact.email || 'No email'}</Text>
                          </HStack>
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <PhoneIcon />
                            <Text>{contact.phone_number || 'No phone'}</Text>
                          </HStack>
                        </Flex>
                      </VStack>
                    </Box>
                    
                    {/* Activity History */}
                    <Box>
                      <HStack 
                        justify="space-between" 
                        align="center" 
                        mb={2}
                        onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                        cursor="pointer"
                        role="group"
                        _hover={{ bg: hoverBg }}
                        p={2}
                        borderRadius="md"
                      >
                        <Text 
                          fontSize="sm" 
                          fontWeight="medium"
                          color={textColor}
                        >
                          Activity History
                        </Text>
                        <Icon 
                          as={isActivityExpanded ? ChevronUpIcon : ChevronDownIcon}
                          color={iconColor}
                          _groupHover={{ color: iconHoverColor }}
                        />
                      </HStack>
                      <Collapse in={isActivityExpanded}>
                        <Box 
                          pt={2} 
                          pb={4}
                        >
                          <ActivityHistory contactId={contactId} />
                        </Box>
                      </Collapse>
                    </Box>
                  </VStack>
                </Box>
              </Flex>
            </Container>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Contact
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteConfirm} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Edit Contact Modal */}
      {isEditOpen && (
        <ContactForm
          isOpen={isEditOpen}
          onClose={onEditClose}
          initialData={contact}
          onContactAdded={(updatedContact) => {
            handleContactUpdate(updatedContact);
            setContactWasUpdated(true);
          }}
        />
      )}
      
      {/* Chat PopUp */}
      <ChatPopUp
        isOpen={isChatPopUpOpen}
        onClose={() => setIsChatPopUpOpen(false)}
        contactId={contactId}
        contact={contact}
      />
      
      {/* Unmapped Field Mapping Modal */}
      {isUnmappedFieldModalOpen && contact?.metadata?.unmapped_fields && (
        <UnmappedFieldMappingModal
          isOpen={isUnmappedFieldModalOpen}
          onClose={() => setIsUnmappedFieldModalOpen(false)}
          unmappedFields={contact.metadata.unmapped_fields}
          contactId={contactId}
          onFieldsMapped={handleFieldsMapped}
        />
      )}
    </>
  );
};

export default ContactDetailView;
