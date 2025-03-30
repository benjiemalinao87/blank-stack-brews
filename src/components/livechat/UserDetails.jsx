import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Icon,
  Button,
  Input,
  useColorModeValue,
  IconButton,
  Flex,
  Card,
  CardBody,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Center,
} from '@chakra-ui/react';
import { 
  User, 
  Calendar, 
  Target, 
  Plus, 
  MessageSquare, 
  Tag,
  ChevronRight,
  Mail
} from 'lucide-react';

export const UserDetails = ({ selectedContact }) => {
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tags, setTags] = useState(['Premium', 'Active', 'Test']);
  const [emailHistory, setEmailHistory] = useState([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  
  // Campaign styles
  const campaignBg = useColorModeValue('gray.50', 'gray.700');
  const campaignBadgeBg = useColorModeValue('blue.100', 'blue.800');
  const campaignBadgeColor = useColorModeValue('blue.800', 'blue.100');

  // Tag color values
  const redColors = { bg: useColorModeValue('red.100', 'red.800'), color: useColorModeValue('red.800', 'red.100') };
  const orangeColors = { bg: useColorModeValue('orange.100', 'orange.800'), color: useColorModeValue('orange.800', 'orange.100') };
  const yellowColors = { bg: useColorModeValue('yellow.100', 'yellow.800'), color: useColorModeValue('yellow.800', 'yellow.100') };
  const greenColors = { bg: useColorModeValue('green.100', 'green.800'), color: useColorModeValue('green.800', 'green.100') };
  const tealColors = { bg: useColorModeValue('teal.100', 'teal.800'), color: useColorModeValue('teal.800', 'teal.100') };
  const blueColors = { bg: useColorModeValue('blue.100', 'blue.800'), color: useColorModeValue('blue.800', 'blue.100') };
  const cyanColors = { bg: useColorModeValue('cyan.100', 'cyan.800'), color: useColorModeValue('cyan.800', 'cyan.100') };
  const purpleColors = { bg: useColorModeValue('purple.100', 'purple.800'), color: useColorModeValue('purple.800', 'purple.100') };
  const pinkColors = { bg: useColorModeValue('pink.100', 'pink.800'), color: useColorModeValue('pink.800', 'pink.100') };

  const colorModeValues = {
    red: redColors,
    orange: orangeColors,
    yellow: yellowColors,
    green: greenColors,
    teal: tealColors,
    blue: blueColors,
    cyan: cyanColors,
    purple: purpleColors,
    pink: pinkColors
  };

  const tagColors = Object.keys(colorModeValues);

  // Get consistent color for a tag
  const getTagColor = (tag) => {
    const hash = tag.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const color = tagColors[Math.abs(hash) % tagColors.length];
    return colorModeValues[color];
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleViewProfile = () => {
    window.open('/contact-profile', '_blank');
  };

  // Load email history when contact changes
  useEffect(() => {
    if (!selectedContact?.id) return;
    
    const fetchEmailHistory = async () => {
      setIsLoadingEmails(true);
      setEmailError(null);
      
      try {
        const workspaceId = selectedContact.workspace_id;
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || ''}/api/email/history/${selectedContact.id}?page=0&size=5`,
          {
            headers: {
              'X-Workspace-Id': workspaceId
            }
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch email history');
        }
        
        const result = await response.json();
        setEmailHistory(result.data || []);
      } catch (error) {
        console.error('Error fetching email history:', error);
        setEmailError(error.message);
      } finally {
        setIsLoadingEmails(false);
      }
    };
    
    fetchEmailHistory();
  }, [selectedContact?.id, selectedContact?.workspace_id]);

  if (!selectedContact) {
    return (
      <Box p={4} bg={bg} h="100%">
        <Text color={mutedTextColor} fontSize="sm">Select a contact to view details</Text>
      </Box>
    );
  }

  const activeCampaigns = [
    {
      name: 'Spring Sale 2024',
      startDate: '2024-03-01',
      status: 'active'
    },
    {
      name: 'New Customer Onboarding',
      startDate: '2024-02-15',
      status: 'active'
    }
  ];

  const recentActivity = [
    {
      type: 'message',
      text: 'Sent a new message',
      time: '2h ago',
      icon: MessageSquare
    },
    {
      type: 'meeting',
      text: 'Scheduled a meeting',
      time: '1d ago',
      icon: Calendar
    },
    {
      type: 'tag',
      text: 'Added tag "Priority"',
      time: '2d ago',
      icon: Tag
    }
  ];

  // Format date for display
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <Box bg={bg} h="100vh" overflowY="auto" position="relative">
      {/* Profile Header */}
      <VStack spacing={2} p={4} align="center" borderBottom="1px" borderColor={borderColor}>
        <Avatar
          size="lg"
          name={selectedContact.name || 'Benjie Malinao'}
          src={selectedContact.avatar}
          bg="orange.500"
        />
        <Text fontSize="md" fontWeight="semibold" color={textColor}>
          {selectedContact.name || 'Benjie Malinao'}
        </Text>
      </VStack>

      {/* Email History Section */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <Accordion allowToggle>
          <AccordionItem border="none">
            <h2>
              <AccordionButton px={0}>
                <HStack justify="space-between" flex="1">
                  <HStack>
                    <Icon as={Mail} size={16} />
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Email History
                    </Text>
                  </HStack>
                  <AccordionIcon />
                </HStack>
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} px={0}>
              {isLoadingEmails ? (
                <Center py={4}>
                  <Spinner size="sm" />
                </Center>
              ) : emailError ? (
                <Text fontSize="xs" color="red.500">{emailError}</Text>
              ) : emailHistory.length === 0 ? (
                <Text fontSize="xs" color={mutedTextColor}>No email history found</Text>
              ) : (
                <VStack spacing={2} align="stretch">
                  {emailHistory.map((email, index) => (
                    <Box 
                      key={index} 
                      p={2} 
                      borderRadius="md"
                      bg={campaignBg}
                      fontSize="xs"
                    >
                      <Text fontWeight="medium" mb={1}>{email.subject}</Text>
                      <Text color={mutedTextColor} mb={1} noOfLines={2}>
                        {email.content.replace(/<[^>]*>?/gm, '')}
                      </Text>
                      <Text color={mutedTextColor} fontSize="2xs">
                        {formatDate(email.sent_at || email.created_at)}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      {/* Active Campaigns */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <HStack mb={2} justify="space-between">
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            Active Campaigns
          </Text>
          <Icon as={ChevronRight} size={16} color={mutedTextColor} />
        </HStack>
        <VStack spacing={2} align="stretch">
          {activeCampaigns.map((campaign, index) => (
            <Box 
              key={index} 
              p={3} 
              bg={campaignBg}
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {campaign.name}
              </Text>
              <HStack justify="space-between" w="100%">
                <Text fontSize="xs" color={mutedTextColor}>
                  Started: {campaign.startDate}
                </Text>
                <Badge 
                  bg={campaignBadgeBg}
                  color={campaignBadgeColor}
                  textTransform="uppercase"
                  fontSize="xs"
                  px={2}
                >
                  {campaign.status}
                </Badge>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Tags */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={textColor}>
          Tags
        </Text>
        <Flex wrap="wrap" gap={2}>
          {tags.map((tag, index) => (
            <Badge 
              key={index}
              px={3}
              py={1}
              borderRadius="full"
              bg={getTagColor(tag).bg}
              color={getTagColor(tag).color}
            >
              {tag}
            </Badge>
          ))}
          {!isAddingTag && (
            <IconButton
              icon={<Plus size={14} />}
              size="sm"
              variant="ghost"
              onClick={() => setIsAddingTag(true)}
              aria-label="Add tag"
              minW="auto"
              h="auto"
              p={1}
            />
          )}
        </Flex>
        {isAddingTag && (
          <Box mt={2}>
            <HStack>
              <Input
                size="sm"
                placeholder="New tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button size="sm" colorScheme="blue" onClick={handleAddTag}>
                Add
              </Button>
            </HStack>
          </Box>
        )}
      </Box>

      {/* Quick Actions */}
      <VStack spacing={1} p={2} align="stretch">
        <Button
          variant="ghost"
          size="sm"
          justifyContent="start"
          leftIcon={<User size={16} />}
          onClick={handleViewProfile}
          h="40px"
        >
          View Profile
        </Button>
        <Button
          variant="ghost"
          size="sm"
          justifyContent="start"
          leftIcon={<Calendar size={16} />}
          h="40px"
        >
          Schedule Meeting
        </Button>
        <Button
          variant="ghost"
          size="sm"
          justifyContent="start"
          leftIcon={<Target size={16} />}
          h="40px"
        >
          Set Goals
        </Button>
      </VStack>

      {/* Recent Activity */}
      <Box p={4}>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={textColor}>
          Recent Activity
        </Text>
        <VStack spacing={2} align="stretch">
          {recentActivity.map((activity, index) => (
            <HStack key={index} spacing={2}>
              <Icon as={activity.icon} size={14} color={mutedTextColor} />
              <Box flex={1}>
                <Text fontSize="sm">{activity.text}</Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  {activity.time}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};