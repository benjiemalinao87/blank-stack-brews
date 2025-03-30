import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useColorModeValue,
  Flex,
  Divider,
  Spinner,
  HStack,
  Collapse,
  Tooltip,
  Tag,
  MenuDivider,
  Avatar,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, AddIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { BsFilter, BsPersonPlus, BsPerson, BsPersonCheck, BsPeople, BsEnvelope, BsTelephone, BsArchive, BsSend, BsShieldExclamation, BsSortDown, BsFunnel, BsCircleFill } from 'react-icons/bs';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import useContactV2Store from '../../services/contactV2State';
import useMessageStore from '../../services/messageStore';
import { useWindowState } from '../../contexts/WindowContext';
import ContactListItem from './ContactListItem';
import { supabase } from '../../lib/supabaseUnified';
import logger from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const ContactList = ({
  contacts,
  selectedContact,
  onSelectContact,
  onAddContact,
  isDark,
}) => {
  const [inputValue, setInputValue] = useState('');
  const { isMaximized } = useWindowState();
  const { messages } = useMessageStore();
  const { setLivechatSearchQuery, livechatSearchQuery, isLoading } = useContactV2Store();

  // Update inputValue when livechatSearchQuery changes from external sources
  useEffect(() => {
    setInputValue(livechatSearchQuery || '');
  }, [livechatSearchQuery]);

  // Handle input change with immediate UI update
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setLivechatSearchQuery(value);
  };

  // Chakra color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.600');

  // Get last messages for all contacts in a single query
  const getLastMessages = async (contacts) => {
    if (!contacts?.length) return {};
    
    try {
      // Get all contact IDs
      const contactIds = contacts.map(c => c.id);
      
      // Get the latest message for each contact using a more efficient query
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by contact_id and get the latest one
      const latestMessages = {};
      if (messages) {
        messages.forEach(message => {
          // Only store the first (latest) message for each contact
          if (!latestMessages[message.contact_id]) {
            latestMessages[message.contact_id] = message;
          }
        });
      }
      
      return latestMessages;
    } catch (error) {
      console.error('Error fetching last messages:', error);
      return {};
    }
  };

  // Store last messages for each contact with caching
  const [lastMessages, setLastMessages] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Load last messages for all contacts with caching
  useEffect(() => {
    let mounted = true;

    const loadLastMessages = async () => {
      try {
        const messages = await getLastMessages(contacts);
        if (mounted) {
          setLastMessages(messages);
          setLastFetchTime(Date.now());
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    // Initial load
    loadLastMessages();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        async (payload) => {
          if (mounted) {
            // Only update if the message is for one of our contacts
            const contactId = payload.new?.contact_id;
            if (contactId && contacts.some(c => c.id === contactId)) {
              loadLastMessages();
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription and prevent memory leaks
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [contacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    const query = livechatSearchQuery?.toLowerCase().trim() || '';
    
    // Log all available contacts for debugging
    console.log('ContactList - All available contacts:', contacts);
    
    // Filter by search query if present
    const filtered = contacts
      .filter(contact => {
        if (!query) return true;
        
        // Helper function to safely check if a string contains the query
        const contains = (str) => {
          if (!str) return false;
          return str.toLowerCase().includes(query);
        };
        
        // Check all searchable fields
        return (
          contains(contact.firstname) ||
          contains(contact.lastname) ||
          contains(contact.email) ||
          contains(contact.phone_number)
        );
      })
      .sort((a, b) => {
        // First priority: unread messages
        if ((a.metadata?.unread_count || 0) !== (b.metadata?.unread_count || 0)) {
          return (b.metadata?.unread_count || 0) - (a.metadata?.unread_count || 0);
        }

        // Second priority: last message time
        const aMsg = lastMessages[a.id];
        const bMsg = lastMessages[b.id];
        
        const aTime = aMsg?.created_at || aMsg?.timestamp || a.created_at;
        const bTime = bMsg?.created_at || bMsg?.timestamp || b.created_at;
        
        return new Date(bTime) - new Date(aTime);
      });
      
    console.log('ContactList - Filtered contacts:', filtered);
    return filtered;
  }, [contacts, livechatSearchQuery, lastMessages]);

  // Infinite loader configuration
  const itemCount = filteredContacts.length;
  const loadMoreItems = () => {};
  const isItemLoaded = (index) => index < filteredContacts.length;

  // Row renderer for virtualized list
  const Row = ({ index, style }) => {
    const contact = filteredContacts[index];
    if (!contact) return null;

    return (
      <ContactListItem
        contact={contact}
        isSelected={selectedContact?.id === contact.id}
        lastMessage={lastMessages[contact.id]}
        onClick={() => onSelectContact(contact)}
        style={style}
      />
    );
  };

  return (
    <Box
      h="100%"
      borderRight="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      w={{ base: "100%", md: "400px" }}
      maxW="100%"
      overflow="hidden"
    >
      <VStack h="100%" spacing={2} p={2}>
        <HStack w="full" spacing={2}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Search contacts..."
              value={inputValue}
              onChange={handleInputChange}
              bg={inputBg}
            />
          </InputGroup>

          {/* Lead Status Menu */}
          <Menu>
            <Tooltip label="Search by Lead Status" placement="top">
              <MenuButton
                as={IconButton}
                icon={<BsFunnel />}
                variant="ghost"
                size="sm"
                aria-label="Search by Lead Status"
              />
            </Tooltip>
            <MenuList fontSize="sm">
              <MenuItem>
                <HStack>
                  <BsCircleFill color="#48BB78" size={8} />
                  <span>New Lead</span>
                </HStack>
              </MenuItem>
              <MenuItem>
                <HStack>
                  <BsCircleFill color="#4299E1" size={8} />
                  <span>In Progress</span>
                </HStack>
              </MenuItem>
              <MenuItem>
                <HStack>
                  <BsCircleFill color="#F6AD55" size={8} />
                  <span>Pending</span>
                </HStack>
              </MenuItem>
              <MenuItem>
                <HStack>
                  <BsCircleFill color="#9F7AEA" size={8} />
                  <span>Qualified</span>
                </HStack>
              </MenuItem>
              <MenuItem>
                <HStack>
                  <BsCircleFill color="#E53E3E" size={8} />
                  <span>Lost</span>
                </HStack>
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<BsFunnel />}>Manage Statuses...</MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* All Icons in Single Row */}
        <HStack w="full" spacing={1} px={2} justify="space-between">
          <Tooltip label="Unassigned" placement="top">
            <IconButton
              icon={<BsPerson />}
              variant="ghost"
              size="sm"
              aria-label="Unassigned"
            />
          </Tooltip>
          <Tooltip label="Assigned to me" placement="top">
            <IconButton
              icon={<BsPersonCheck />}
              variant="ghost"
              size="sm"
              aria-label="Assigned to me"
            />
          </Tooltip>
          <Tooltip label="All open" placement="top">
            <IconButton
              icon={<BsPeople />}
              variant="ghost"
              size="sm"
              aria-label="All open"
            />
          </Tooltip>
          <Tooltip label="Email" placement="top">
            <IconButton
              icon={<BsEnvelope />}
              variant="ghost"
              size="sm"
              aria-label="Email"
            />
          </Tooltip>
          <Tooltip label="Calls" placement="top">
            <IconButton
              icon={<BsTelephone />}
              variant="ghost"
              size="sm"
              aria-label="Calls"
            />
          </Tooltip>
          <Tooltip label="All closed" placement="top">
            <IconButton
              icon={<BsArchive />}
              variant="ghost"
              size="sm"
              aria-label="All closed"
            />
          </Tooltip>
          <Tooltip label="Sent" placement="top">
            <IconButton
              icon={<BsSend />}
              variant="ghost"
              size="sm"
              aria-label="Sent"
            />
          </Tooltip>
          <Tooltip label="Spam" placement="top">
            <IconButton
              icon={<BsShieldExclamation />}
              variant="ghost"
              size="sm"
              aria-label="Spam"
            />
          </Tooltip>
        </HStack>

        {/* Contact List */}
        <Box flex="1" w="100%" overflow="hidden">
          <AutoSizer>
            {({ height, width }) => (
              <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={itemCount}
                loadMoreItems={loadMoreItems}
              >
                {({ onItemsRendered, ref }) => (
                  <List
                    height={height}
                    itemCount={itemCount}
                    itemSize={72}
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                    width={width}
                  >
                    {Row}
                  </List>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        </Box>
      </VStack>
    </Box>
  );
};

export { ContactList };