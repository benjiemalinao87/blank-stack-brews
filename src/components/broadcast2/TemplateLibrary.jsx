import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardFooter,
  Stack,
  Divider,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  HStack,
  Tag,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import {
  AddIcon,
  Search2Icon,
  EmailIcon,
  ChatIcon,
  ChevronDownIcon,
  EditIcon,
  CopyIcon,
  DeleteIcon,
  ViewIcon,
  StarIcon
} from '@chakra-ui/icons';

/**
 * Template Library Component
 * 
 * Manages reusable message templates for SMS and Email campaigns.
 * Uses mock data for demonstration purposes.
 */
const TemplateLibrary = ({ workspaceId }) => {
  const [templates, setTemplates] = useState(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.750');
  const theadBg = useColorModeValue('gray.50', 'gray.700');
  const previewContentBg = useColorModeValue('gray.50', 'gray.700');
  const smsBgLight = 'green.50';
  const smsBgDark = 'green.900';
  const emailBgLight = 'blue.50';
  const emailBgDark = 'blue.900';
  const smsBg = useColorModeValue(smsBgLight, smsBgDark);
  const emailBg = useColorModeValue(emailBgLight, emailBgDark);
  const categoryIconBg = useColorModeValue('purple.50', 'purple.900');
  
  // Handle selecting a template for preview
  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    onOpen();
  };
  
  // Handle duplicating a template
  const handleDuplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString()
    };
    
    setTemplates([...templates, newTemplate]);
  };
  
  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'all' || template.channel === channelFilter;
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesChannel && matchesCategory;
  });
  
  // Get unique categories for filtering
  const categories = [...new Set(templates.map(t => t.category))];
  
  // Function to get appropriate background color based on channel
  const getChannelBg = (channel) => {
    return channel === 'sms' ? smsBg : emailBg;
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Message Templates</Heading>
        
        <HStack spacing={4}>
          <InputGroup maxW="250px" size="sm">
            <InputLeftElement pointerEvents="none">
              <Search2Icon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search templates..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Select 
            maxW="150px" 
            size="sm"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS Only</option>
            <option value="email">Email Only</option>
          </Select>
          
          <Select 
            maxW="180px" 
            size="sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="purple" 
            size="sm"
          >
            New Template
          </Button>
        </HStack>
      </Flex>
      
      <Tabs colorScheme="purple" mb={6}>
        <TabList>
          <Tab>Card View</Tab>
          <Tab>List View</Tab>
        </TabList>
        
        <TabPanels>
          {/* Card View */}
          <TabPanel px={0}>
            <SimpleGrid 
              columns={{ base: 1, md: 2, lg: 3, xl: 4 }} 
              spacing={6}
            >
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  maxW='md'
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth="1px"
                  boxShadow="sm"
                  _hover={{ boxShadow: "md" }}
                  transition="box-shadow 0.2s"
                >
                  <CardBody>
                    <Flex justify="space-between" mb={2}>
                      <Badge 
                        colorScheme={template.channel === 'sms' ? 'green' : 'blue'}
                        display="flex"
                        alignItems="center"
                      >
                        {template.channel === 'sms' 
                          ? <ChatIcon mr={1} fontSize="xs" /> 
                          : <EmailIcon mr={1} fontSize="xs" />
                        }
                        {template.channel.toUpperCase()}
                      </Badge>
                      
                      {template.is_favorite && (
                        <StarIcon color="yellow.400" />
                      )}
                    </Flex>
                    
                    <Heading size="md" mb={2}>{template.name}</Heading>
                    
                    <Tag size="sm" colorScheme="purple" mb={4}>
                      {template.category}
                    </Tag>
                    
                    <Text noOfLines={4} fontSize="sm">
                      {template.content}
                    </Text>
                  </CardBody>
                  
                  <Divider borderColor={borderColor} />
                  
                  <CardFooter>
                    <ButtonGroup spacing={2}>
                      <Button 
                        variant="ghost" 
                        colorScheme="purple" 
                        size="sm"
                        leftIcon={<ViewIcon />}
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        Preview
                      </Button>
                      
                      <Menu>
                        <MenuButton 
                          as={Button} 
                          variant="ghost" 
                          size="sm"
                          rightIcon={<ChevronDownIcon />}
                        >
                          Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem icon={<EditIcon />}>Edit</MenuItem>
                          <MenuItem 
                            icon={<CopyIcon />}
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            Duplicate
                          </MenuItem>
                          <MenuItem icon={<DeleteIcon />} color="red.500">
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </ButtonGroup>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>
          
          {/* List View */}
          <TabPanel px={0}>
            <Box 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={borderColor}
              overflow="hidden"
            >
              <Table variant="simple">
                <Thead bg={theadBg}>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Channel</Th>
                    <Th>Category</Th>
                    <Th>Created</Th>
                    <Th width="150px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTemplates.map(template => (
                    <Tr key={template.id} _hover={{ bg: hoverBg }}>
                      <Td>
                        <Flex align="center">
                          {template.is_favorite && (
                            <StarIcon color="yellow.400" mr={2} />
                          )}
                          <Text fontWeight="medium">{template.name}</Text>
                        </Flex>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={template.channel === 'sms' ? 'green' : 'blue'}
                        >
                          {template.channel.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>{template.category}</Td>
                      <Td>{new Date(template.created_at).toLocaleDateString()}</Td>
                      <Td>
                        <ButtonGroup size="sm" spacing={1}>
                          <IconButton
                            icon={<ViewIcon />}
                            aria-label="Preview template"
                            variant="ghost"
                            onClick={() => handlePreviewTemplate(template)}
                          />
                          <IconButton
                            icon={<EditIcon />}
                            aria-label="Edit template"
                            variant="ghost"
                          />
                          <IconButton
                            icon={<CopyIcon />}
                            aria-label="Duplicate template"
                            variant="ghost"
                            onClick={() => handleDuplicateTemplate(template)}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            aria-label="Delete template"
                            variant="ghost"
                            colorScheme="red"
                          />
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Template Categories */}
      <Box>
        <Heading size="md" mb={4}>Template Categories</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <CategoryCard 
            name="Onboarding" 
            count={countTemplatesByCategory(templates, 'Onboarding')} 
            icon={<ChatIcon color="purple.500" />} 
            categoryIconBg={categoryIconBg}
            borderColor={borderColor}
            cardBg={cardBg}
          />
          <CategoryCard 
            name="Promotional" 
            count={countTemplatesByCategory(templates, 'Promotional')} 
            icon={<ChatIcon color="orange.500" />} 
            categoryIconBg={categoryIconBg}
            borderColor={borderColor}
            cardBg={cardBg}
          />
          <CategoryCard 
            name="Follow-up" 
            count={countTemplatesByCategory(templates, 'Follow-up')} 
            icon={<ChatIcon color="blue.500" />} 
            categoryIconBg={categoryIconBg}
            borderColor={borderColor}
            cardBg={cardBg}
          />
          <CategoryCard 
            name="Reminder" 
            count={countTemplatesByCategory(templates, 'Reminder')} 
            icon={<ChatIcon color="green.500" />} 
            categoryIconBg={categoryIconBg}
            borderColor={borderColor}
            cardBg={cardBg}
          />
        </SimpleGrid>
      </Box>
      
      {/* Template Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center">
              <Text mr={2}>{selectedTemplate?.name}</Text>
              {selectedTemplate && (
                <Badge colorScheme={selectedTemplate.channel === 'sms' ? 'green' : 'blue'}>
                  {selectedTemplate.channel.toUpperCase()}
                </Badge>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTemplate && (
              <Box>
                <Text mb={4} fontWeight="bold">Template Content:</Text>
                <Box 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  borderColor={borderColor}
                  bg={previewContentBg}
                  mb={4}
                  whiteSpace="pre-wrap"
                >
                  {selectedTemplate.content}
                </Box>
                
                {selectedTemplate.variables?.length > 0 && (
                  <Box mb={4}>
                    <Text mb={2} fontWeight="bold">Variables:</Text>
                    <HStack flexWrap="wrap">
                      {selectedTemplate.variables.map(variable => (
                        <Tag key={variable} colorScheme="purple" m={1}>
                          {variable}
                        </Tag>
                      ))}
                    </HStack>
                  </Box>
                )}
                
                <Text mb={2} fontWeight="bold">Preview:</Text>
                <Box 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  borderColor={borderColor}
                  maxW={selectedTemplate.channel === 'sms' ? '300px' : '100%'}
                  mx={selectedTemplate.channel === 'sms' ? 'auto' : '0'}
                  bg={getChannelBg(selectedTemplate.channel)}
                >
                  {/* This would be a more sophisticated preview with variable substitution */}
                  {selectedTemplate.content}
                </Box>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" mr={3}>
              Use Template
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Helper component for template categories
const CategoryCard = ({ name, count, icon, categoryIconBg, borderColor, cardBg }) => {
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={cardBg}
      boxShadow="sm"
      _hover={{ boxShadow: "md" }}
      transition="box-shadow 0.2s"
    >
      <Flex justify="space-between" align="center">
        <HStack>
          <Box borderRadius="full" bg={categoryIconBg} p={2}>
            {icon}
          </Box>
          <Text fontWeight="medium">{name}</Text>
        </HStack>
        <Badge colorScheme="purple">{count}</Badge>
      </Flex>
    </Box>
  );
};

