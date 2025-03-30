import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Skeleton,
  Spacer,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon, EmailIcon, PhoneIcon, SearchIcon } from "@chakra-ui/icons";
import { 
  Download,
  Info,
  Layout,
  Mail,
  MessageCircle,
  Mic,
  MicOff,
  MoreVertical,
  Phone,
  PhoneOff,
  Play,
  Plus,
  Tag,
  Trash,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  Users,
  Volume2,
  VolumeX,
  X,
} from "react-feather";
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import useContactV2Store from "../../services/contactV2State";

// Local imports
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";
import { formatPhoneForDisplay, normalizePhone } from "../../utils/phoneUtils";
import { supabase } from "../../services/supabase";
import ContactActivitiesService from '../../services/ContactActivitiesService';
import AddContactModal from "./AddContactModal";
import ContactDetailView from "../board/components/ContactDetailView";
import AddContactToBoardModal from './AddContactToBoardModal';
import { ImportContactsModal } from "./ImportContactsModal";
import { QuickMessage } from './QuickMessage';
import LeadStatusUpdate from "./LeadStatusUpdate";
import ContactFilters from "./ContactFilters";
import AddToCampaignModal from './AddToCampaignModal';
import ChatPopUp from '../chat/ChatPopUp';

const getDisplayName = (contact) => {
  // First try to use the name field
  if (contact.name && contact.name.trim()) {
    return contact.name;
  }
  
  // Then try to combine firstname and lastname
  const firstName = contact.firstname || '';
  const lastName = contact.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  if (fullName) {
    return fullName;
  }
  
  // As a last resort, use phone number or Unknown
  return contact.phone_number || 'Unknown Contact';
};

// Helper function to safely get tag text
const getTagText = (tag) => {
  if (!tag) return '';
  if (typeof tag === 'string') return tag;
  if (typeof tag === 'object') return tag.name || tag.label || '';
  return String(tag);
};

