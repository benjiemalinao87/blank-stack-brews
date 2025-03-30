import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
  Flex,
  useDisclosure,
} from '@chakra-ui/react';
import { ChatIcon, PhoneIcon, TimeIcon, InfoIcon } from '@chakra-ui/icons';
import { useDrag } from 'react-dnd';
import { useDragDrop } from '../context/DragDropContext';
import ContactDetailView from './ContactDetailView';
import { getLeadStatusWithColors } from '../../../services/statusService';
import ChatPopUp from '../../chat/ChatPopUp';
import logger from '../../../utils/logger';

const ContactCard = ({ contact, onChat, onCall, onContactUpdated, onContactDeleted }) => {
  const ref = useRef(null);
  const { setIsDragging, setDraggedContact } = useDragDrop();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isChatPopUpOpen, setIsChatPopUpOpen] = useState(false);
  const [statusMap, setStatusMap] = useState({
    'new': { label: 'Lead', color: 'blue' },
    'contacted': { label: 'Contacted', color: 'green' },
    'qualified': { label: 'Follow-up', color: 'purple' },
    'unqualified': { label: 'Inactive', color: 'gray' },
    'sold': { label: 'Sold', color: 'orange' },
    'pending': { label: 'Pending', color: 'orange' },
    'dnc': { label: 'DNC', color: 'red' }
  });
  
  // Color mode values for dark/light theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardShadow = useColorModeValue('sm', 'dark-lg');
  const hoverShadow = useColorModeValue('md', 'dark-xl');
  const dragShadow = useColorModeValue('lg', 'dark-xl');
  
  // Fetch lead statuses on component mount or when contact status changes
  useEffect(() => {
    const fetchLeadStatuses = async () => {
      try {
        logger.info(`ContactCard: Fetching lead statuses for contact: ${contact.id}`);
        const leadStatuses = await getLeadStatusWithColors();
        logger.info(`ContactCard: Got lead statuses`, leadStatuses);
        
        // Only update if we got actual data
        if (Object.keys(leadStatuses).length > 0) {
          setStatusMap(prevMap => {
            const newMap = {
              ...prevMap,
              ...leadStatuses
            };
            logger.info(`ContactCard: New status map`, newMap);
            return newMap;
          });
        } else {
          logger.warn('ContactCard: No lead statuses returned from API');
        }
      } catch (error) {
        logger.error('Error fetching lead statuses:', error);
      }
    };
    
    fetchLeadStatuses();
    
    // Log current contact state for debugging
    logger.info('ContactCard: Current contact state:', {
      id: contact.id,
      lead_status: contact.lead_status,
      created_at: contact.created_at
    });
    
  }, [contact.id]); // Only depend on contact.id to avoid excessive re-fetching
  
  // Set up drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'CONTACT',
    item: () => {
      setIsDragging(true);
      setDraggedContact(contact);
      return { 
        id: contact.id, 
        columnId: contact.columnId,
        boardId: contact.boardId || contact.metadata?.board_id // Include the board ID
      };
    },
    end: () => {
      setIsDragging(false);
      setDraggedContact(null);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Connect the drag ref to our component
  drag(ref);
  
  // Determine contact status
  const getStatusInfo = () => {
    logger.info(`ContactCard: getStatusInfo called for ${contact?.id} with lead_status: ${contact?.lead_status}`);
    logger.info('ContactCard: Current statusMap:', statusMap);
    
    // First check if the contact has a lead_status
    if (contact.lead_status) {
      const statusLower = contact.lead_status.toLowerCase();
      logger.info(`ContactCard: Looking for status: ${statusLower}`);
      
      // Check if it's in our statusMap (from database)
      if (statusMap[statusLower]) {
        logger.info(`ContactCard: Found status in map: ${statusMap[statusLower]}`);
        return statusMap[statusLower];
      }
      
      // If the status is not in our map but the contact has a lead_status,
      // create a default status object using the lead_status
      logger.info(`ContactCard: Status not found in map, using lead_status directly: ${contact.lead_status}`);
      return {
        label: contact.lead_status,
        color: getColorForStatus(contact.lead_status)
      };
    }
    
    // If no lead_status is set, check if this is a new contact (created in the last 24 hours)
    // and assign a default "New" status
    const now = new Date();
    const createdAt = new Date(contact.created_at);
    
    // New: created in the last 24 hours - use this as default for new contacts
    if ((now - createdAt) < 24 * 60 * 60 * 1000) {
      logger.info(`ContactCard: No lead_status, but contact is new (< 24h). Using "New" status`);
      return { label: 'New', color: 'green' };
    }
    
    // For contacts without lead_status, use "Lead" as the default status
    // instead of falling back to time-based statuses
    logger.info('ContactCard: No lead_status and not new. Using default "Lead" status');
    return { label: 'Lead', color: 'blue' };
  };
  
  // Helper function to get a color for a status based on the name
  const getColorForStatus = (status) => {
    const statusLower = status.toLowerCase();
    
    // Common color associations
    if (statusLower.includes('lead') || statusLower.includes('new')) return 'blue';
    if (statusLower.includes('contact')) return 'green';
    if (statusLower.includes('follow')) return 'purple';
    if (statusLower.includes('inactive') || statusLower.includes('unqualified')) return 'gray';
    if (statusLower.includes('sold') || statusLower.includes('won')) return 'orange';
    if (statusLower.includes('dnc') || statusLower.includes('do not contact')) return 'red';
    if (statusLower.includes('pending')) return 'orange';
    
    // Default fallback colors based on first letter to ensure consistency
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const index = statusLower.charAt(0) ? letters.indexOf(statusLower.charAt(0)) : 0;
    const colors = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'];
    return colors[index % colors.length];
  };

  // Helper function to safely parse tags
  const parseTags = (tagsJson) => {
    try {
      if (!tagsJson) return [];
      
      // Handle already parsed arrays
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
      logger.error("Error parsing tags:", error);
      return [];
    }
  };

  // Helper function to safely get tag text
  const getTagText = (tag) => {
    if (!tag) return '';
    if (typeof tag === 'string') return tag;
    if (typeof tag === 'object') return tag.name || tag.label || '';
    return String(tag);
  };

  // Helper function to get tag color
  const getTagColor = (tag) => {
    const tagText = getTagText(tag).toLowerCase();
    
    // Common color associations
    if (tagText.includes('lead') || tagText.includes('new')) return 'blue';
    if (tagText.includes('contact')) return 'green';
    if (tagText.includes('follow')) return 'purple';
    if (tagText.includes('inactive')) return 'gray';
    if (tagText.includes('sold') || tagText.includes('won')) return 'orange';
    if (tagText.includes('dnc')) return 'red';
    if (tagText.includes('pending')) return 'yellow';
    
    // Default fallback colors based on first letter
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const index = tagText.charAt(0) ? letters.indexOf(tagText.charAt(0)) : 0;
    const colors = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'];
    return colors[index % colors.length];
  };

  const statusInfo = getStatusInfo();
  logger.info(`ContactCard: Final statusInfo for ${contact?.id}: ${statusInfo}`);
  
  const handleCardClick = (e) => {
    // Only open the details if we're not dragging
    if (!isDragging) {
      onOpen();
    }
  };
  
  const handleChatClick = (e) => {
    e.stopPropagation();
    setIsChatPopUpOpen(true);
  };
  
  return (
    <>
      <Box
        ref={ref}
        p={4}
        bg={bgColor}
        borderRadius="md"
        boxShadow={isDragging ? dragShadow : cardShadow}
        _hover={{ boxShadow: hoverShadow }}
        transition="all 0.2s"
        cursor="grab"
        position="relative"
        opacity={isDragging ? 0.5 : 1}
        mb={2}
        onClick={handleCardClick}
      >
        {/* Status indicator - redesigned to be small and flat */}
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontWeight="medium" color={textColor}>{contact.name}</Text>
          <Badge 
            colorScheme={statusInfo.color}
            borderRadius="sm"
            px={1.5}
            py={0.5}
            fontSize="2xs"
            textTransform="uppercase"
            fontWeight="medium"
            variant="subtle"
          >
            {statusInfo.label}
          </Badge>
        </Flex>
        
        <HStack spacing={3} align="flex-start">
          <Avatar size="sm" name={contact.name} src={contact.avatar} />
          <Box flex="1">
            <Text fontSize="xs" color={secondaryTextColor} mb={1}>{contact.timestamp}</Text>
            <Text fontSize="sm" noOfLines={2} mb={2} color={textColor}>
              {contact.message}
            </Text>
            <HStack spacing={2} justifyContent="space-between">
              {/* Render tags */}
              <HStack spacing={1}>
                {parseTags(contact.tags).slice(0, 3).map((tag, index) => (
                  <Badge
                    key={index}
                    colorScheme={getTagColor(tag)}
                    fontSize="2xs"
                    borderRadius="sm"
                    px={1.5}
                    py={0.5}
                    variant="subtle"
                    textTransform="uppercase"
                  >
                    {getTagText(tag)}
                  </Badge>
                ))}
                {parseTags(contact.tags).length > 3 && (
                  <Badge
                    colorScheme="gray"
                    fontSize="2xs"
                    borderRadius="sm"
                    px={1.5}
                    py={0.5}
                    variant="subtle"
                  >
                    +{parseTags(contact.tags).length - 3}
                  </Badge>
                )}
              </HStack>
              <HStack spacing={1}>
                <Tooltip label="View details" placement="top">
                  <IconButton
                    icon={<InfoIcon />}
                    variant="ghost"
                    size="xs"
                    colorScheme="gray"
                    aria-label="View details"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen();
                    }}
                  />
                </Tooltip>
                <Tooltip label="Open chat" placement="top">
                  <IconButton
                    icon={<ChatIcon />}
                    variant="ghost"
                    size="xs"
                    colorScheme="blue"
                    aria-label="Chat"
                    onClick={handleChatClick}
                  />
                </Tooltip>
                <Tooltip label="Start call" placement="top">
                  <IconButton
                    icon={<PhoneIcon />}
                    variant="ghost"
                    size="xs"
                    colorScheme="green"
                    aria-label="Call"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall(contact);
                    }}
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </Box>
        </HStack>
      </Box>
      
      {/* Contact Detail View */}
      <ContactDetailView
        isOpen={isOpen}
        onClose={onClose}
        contactId={contact.id}
        onContactUpdated={onContactUpdated}
        onContactDeleted={onContactDeleted}
      />
      
      {/* Chat PopUp */}
      {isChatPopUpOpen && (
        <ChatPopUp
          isOpen={isChatPopUpOpen}
          onClose={() => setIsChatPopUpOpen(false)}
          contactId={contact.id}
        />
      )}
    </>
  );
};

export default ContactCard;