// Helper to count templates by category
const countTemplatesByCategory = (templates, category) => {
  return templates.filter(t => t.category === category).length;
};

// Mock data for templates
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Welcome Message',
    category: 'Onboarding',
    channel: 'sms',
    content: "Hi {{firstName}}, welcome to our service! We're excited to have you on board. Reply HELP for assistance or STOP to unsubscribe.",
    variables: ['firstName'],
    is_favorite: true,
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z'
  },
  {
    id: 'template-2',
    name: 'Appointment Reminder',
    category: 'Reminder',
    channel: 'sms',
    content: 'Hi {{firstName}}, this is a reminder about your appointment on {{appointmentDate}} at {{appointmentTime}}. Reply C to confirm or R to reschedule.',
    variables: ['firstName', 'appointmentDate', 'appointmentTime'],
    is_favorite: false,
    created_at: '2025-03-16T11:30:00Z',
    updated_at: '2025-03-16T11:30:00Z'
  },
  {
    id: 'template-3',
    name: 'Product Launch',
    category: 'Promotional',
    channel: 'email',
    content: "Dear {{firstName}},\n\nWe're excited to announce the launch of our new product, {{productName}}! As a valued customer, you get early access.\n\nCheck it out at {{productUrl}}.\n\nBest regards,\nThe Team",
    variables: ['firstName', 'productName', 'productUrl'],
    is_favorite: true,
    created_at: '2025-03-17T14:45:00Z',
    updated_at: '2025-03-17T14:45:00Z'
  },
  {
    id: 'template-4',
    name: 'Follow-up Email',
    category: 'Follow-up',
    channel: 'email',
    content: 'Dear {{firstName}},\n\nThank you for your interest in our services. I wanted to follow up on our conversation about {{topic}}.\n\nDo you have time for a quick call this week?\n\nBest regards,\n{{agentName}}',
    variables: ['firstName', 'topic', 'agentName'],
    is_favorite: false,
    created_at: '2025-03-18T09:15:00Z',
    updated_at: '2025-03-18T09:15:00Z'
  },
  {
    id: 'template-5',
    name: 'Special Offer',
    category: 'Promotional',
    channel: 'sms',
    content: 'Limited time offer! Get {{discountPercent}}% off your next purchase with code {{promoCode}}. Valid until {{expiryDate}}.',
    variables: ['discountPercent', 'promoCode', 'expiryDate'],
    is_favorite: false,
    created_at: '2025-03-19T16:20:00Z',
    updated_at: '2025-03-19T16:20:00Z'
  },
  {
    id: 'template-6',
    name: 'Thank You Message',
    category: 'Follow-up',
    channel: 'sms',
    content: 'Thank you, {{firstName}}! Your order #{{orderNumber}} has been confirmed. We appreciate your business!',
    variables: ['firstName', 'orderNumber'],
    is_favorite: true,
    created_at: '2025-03-20T13:10:00Z',
    updated_at: '2025-03-20T13:10:00Z'
  }
];

export default TemplateLibrary; 