const parseTags = (tagsJson) => {
  try {
    if (!tagsJson) return [];
    
    // Handle already parsed arrays (from real-time updates)
    if (Array.isArray(tagsJson)) {
      return tagsJson.map(tag => {
        if (typeof tag === 'string') return tag;
        return tag.name || tag.label || String(tag);
      });
    }
    
    // Handle empty array that's not a string
    if (tagsJson.length === 0) return [];
    
    // Parse JSON string
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

// Tag color mapping for consistent colors matching the mock data
const TAG_COLORS = {
  "tags1": "blue",
  "tag2": "green",
  "lead": "purple",
  "customer": "teal",
  "prospect": "orange",
  "vip": "red",
  "new": "cyan",
  "active": "green",
  "inactive": "gray",
  "pending": "yellow"
};

// Get a color for a tag, with fallback to a consistent color based on the tag name
const getTagColor = (tag) => {
  // Get tag text first
  const tagText = getTagText(tag).toLowerCase();
  
  // Check predefined colors
  if (TAG_COLORS[tagText]) return TAG_COLORS[tagText];
  
  // Common color associations
  if (tagText.includes('lead') || tagText.includes('new')) return 'blue';
  if (tagText.includes('contact')) return 'green';
  if (tagText.includes('follow')) return 'purple';
  if (tagText.includes('inactive')) return 'gray';
  if (tagText.includes('sold') || tagText.includes('won')) return 'orange';
  if (tagText.includes('dnc')) return 'red';
  if (tagText.includes('pending')) return 'yellow';
  
  // Simple hash function for consistent colors
  const hash = tagText.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // List of Chakra UI color schemes
  const colorSchemes = [
    'blue', 'cyan', 'green', 'teal', 'yellow', 
    'orange', 'red', 'pink', 'purple'
  ];
  
  // Use the hash to pick a color
  const index = Math.abs(hash) % colorSchemes.length;
  return colorSchemes[index];
};

const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase();
  if (statusLower === 'active') return 'green';
  if (statusLower === 'inactive') return 'gray';
  if (statusLower === 'blocked') return 'red';
  if (statusLower === 'dnc') return 'red.600';
  if (statusLower === 'qualified') return 'blue';
  if (statusLower === 'pending') return 'yellow';
  return 'gray';
};

const getStatusBadgeProps = (status) => {
  const statusLower = status?.toLowerCase();
  const isDNC = statusLower === 'dnc';
  
  return {
    colorScheme: getStatusColor(status),
    variant: isDNC ? 'solid' : 'subtle',
    textTransform: 'uppercase',
    fontSize: 'xs',
    fontWeight: isDNC ? 'bold' : 'medium',
    px: 2,
    py: 0.5,
    borderRadius: 'sm'
  };
};

const CallStatus = {
  IDLE: 'idle',
  DIALING: 'dialing',
  CONNECTED: 'connected',
  ENDED: 'ended'
};

const ContactsPageV2 = () => {
  const toast = useToast();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedContactsForBoard, setSelectedContactsForBoard] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [newTag, setNewTag] = useState('');
  const tagInputRef = useRef(null);
  const inlineTagInputRef = useRef(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatContact, setSelectedChatContact] = useState(null);

  // Selection state
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  
  // Tag editing state
  const [editingContactId, setEditingContactId] = useState(null);
  const [isInlineTagEditing, setIsInlineTagEditing] = useState(false);
  const [newInlineTag, setNewInlineTag] = useState('');
  const { 
    isOpen: isTagPopoverOpen, 
    onOpen: onTagPopoverOpen, 
    onClose: onTagPopoverClose 
  } = useDisclosure();
  
  // State for contact detail modal
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddToBoardModalOpen, setIsAddToBoardModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Quick Message state
  const [selectedContactForMessage, setSelectedContactForMessage] = useState(null);
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);

  // Bulk action state
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Alert dialog state
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const cancelRef = useRef();

  // State for board modal
  const { isOpen: isBoardModalOpen, onOpen: onBoardModalOpen, onClose: onBoardModalClose } = useDisclosure();

  // Add this state for the campaign modal
  const [isAddToCampaignModalOpen, setIsAddToCampaignModalOpen] = useState(false);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (e, contactId) => {
    e.stopPropagation();
    const newSelectedContacts = e.target.checked 
      ? [...selectedContacts, contactId]
      : selectedContacts.filter(id => id !== contactId);
    setSelectedContacts(newSelectedContacts);
  };

  // Action handlers - following Mac OS design principles
  const handleAddToBoard = (contact) => {
    if (contact) {
      setSelectedContact(contact);
    }
    onBoardModalOpen();
  };

  const handleAddToCampaign = (contact) => {
    // Set the selected contact for the modal
    setSelectedContacts([contact.id]);
    setIsAddToCampaignModalOpen(true);
  };

  const handleQuickMessage = (contact) => {
    setSelectedChatContact(contact.id);
    setIsChatOpen(true);
  };

  const handleSendEmail = () => {
    toast({
      title: "Coming Soon",
      description: "Email integration will be available soon",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "top-right",
    });
  };

  const handleUpdateStatus = async (contactId, newStatus) => {
    try {
      const { error } = await updateContact(contactId, {
        status: newStatus
      });

      if (error) throw error;

      toast({
        title: `Contact marked as ${newStatus}`,
        description: newStatus === 'dnc' ? 'Contact will not be contacted' : 'Contact marked as qualified lead',
        status: newStatus === 'dnc' ? 'warning' : 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      // Refresh contacts list
      loadContacts();
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast({
        title: 'Error updating status',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedContacts.map(contactId => 
        deleteContact(contactId)
      );
      
      await Promise.all(deletePromises);

      toast({
        title: `${selectedContacts.length} contacts deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      // Clear selection and refresh contacts
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: 'Error deleting contacts',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const handleBulkUpdateStatus = async (newStatus) => {
    try {
      const updatePromises = selectedContacts.map(contactId => 
        updateContact(contactId, { status: newStatus })
      );
      
      await Promise.all(updatePromises);

      toast({
        title: `${selectedContacts.length} contacts updated`,
        description: `Contacts marked as ${newStatus}`,
        status: newStatus === 'dnc' ? 'warning' : newStatus === 'qualified' ? 'success' : 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      // Clear selection and refresh contacts
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Error updating contact statuses:', error);
      toast({
        title: 'Error updating contacts',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  // Get data and functions from the contact store
  const {
    contacts,
    isLoading,
    error,
    hasNextPage,
    searchQuery,
    loadContacts,
    loadMoreContacts,
    searchContacts,
    setSearchQuery,
    addContact,
    deleteContact,
    updateContact,
    updateContactTags,
    initializeRealtime,
    totalContacts,
  } = useContactV2Store();

  // Local state for search input (for immediate UI feedback)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');

  // Call state
  const [callStatus, setCallStatus] = useState('idle');
  const [activeCallContactId, setActiveCallContactId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call timer effect
  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle starting a call
  const handleStartCall = (contact) => {
    setActiveCallContactId(contact.id);
    setCallStatus('connecting');
    setCallDuration(0);
    setIsMuted(false);

    // Simulate call connecting
    toast({
      title: 'Connecting call...',
      description: `Calling ${contact.firstname} ${contact.lastname}`,
      status: 'info',
      duration: 2000,
      position: 'top-right',
    });

    // Simulate call connected after 2 seconds
    setTimeout(() => {
      setCallStatus('connected');
      toast({
        title: 'Call connected',
        status: 'success',
        duration: 2000,
        position: 'top-right',
      });
    }, 2000);
  };

  // Handle ending a call
  const handleEndCall = () => {
    toast({
      title: 'Call ended',
      description: `Duration: ${formatDuration(callDuration)}`,
      status: 'info',
      duration: 3000,
      position: 'top-right',
    });

    setCallStatus('idle');
    setActiveCallContactId(null);
    setCallDuration(0);
    setIsMuted(false);
  };

  // Handle muting a call
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? 'Call unmuted' : 'Call muted',
      status: 'info',
      duration: 1000,
      position: 'top-right',
    });
  };

  // Initialize data loading
  useEffect(() => {
    let cleanupFunction = () => {};
    
    const setupData = async () => {
      if (currentWorkspace?.id) {
        // Set the workspace ID in the contact store
        useContactV2Store.setState({ workspaceId: currentWorkspace.id });
        
        // Clear any previous contacts when workspace changes
        useContactV2Store.setState({ 
          contacts: [],
          totalContacts: 0,
          nextCursor: null,
          hasNextPage: true
        });
        
        // Load contacts for the current workspace
        await loadContacts(null, 50);
        
        // Set up real-time subscription
        try {
          const unsubscribeFunc = await initializeRealtime();
          if (typeof unsubscribeFunc === 'function') {
            cleanupFunction = unsubscribeFunc;
          }
        } catch (error) {
          console.error('Error setting up real-time subscription:', error);
        }
      }
    };
    
    if (!workspaceLoading) {
      setupData();
    }
    
    return () => {
      // Clean up subscription on unmount
      if (typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
    };
  }, [currentWorkspace?.id, workspaceLoading]);

  // Add an additional effect to ensure contacts are loaded on mount
  useEffect(() => {
    // This will ensure contacts are loaded even if the workspace hasn't changed
    if (currentWorkspace?.id && !isLoading && contacts.length === 0) {
      loadContacts(null, 50);
    }
  }, []);

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Ensure the workspace ID is set before searching
    if (currentWorkspace?.id) {
      useContactV2Store.setState({ workspaceId: currentWorkspace.id });
      
      // Use the debounced search function from the store
      searchContacts(value);
    }
  };

  // Handle delete contact
  const handleDeleteContact = async (contactOrId) => {
    // Store current state before deletion
    const storeState = useContactV2Store.getState();
    const currentContacts = storeState.contacts;
    const currentTotalContacts = storeState.totalContacts;

    try {
      // Handle either a contact object or a contact ID
      const contactId = typeof contactOrId === 'object' ? contactOrId.id : contactOrId;

      // Optimistically update UI
      useContactV2Store.setState({
        contacts: currentContacts.filter(contact => contact.id !== contactId),
        totalContacts: currentTotalContacts - 1
      });

      await deleteContact(contactId);
      
      toast({
        title: "Contact deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      // Refresh contacts to ensure sync
      loadContacts();
    } catch (err) {
      // Revert the optimistic update if there was an error
      useContactV2Store.setState({
        contacts: currentContacts,
        totalContacts: currentTotalContacts
      });
      
      toast({
        title: "Error deleting contact",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("gray.100", "gray.700");
  const menuBg = useColorModeValue("white", "gray.800");

  // Handle row click to open contact details
  const handleRowClick = (contactId) => {
    setSelectedContactId(contactId);
    setIsDetailModalOpen(true);
  };

  // Handle inline tag addition
  const handleInlineTagAdd = (contactId, e) => {
    e.stopPropagation();
    setEditingContactId(contactId);
    setIsInlineTagEditing(true);
    // Focus the input after it's rendered
    setTimeout(() => {
      if (inlineTagInputRef.current) {
        inlineTagInputRef.current.focus();
      }
    }, 50);
  };

  // Handle inline tag submission
  const handleInlineTagSubmit = (contactId, e) => {
    if (e.key === 'Enter' && newInlineTag.trim()) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        const currentTags = parseTags(contact.tags);
        const updatedTags = [...currentTags, newInlineTag.trim()];
        handleUpdateTags(contactId, updatedTags);
        setNewInlineTag('');
        setIsInlineTagEditing(false);
      }
    } else if (e.key === 'Escape') {
      setNewInlineTag('');
      setIsInlineTagEditing(false);
    }
  };

  // Handle inline tag blur
  const handleInlineTagBlur = () => {
    setNewInlineTag('');
    setIsInlineTagEditing(false);
  };

  // Function to handle adding a new tag
  const handleAddTag = (contactId, existingTags, newTagName) => {
    // Convert existing tags to simple string array if they're objects
    const simpleTags = existingTags.map(tag => {
      if (typeof tag === 'object' && tag !== null) {
        return tag.name || tag.label || 'unknown';
      }
      return tag;
    });
    
    // Check if tag already exists (case insensitive)
    if (simpleTags.some(tag => tag.toLowerCase() === newTagName.toLowerCase())) {
      toast({
        title: "Tag already exists",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    
    // Add the new tag
    const updatedTags = [...simpleTags, newTagName];
    handleUpdateTags(contactId, updatedTags);
  };
  
  // Function to update tags in the database
  const handleUpdateTags = async (contactId, tags) => {
    try {
      await updateContactTags(contactId, tags);
      toast({
        title: "Tags updated",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      toast({
        title: "Error updating tags",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const navigate = useNavigate();

  // Handle export contacts
  const handleExportContacts = () => {
    // Prepare data for export
    const exportData = contacts.map(contact => ({
      'First Name': contact.firstname || '',
      'Last Name': contact.lastname || '',
      'Phone Number': contact.phone_number || '',
      'Email': contact.email || '',
      'Lead Source': contact.lead_source || '',
      'Market': contact.market || '',
      'Product': contact.product || '',
      'Lead Status': contact.lead_status || '',
      'Address': contact.st_address || '',
      'City': contact.city || '',
      'State': contact.state || '',
      'ZIP': contact.zip || '',
      'Conversation Status': contact.conversation_status || '',
      'Tags': contact.tags?.map(tag => tag.name).join(', ') || ''
    }));

    // Convert to CSV
    const csv = Papa.unparse(exportData);
    
    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up download attributes
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts-export-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success toast
    toast({
      title: 'Export Complete',
      description: `Successfully exported ${contacts.length} contacts.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleOpenChat = (contact) => {
    // TODO: Implement chat opening logic
    console.log('Opening chat for contact:', contact);
  };

  const handleViewDetails = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (contactId) => {
    try {
      await deleteContact(contactId);
      toast({
        title: 'Contact deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      toast({
        title: 'Error deleting contact',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const onOpenLiveChat = (contact) => {
    // TODO: Implement LiveChat opening logic
    console.log('Opening LiveChat for contact:', contact);
  };

  // Add new handler functions
  const handleBulkAddToBoard = () => {
    // Get the full contact objects from the store
    const storeContacts = contacts;
    console.log('Store contacts:', storeContacts);
    console.log('Selected contact IDs:', selectedContacts);
    
    const selectedContactObjects = selectedContacts.map(id => {
      const contact = storeContacts.find(c => c.id === id);
      if (!contact) {
        console.warn(`Contact with ID ${id} not found in store`);
      }
      return contact;
    }).filter(Boolean); // Remove any undefined contacts
    
    console.log('Selected contact objects:', selectedContactObjects);
    
    if (selectedContactObjects.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to add to the board",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    setSelectedContact(null); // Clear single contact selection
    setSelectedContactsForBoard(selectedContactObjects); // Set selected contacts for board
    onBoardModalOpen();
  };

  const handleBulkAddToCampaign = () => {
    setIsAddToCampaignModalOpen(true);
  };

  const [statusOptions, setStatusOptions] = useState([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchStatusOptions = async () => {
      if (!currentWorkspace?.id) return;
      
      setIsLoadingStatuses(true);
      try {
        // First get the Lead Status category
        const { data: categories, error: categoryError } = await supabase
          .from('status_categories')
          .select('*')
          .eq('name', 'Lead Status')
          .eq('workspace_id', currentWorkspace.id);

        if (categoryError) {
          throw categoryError;
        }

        if (!categories || categories.length === 0) {
          console.log('No Lead Status category found');
          setStatusOptions([]);
          return;
        }

        // Use the first matching category
        const category = categories[0];

        // Then get all status options for this category
        const { data: statuses, error: statusError } = await supabase
          .from('status_options')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .eq('category_id', category.id)
          .order('display_order', { ascending: true });

        if (statusError) {
          throw statusError;
        }

        setStatusOptions(statuses || []);
      } catch (error) {
        console.error('Error fetching status options:', error);
        toast({
          title: 'Error fetching statuses',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
      } finally {
        setIsLoadingStatuses(false);
      }
    };

    fetchStatusOptions();
  }, [currentWorkspace?.id]);

  const handleBulkStatusChange = async (statusId) => {
    if (!selectedContacts.length) return;

    setIsUpdatingStatus(true);
    try {
      // Get the new status details
      const { data: statusData } = await supabase
        .from('status_options')
        .select('name')
        .eq('id', statusId)
        .single();

      if (!statusData) throw new Error('Status not found');

      // Update all contacts status
      const { error } = await supabase.rpc('bulk_update_contact_status', {
        contact_ids: selectedContacts,
        new_status_id: statusId,
        workspace_id: currentWorkspace.id
      });

      if (error) throw error;

      // Log the status change activity for each contact
      await Promise.all(selectedContacts.map(contactId => 
        ContactActivitiesService.logStatusChange({
          contactId,
          workspaceId: currentWorkspace.id,
          newStatusId: statusId,
          newStatusName: statusData.name
        })
      ));

      toast({
        title: "Status updated",
        description: `Updated ${selectedContacts.length} contacts to ${statusData.name}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Render loading state
  if (workspaceLoading) {
    return (
      <Center h="100%" w="100%">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading workspace...</Text>
        </VStack>
      </Center>
    );
  }

  // Render no workspace state
  if (!currentWorkspace) {
    return (
      <Alert
        status="warning"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="100%"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          No Workspace Found
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          Please create or select a workspace to view contacts.
        </AlertDescription>
      </Alert>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="100%"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Error Loading Contacts
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
      bg={bgColor}
      borderRadius="md"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        p={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justifyContent="flex-end"
        alignItems="center"
      >
        <HStack spacing={3}>
          <Button
            size="sm"
            leftIcon={<Icon as={Download} size={14} />}
            variant="ghost"
            onClick={() => setIsImportModalOpen(true)}
          >
            Import
          </Button>
          <Button
            size="sm"
            leftIcon={<Icon as={Upload} size={14} />}
            variant="ghost"
            onClick={handleExportContacts}
          >
            Export
          </Button>
          <Button
            size="sm"
            leftIcon={<Icon as={Plus} size={14} />}
            colorScheme="blue"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Contact
          </Button>
        </HStack>
      </Flex>

      {/* Search */}
      <Box p={3} borderBottomWidth="1px" borderColor={borderColor}>
        <InputGroup maxW="400px" size="sm" mb={2}>
          <InputLeftElement pointerEvents="none" color="gray.400">
            <SearchIcon size={14} />
          </InputLeftElement>
          <Input
            placeholder="Search"
            value={localSearchQuery}
            onChange={handleSearchChange}
            bg="white"
            borderRadius="md"
            _focus={{
              boxShadow: "none",
              borderColor: "blue.500",
            }}
          />
          {isLoading && (
            <InputRightElement>
              <Spinner size="sm" color="blue.500" />
            </InputRightElement>
          )}
        </InputGroup>
        
        {/* Add ContactFilters component here */}
        <ContactFilters />
      </Box>

      {/* Table */}
      <Box flex="1" overflowY="auto">
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
            <Tr>
              <Th px={3} py={3}>
                <Checkbox size="sm" onChange={handleSelectAll} />
              </Th>
              <Th px={3} py={3}>Name</Th>
              <Th px={3} py={3}>Phone</Th>
              <Th px={3} py={3}>Email</Th>
              <Th px={3} py={3}>Tags</Th>
              <Th px={3} py={3}>Status</Th>
              <Th px={3} py={3} width="160px" textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading && contacts.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={6}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" mt={2}>Loading contacts...</Text>
                </Td>
              </Tr>
            ) : contacts.length === 0 && !isLoading ? (
              <Tr>
                <Td colSpan={10}>
                  <Center py={10}>
                    <Box textAlign="center">
                      <Icon as={Users} size={48} color="gray.400" mb={3} />
                      <Heading size="md" color="gray.500" mb={2}>No contacts available</Heading>
                      <Text color="gray.500" mb={4}>
                        {error ? `Error: ${error}` : 
                         searchQuery ? `No contacts match your search "${searchQuery}"` : 
                         'This workspace has no contacts yet'}
                      </Text>
                      <Button
                        leftIcon={<Icon as={UserPlus} size={16} />}
                        colorScheme="blue"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        Add Contact
                      </Button>
                    </Box>
                  </Center>
                </Td>
              </Tr>
            ) : (
              contacts.map((contact) => (
                <Tr 
                  key={contact.id}
                  _hover={{ bg: hoverBgColor }}
                  cursor="pointer"
                >
                  <Td 
                    px={3} 
                    py={2}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        size="sm"
                        isChecked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectContact(e, contact.id);
                        }}
                      />
                    </Box>
                  </Td>
                  <Td px={3} py={2} onClick={() => handleRowClick(contact.id)}>
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={getDisplayName(contact)}
                        src={contact.avatar_url}
                      />
                      <Text fontSize="sm">{getDisplayName(contact)}</Text>
                    </HStack>
                  </Td>
                  <Td px={3} py={2}>
                    <Text fontSize="sm">{formatPhoneForDisplay(contact.phone_number)}</Text>
                  </Td>
                  <Td px={3} py={2}>
                    <Text fontSize="sm">{contact.email}</Text>
                  </Td>
                  <Td px={3} py={2}>
                    <HStack spacing={2}>
                      {(() => {
                        const tags = parseTags(contact.tags);
                        return tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            colorScheme={getTagColor(tag)}
                            fontSize="sm"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {getTagText(tag)}
                          </Badge>
                        ));
                        if (tags.length > 2) {
                          return (
                            <Badge
                              colorScheme="gray"
                              fontSize="sm"
                              px={2}
                              py={1}
                              borderRadius="full"
                            >
                              +{tags.length - 2}
                            </Badge>
                          );
                        }
                      })()}
                    </HStack>
                  </Td>
                  <Td px={3} py={2}>
                    <Badge
                      {...getStatusBadgeProps(contact.status)}
                      fontSize="sm"
                      px={2}
                      py={1}
                    >
                      {contact.status === 'dnc' ? 'DNC' : contact.status || 'Active'}
                    </Badge>
                  </Td>
                  <Td px={3} py={2}>
                    <HStack spacing={2} justifyContent="center">
                      {activeCallContactId === contact.id ? (
                        <HStack 
                          bg="blue.50" 
                          p={2} 
                          borderRadius="md" 
                          spacing={3}
                          border="1px solid"
                          borderColor="blue.200"
                        >
                          <Text fontSize="sm" color="blue.700">
                            {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
                          </Text>
                          <Tooltip label={isMuted ? 'Unmute' : 'Mute'}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme={isMuted ? 'red' : 'gray'}
                              icon={<Icon as={isMuted ? MicOff : Mic} size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMute();
                              }}
                              aria-label={isMuted ? 'Unmute' : 'Mute'}
                            />
                          </Tooltip>
                          <Tooltip label="End Call">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              icon={<Icon as={PhoneOff} size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndCall();
                              }}
                              aria-label="End Call"
                            />
                          </Tooltip>
                        </HStack>
                      ) : (
                        <>
                          <Tooltip label="Send Message">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              icon={<Icon as={MessageCircle} size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickMessage(contact);
                              }}
                              aria-label="Send Message"
                            />
                          </Tooltip>
                          <Tooltip label={activeCallContactId ? 'Another call in progress' : 'Start Call'}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              icon={<Icon as={Phone} size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartCall(contact);
                              }}
                              aria-label="Start Call"
                              isDisabled={!!activeCallContactId}
                            />
                          </Tooltip>
                        </>
                      )}
                      
                      {/* More Actions Menu */}
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          size="sm"
                          variant="ghost"
                          icon={<Icon as={MoreVertical} size={14} />}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Portal>
                          <MenuList onClick={(e) => e.stopPropagation()}>
                            <MenuItem
                              icon={<Icon as={Layout} size={14} />}
                              onClick={() => handleAddToBoard(contact)}
                            >
                              Add to Board
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={Users} size={14} />}
                              onClick={() => handleAddToCampaign(contact)}
                            >
                              Add to Campaign
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={Mail} size={14} />}
                              onClick={() => handleSendEmail(contact)}
                            >
                              Send Email
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem
                              icon={<Icon as={UserCheck} size={14} color="green.500" />}
                              onClick={() => handleUpdateStatus(contact.id, 'qualified')}
                              bg="green.50"
                              _hover={{ bg: 'green.100' }}
                            >
                              <Text color="green.700">Mark as Qualified</Text>
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={UserMinus} size={14} color="gray.500" />}
                              onClick={() => handleUpdateStatus(contact.id, 'inactive')}
                              bg="gray.50"
                              _hover={{ bg: 'gray.100' }}
                            >
                              <Text color="gray.700">Mark Inactive</Text>
                            </MenuItem>
                            <MenuItem
                              icon={<Icon as={UserX} size={14} color="red.500" />}
                              onClick={() => handleUpdateStatus(contact.id, 'dnc')}
                              bg="red.50"
                              _hover={{ bg: 'red.100' }}
                            >
                              <Text color="red.700">Mark as DNC</Text>
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem
                              icon={<Icon as={Trash} size={14} color="red.500" />}
                              onClick={() => handleDeleteContact(contact)}
                              bg="red.50"
                              _hover={{ bg: 'red.100' }}
                            >
                              <Text color="red.700">Delete Contact</Text>
                            </MenuItem>
                          </MenuList>
                        </Portal>
                      </Menu>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Footer */}
      <Box mt={4} display="flex" justifyContent="space-between" alignItems="center" px={4}>
        <Text fontSize="sm" color={secondaryTextColor}>
          {contacts.length > 0
            ? `${contacts.length}${totalContacts ? `/${totalContacts}` : ''} contacts`
            : 'No contacts'}
        </Text>
        {hasNextPage && (
          <Button
            size="sm"
            variant="ghost"
            onClick={loadMoreContacts}
            isLoading={isLoading}
          >
            Load More
          </Button>
        )}
      </Box>

      {/* Delete Alert Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        onClose={onDeleteAlertClose}
        leastDestructiveRef={cancelRef}
        isCentered
        motionPreset="scale"
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg={bgColor}
            borderRadius="xl"
            boxShadow="xl"
            maxW="400px"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="medium" pb={2}>
              Delete Contacts
            </AlertDialogHeader>
            <AlertDialogBody pb={6}>
              Are you sure you want to delete {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button
                ref={cancelRef}
                onClick={onDeleteAlertClose}
                variant="ghost"
                size="sm"
                fontWeight="medium"
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  handleBulkDelete();
                  onDeleteAlertClose();
                }}
                size="sm"
                fontWeight="medium"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {selectedContacts.length > 0 && (
        <HStack
          position="fixed"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          spacing={2}
          bg="white"
          p={2}
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
        >
          <Text fontSize="sm" color="gray.600">
            {selectedContacts.length} selected
          </Text>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
            >
              Bulk Actions
            </MenuButton>
            <MenuList>
              <MenuItem
                icon={<Icon as={Layout} size={14} />}
                onClick={handleBulkAddToBoard}
              >
                Add to Board
              </MenuItem>
              <MenuItem
                icon={<Icon as={Users} size={14} />}
                onClick={handleBulkAddToCampaign}
              >
                Add to Campaign
              </MenuItem>
              <MenuDivider />
              <Menu placement="end-start" offset={[0, 0]}>
                <MenuButton
                  as={MenuItem}
                  icon={<Icon as={Tag} size={14} />}
                  rightIcon={<ChevronRightIcon />}
                >
                  <HStack w="100%" justify="space-between">
                    <Text>Change Status</Text>
                    <ChevronRightIcon />
                  </HStack>
                  <Portal>
                    <MenuList ml={2}>
                      {isLoadingStatuses ? (
                        <MenuItem closeOnSelect={false}>
                          <HStack>
                            <Spinner size="sm" />
                            <Text>Loading statuses...</Text>
                          </HStack>
                        </MenuItem>
                      ) : statusOptions?.length === 0 ? (
                        <MenuItem closeOnSelect={false} isDisabled>
                          No statuses found
                        </MenuItem>
                      ) : (
                        statusOptions.map((status) => (
                          <MenuItem
                            key={status.id}
                            onClick={() => handleBulkStatusChange(status.id)}
                            isDisabled={isUpdatingStatus}
                          >
                            <HStack>
                              {isUpdatingStatus && (
                                <Spinner size="sm" mr={2} />
                              )}
                              <Box
                                w="2"
                                h="2"
                                borderRadius="full"
                                bg={status.color || 'gray.500'}
                                mr={2}
                              />
                              <Text>{status.name}</Text>
                            </HStack>
                          </MenuItem>
                        ))
                      )}
                    </MenuList>
                  </Portal>
                </MenuButton>
              </Menu>
              <MenuItem
                icon={<Icon as={UserCheck} size={14} color="green.500" />}
                onClick={() => handleBulkUpdateStatus('qualified')}
                bg="green.50"
                _hover={{ bg: 'green.100' }}
              >
                <Text color="green.700">Mark as Qualified</Text>
              </MenuItem>
              <MenuItem
                icon={<Icon as={UserMinus} size={14} color="gray.500" />}
                onClick={() => handleBulkUpdateStatus('inactive')}
                bg="gray.50"
                _hover={{ bg: 'gray.100' }}
              >
                <Text color="gray.700">Mark Inactive</Text>
              </MenuItem>
              <MenuItem
                icon={<Icon as={UserX} size={14} color="red.500" />}
                onClick={() => handleBulkUpdateStatus('dnc')}
                bg="red.50"
                _hover={{ bg: 'red.100' }}
              >
                <Text color="red.700">Mark as DNC</Text>
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<Icon as={Trash} size={14} color="red.500" />}
                onClick={handleBulkDelete}
                bg="red.50"
                _hover={{ bg: 'red.100' }}
              >
                <Text color="red.700">Delete Contacts</Text>
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      )}

      {/* Modals */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <AddContactToBoardModal
        isOpen={isAddToBoardModalOpen}
        onClose={() => setIsAddToBoardModalOpen(false)}
        contact={selectedContact}
        workspaceId={currentWorkspace?.id}
      />
      <ContactDetailView
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        contactId={selectedContactId}
      />
      <QuickMessage
        isOpen={isQuickMessageOpen}
        onClose={() => {
          setIsQuickMessageOpen(false);
          setSelectedContactForMessage(null);
        }}
        contact={selectedContactForMessage}
      />
      <AddContactToBoardModal
        isOpen={isBoardModalOpen}
        onClose={() => {
          onBoardModalClose();
          setSelectedContact(null);
          setSelectedContactsForBoard([]);
        }}
        contact={selectedContact}
        contacts={selectedContactsForBoard}
        workspaceId={currentWorkspace?.id}
      />
      <AddToCampaignModal
        isOpen={isAddToCampaignModalOpen}
        onClose={() => setIsAddToCampaignModalOpen(false)}
        contacts={selectedContacts}
        workspaceId={currentWorkspace?.id}
        onSuccess={() => {
          setSelectedContacts([]);
          loadContacts();
        }}
      />
      <ChatPopUp 
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setSelectedChatContact(null);
        }}
        contactId={selectedChatContact}
      />
    </Box>
  );
}

export default ContactsPageV2;
