import React from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  MenuGroup,
} from '@chakra-ui/react';
import { ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import RichTextEditor from '../components/RichTextEditor';

const CampaignNode = ({ node, onChange, onDelete, isFirst = false }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('purple.400', 'purple.500');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const buttonBg = useColorModeValue('purple.50', 'purple.900');
  const buttonHoverBg = useColorModeValue('purple.100', 'purple.800');

  const handleMessageSnippet = (snippet) => {
    const newMessage = node.message ? `${node.message} {{${snippet}}}` : `{{${snippet}}}`;
    onChange({ ...node, message: newMessage });
  };

  return (
    <Box 
      bg={bgColor} 
      borderRadius="lg" 
      p={4}
      borderWidth="1px"
      borderColor={isFirst ? 'purple.400' : borderColor}
      _hover={{ 
        borderColor: hoverBorderColor,
        shadow: 'md',
        transform: 'translateY(-1px)'
      }}
      mb={4}
      shadow="sm"
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text 
          fontWeight={isFirst ? "semibold" : "medium"}
          color={isFirst ? "purple.500" : textColor}
          fontSize="md"
        >
          {isFirst ? 'Launch Day' : `Day ${node.day}`}
        </Text>
        <Flex align="center" gap={3}>
          <Select
            value={node.type}
            onChange={(e) => onChange({ ...node, type: e.target.value })}
            size="sm"
            width="120px"
            borderColor={borderColor}
            _hover={{ borderColor: hoverBorderColor }}
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
          >
            <option value="sms">Send SMS</option>
            <option value="email">Send Email</option>
            <option value="whatsapp">Send WhatsApp</option>
          </Select>

          <Select
            value={node.trigger_status || ''}
            onChange={(e) => onChange({ ...node, trigger_status: e.target.value })}
            size="sm"
            width="150px"
            borderColor={borderColor}
            _hover={{ borderColor: hoverBorderColor }}
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
            placeholder="Select trigger"
          >
            <option value="Lead">On Lead</option>
            <option value="Scheduled">On Scheduled</option>
            <option value="Sold">On Sold</option>
          </Select>

          <Text fontSize="sm" color={mutedTextColor}>at</Text>
          <Input
            type="time"
            value={node.send_time}
            onChange={(e) => onChange({ ...node, send_time: e.target.value })}
            size="sm"
            width="100px"
            borderColor={borderColor}
            _hover={{ borderColor: hoverBorderColor }}
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
          />
          {!isFirst && (
            <Tooltip label="Delete message" placement="top">
              <IconButton
                size="sm"
                icon={<DeleteIcon />}
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete(node.id)}
                aria-label="Delete node"
                _hover={{ bg: 'red.50', color: 'red.600' }}
              />
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {node.type === 'email' && (
        <FormControl mb={4}>
          <FormLabel fontSize="sm" color={mutedTextColor}>Subject</FormLabel>
          <Input
            value={node.subject || ''}
            onChange={(e) => onChange({ ...node, subject: e.target.value })}
            placeholder="Enter email subject"
            size="md"
            borderColor={borderColor}
            _hover={{ borderColor: hoverBorderColor }}
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
          />
        </FormControl>
      )}

      <Box mb={4}>
        <FormLabel fontSize="sm" color={mutedTextColor}>
          {node.type === 'email' ? 'Email Body' : 'Message'}
        </FormLabel>
        <RichTextEditor
          value={node.message || ''}
          onChange={(value) => onChange({ ...node, message: value })}
          placeholder={node.type === 'email' ? 'Write your email...' : 'Write your message...'}
        />
      </Box>

      <Flex justify="space-between" align="center">
        <Menu placement="bottom-start">
          <MenuButton
            as={Button}
            size="sm"
            variant="ghost"
            rightIcon={<ChevronDownIcon />}
            _hover={{ bg: buttonBg }}
            _active={{ bg: buttonHoverBg }}
          >
            Insert Variable
          </MenuButton>
          <MenuList 
            maxH="300px" 
            overflowY="auto" 
            w="200px"
            fontSize="sm"
            py={2}
            boxShadow="md"
            border="1px solid"
            borderColor={borderColor}
          >
            {/* Standard Contact Fields */}
            <MenuGroup title="Basic Info" fontSize="xs" ml={3} mb={1} color={mutedTextColor}>
              <MenuItem onClick={() => handleMessageSnippet('name')} px={3}>
                Full Name
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('firstname')} px={3}>
                First Name
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('lastname')} px={3}>
                Last Name
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('phone_number')} px={3}>
                Phone Number
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('email')} px={3}>
                Email
              </MenuItem>
            </MenuGroup>

            {/* Address Fields */}
            <MenuGroup title="Address" fontSize="xs" ml={3} mb={1} mt={2} color={mutedTextColor}>
              <MenuItem onClick={() => handleMessageSnippet('st_address')} px={3}>
                Street Address
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('city')} px={3}>
                City
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('state')} px={3}>
                State
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('zip')} px={3}>
                ZIP Code
              </MenuItem>
            </MenuGroup>

            {/* Lead Info */}
            <MenuGroup title="Lead Info" fontSize="xs" ml={3} mb={1} mt={2} color={mutedTextColor}>
              <MenuItem onClick={() => handleMessageSnippet('lead_source')} px={3}>
                Lead Source
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('type')} px={3}>
                Contact Type
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('stage')} px={3}>
                Stage
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('conversation_status')} px={3}>
                Conversation Status
              </MenuItem>
            </MenuGroup>

            {/* Custom Fields */}
            <MenuGroup title="Custom Fields" fontSize="xs" ml={3} mb={1} mt={2} color={mutedTextColor}>
              <MenuItem onClick={() => handleMessageSnippet('metadata.market')} px={3}>
                Market
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('metadata.product')} px={3}>
                Product
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('metadata.custom_fields')} px={3}>
                All Custom Fields
              </MenuItem>
            </MenuGroup>

            {/* System Fields */}
            <MenuGroup title="System Info" fontSize="xs" ml={3} mb={1} mt={2} color={mutedTextColor}>
              <MenuItem onClick={() => handleMessageSnippet('created_at')} px={3}>
                Created Date
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('last_activity_at')} px={3}>
                Last Activity
              </MenuItem>
              <MenuItem onClick={() => handleMessageSnippet('tags')} px={3}>
                Tags
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default CampaignNode;
