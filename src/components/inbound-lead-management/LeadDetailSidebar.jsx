import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Badge,
  Button,
  IconButton,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Flex,
  Tooltip,
  Textarea,
  Input,
  FormControl,
  FormLabel,
  Select
} from '@chakra-ui/react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  Tag,
  FileText,
  User,
  Edit,
  CheckCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Activity
} from 'lucide-react';

const LeadDetailSidebar = ({ lead, isOpen, onClose, formatDate }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const tabHoverBg = useColorModeValue('gray.100', 'gray.600');
  
  if (!isOpen || !lead) return null;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'yellow';
      case 'pending':
        return 'orange';
      case 'checked_out':
        return 'green';
      default:
        return 'gray';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'pending':
        return 'Pending';
      case 'checked_out':
        return 'Checked Out';
      default:
        return status;
    }
  };
  
  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };
  
  // Mock data for the sidebar
  const notes = [
    { id: 1, text: 'Customer is interested in the new features', date: '2023-07-15T16:30:00', author: 'Alex Johnson' },
    { id: 2, text: 'Follow up scheduled for next week', date: '2023-07-15T17:45:00', author: 'Sarah Williams' }
  ];
  
  const activities = [
    { id: 1, type: 'email', description: 'Sent welcome email', date: '2023-07-15T15:30:00', user: 'System' },
    { id: 2, type: 'note', description: 'Added note', date: '2023-07-15T16:30:00', user: 'Alex Johnson' },
    { id: 3, type: 'status', description: 'Changed status to Pending', date: '2023-07-15T17:00:00', user: 'Sarah Williams' }
  ];
  
  return (
    <Box
      position="fixed"
      top={0}
      right={0}
      height="100vh"
      width="400px"
      bg={bgColor}
      borderLeft="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
      zIndex={1100}
      overflowY="auto"
    >
      {/* Header */}
      <Flex 
        p={4} 
        bg={headerBg} 
        borderBottom="1px solid" 
        borderColor={borderColor}
        justifyContent="space-between"
        alignItems="center"
      >
        <Heading size="md">Lead Details</Heading>
        <IconButton
          icon={<X size={18} />}
          aria-label="Close"
          variant="ghost"
          onClick={onClose}
        />
      </Flex>
      
      {/* Lead Profile */}
      <Box p={4}>
        <VStack spacing={4} align="start">
          <HStack spacing={4} width="100%">
            <Avatar 
              size="xl" 
              name={getInitials(lead.firstName, lead.lastName)} 
              bg="purple.500"
              color="white"
            />
            <VStack align="start" spacing={1}>
              <Heading size="md">{lead.firstName} {lead.lastName}</Heading>
              <Text color="gray.500">{lead.customerRecordId}</Text>
              <Badge colorScheme={getStatusColor(lead.status)} mt={1}>
                {getStatusText(lead.status)}
              </Badge>
            </VStack>
          </HStack>
          
          <Divider />
          
          {/* Quick Actions */}
          <HStack spacing={2} width="100%">
            <Tooltip label="Call">
              <Button 
                leftIcon={<Phone size={16} />} 
                size="sm" 
                colorScheme="blue" 
                variant="outline"
                flex={1}
              >
                Call
              </Button>
            </Tooltip>
            <Tooltip label="Email">
              <Button 
                leftIcon={<Mail size={16} />} 
                size="sm" 
                colorScheme="green" 
                variant="outline"
                flex={1}
              >
                Email
              </Button>
            </Tooltip>
            <Tooltip label="Message">
              <Button 
                leftIcon={<MessageSquare size={16} />} 
                size="sm" 
                colorScheme="purple" 
                variant="outline"
                flex={1}
              >
                Message
              </Button>
            </Tooltip>
          </HStack>
          
          {/* Contact Information */}
          <Box width="100%">
            <Heading size="sm" mb={2}>Contact Information</Heading>
            <VStack align="start" spacing={2}>
              <HStack>
                <Phone size={16} />
                <Text>{lead.phone}</Text>
              </HStack>
              <HStack>
                <Mail size={16} />
                <Text>{lead.email}</Text>
              </HStack>
              <HStack>
                <MapPin size={16} />
                <Text>{lead.city}, {lead.state}</Text>
              </HStack>
            </VStack>
          </Box>
          
          <Divider />
          
          {/* Lead Details */}
          <Box width="100%">
            <Heading size="sm" mb={2}>Lead Details</Heading>
            <VStack align="start" spacing={2}>
              <HStack justifyContent="space-between" width="100%">
                <HStack>
                  <Tag size={16} />
                  <Text fontWeight="medium">Product:</Text>
                </HStack>
                <Text>{lead.product}</Text>
              </HStack>
              <HStack justifyContent="space-between" width="100%">
                <HStack>
                  <ExternalLink size={16} />
                  <Text fontWeight="medium">Source:</Text>
                </HStack>
                <Text>{lead.source}</Text>
              </HStack>
              <HStack justifyContent="space-between" width="100%">
                <HStack>
                  <Calendar size={16} />
                  <Text fontWeight="medium">Received:</Text>
                </HStack>
                <Text>{formatDate(lead.received)}</Text>
              </HStack>
              <HStack justifyContent="space-between" width="100%">
                <HStack>
                  <User size={16} />
                  <Text fontWeight="medium">Assigned To:</Text>
                </HStack>
                <Text>{lead.checkedOutBy || 'Unassigned'}</Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Box>
      
      {/* Tabs */}
      <Tabs colorScheme="purple" isLazy>
        <TabList px={4} borderBottom="1px solid" borderColor={borderColor}>
          <Tab _hover={{ bg: tabHoverBg }}>Notes</Tab>
          <Tab _hover={{ bg: tabHoverBg }}>Activity</Tab>
          <Tab _hover={{ bg: tabHoverBg }}>Edit</Tab>
        </TabList>
        
        <TabPanels>
          {/* Notes Tab */}
          <TabPanel p={4}>
            <VStack spacing={4} align="start" width="100%">
              <Heading size="sm">Notes</Heading>
              
              {/* Add Note */}
              <Box width="100%">
                <Textarea 
                  placeholder="Add a note..." 
                  size="sm" 
                  resize="vertical"
                  borderRadius="md"
                />
                <Flex justifyContent="flex-end" mt={2}>
                  <Button 
                    size="sm" 
                    colorScheme="purple" 
                    leftIcon={<Plus size={14} />}
                  >
                    Add Note
                  </Button>
                </Flex>
              </Box>
              
              <Divider />
              
              {/* Notes List */}
              {notes.map((note) => (
                <Box 
                  key={note.id} 
                  p={3} 
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor={borderColor}
                  width="100%"
                >
                  <Text fontSize="sm">{note.text}</Text>
                  <Flex justifyContent="space-between" mt={2} fontSize="xs" color="gray.500">
                    <Text>{note.author}</Text>
                    <Text>{formatDate(note.date)}</Text>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </TabPanel>
          
          {/* Activity Tab */}
          <TabPanel p={4}>
            <VStack spacing={4} align="start" width="100%">
              <Heading size="sm">Activity History</Heading>
              
              {/* Activity Timeline */}
              <VStack spacing={0} align="start" width="100%">
                {activities.map((activity, index) => (
                  <Box 
                    key={activity.id} 
                    position="relative" 
                    pl={8} 
                    pb={index < activities.length - 1 ? 4 : 0}
                    width="100%"
                  >
                    {/* Timeline line */}
                    {index < activities.length - 1 && (
                      <Box 
                        position="absolute" 
                        left="16px" 
                        top="24px" 
                        bottom={0} 
                        width="1px" 
                        bg={borderColor} 
                      />
                    )}
                    
                    {/* Activity icon */}
                    <Box 
                      position="absolute" 
                      left={0} 
                      top={0}
                      width="32px" 
                      height="32px" 
                      borderRadius="full" 
                      bg={
                        activity.type === 'email' ? 'blue.100' : 
                        activity.type === 'note' ? 'green.100' : 
                        'orange.100'
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      zIndex={1}
                    >
                      {activity.type === 'email' && <Mail size={14} color="blue" />}
                      {activity.type === 'note' && <FileText size={14} color="green" />}
                      {activity.type === 'status' && <Activity size={14} color="orange" />}
                    </Box>
                    
                    {/* Activity content */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">{activity.description}</Text>
                      <Flex justifyContent="space-between" fontSize="xs" color="gray.500">
                        <Text>{activity.user}</Text>
                        <Text>{formatDate(activity.date)}</Text>
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </TabPanel>
          
          {/* Edit Tab */}
          <TabPanel p={4}>
            <VStack spacing={4} align="start" width="100%">
              <Heading size="sm">Edit Lead</Heading>
              
              <FormControl>
                <FormLabel fontSize="sm">First Name</FormLabel>
                <Input defaultValue={lead.firstName} size="sm" />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Last Name</FormLabel>
                <Input defaultValue={lead.lastName} size="sm" />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input defaultValue={lead.email} size="sm" />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Phone</FormLabel>
                <Input defaultValue={lead.phone} size="sm" />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select defaultValue={lead.status} size="sm">
                  <option value="new">New</option>
                  <option value="pending">Pending</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </Select>
              </FormControl>
              
              <Flex justifyContent="flex-end" width="100%" mt={2}>
                <Button 
                  colorScheme="purple" 
                  leftIcon={<CheckCircle size={16} />}
                  size="sm"
                >
                  Save Changes
                </Button>
              </Flex>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default LeadDetailSidebar; 