import React, { useState } from 'react';
import { DraggableWindow } from '../window/DraggableWindow';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Select,
  FormControl,
  FormLabel,
  Divider,
  useColorMode,
  useColorModeValue,
  Grid,
  GridItem,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  Image,
  Center
} from '@chakra-ui/react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { addWorkspaceMember, removeWorkspaceMember, updateWorkspace } from '../../services/workspace';
import { IntegrationSettings } from '../settings/IntegrationSettings';

export function SettingsWindow({ onClose }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const { currentWorkspace, loading, error } = useWorkspace();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('agent');
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  const toast = useToast();
  
  // Colors
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const categories = [
    'General',
    'Workspace',
    'Appearance',
    'Notifications',
    'Language',
    'Integration',
    'Privacy',
    'Advanced'
  ];

  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedProvider, setSelectedProvider] = useState('Twilio');
  const [selectedService, setSelectedService] = useState(null);

  const integrationProviders = {
    'Voice/SMS/WhatsApp': [
      { 
        name: 'Twilio',
        icon: 'https://www.vectorlogo.zone/logos/twilio/twilio-icon.svg',
        color: '#F22F46'
      },
      { 
        name: 'Telnyx',
        icon: 'https://disypm7jl5glh.cloudfront.net/svg/telnyx.svg',
        color: '#00B5B5'
      }
    ],
    'Artificial Intelligence': [
      { 
        name: 'Dialogflow',
        icon: 'https://www.vectorlogo.zone/logos/dialogflow/dialogflow-icon.svg',
        color: '#FF6B00'
      },
      { 
        name: 'OpenAI',
        icon: 'https://openai.com/favicon.ico',
        color: '#000000'
      },
      { 
        name: 'Google Gemini',
        icon: 'https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg',
        color: '#4285F4'
      },
      { 
        name: 'Claude AI',
        icon: 'https://www.anthropic.com/favicon.ico',
        color: '#000000'
      },
      { 
        name: 'X AI',
        icon: 'https://x.ai/favicon.ico',
        color: '#000000'
      },
      { 
        name: 'DeepSeek',
        icon: 'https://www.deepseek.com/favicon.ico',
        color: '#0088ff'
      },
      { 
        name: 'Coze',
        icon: 'https://coze.com/favicon.ico',
        color: '#6B46C1'
      }
    ],
    'E-Commerce': [
      { 
        name: 'Shopify',
        icon: 'https://www.vectorlogo.zone/logos/shopify/shopify-icon.svg',
        color: '#96BF48'
      },
      { 
        name: 'Facebook Business',
        icon: 'https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg',
        color: '#1877F2'
      }
    ]
  };

  const serviceTypes = {
    'Voice/SMS/WhatsApp': [
      { name: 'Voice', icon: 'https://cdn-icons-png.flaticon.com/512/126/126341.png' },
      { name: 'SMS', icon: 'https://cdn-icons-png.flaticon.com/512/126/126341.png' },
      { name: 'WhatsApp', icon: 'https://cdn-icons-png.flaticon.com/512/126/126341.png' }
    ]
  };

  const [twilioCredentials, setTwilioCredentials] = useState({
    accountSid: '',
    authToken: ''
  });

  const handleTwilioInputChange = (field) => (e) => {
    setTwilioCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const clearTwilioCredentials = () => {
    setTwilioCredentials({
      accountSid: '',
      authToken: ''
    });
  };

  const saveTwilioCredentials = () => {
    // TODO: Implement save functionality
    console.log('Saving Twilio credentials:', twilioCredentials);
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case 'General':
        return (
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="dark-mode" mb={0}>
                Dark Mode
              </FormLabel>
              <Switch
                id="dark-mode"
                isChecked={colorMode === 'dark'}
                onChange={toggleColorMode}
              />
            </FormControl>
            <Divider />
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="notifications" mb={0}>
                Enable Notifications
              </FormLabel>
              <Switch
                id="notifications"
                isChecked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            </FormControl>
            <Divider />
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="sound" mb={0}>
                Sound Effects
              </FormLabel>
              <Switch
                id="sound"
                isChecked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            </FormControl>
            <Divider />
            <FormControl>
              <FormLabel htmlFor="language">Language</FormLabel>
              <Select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </Select>
            </FormControl>
          </VStack>
        );
      case 'Integration':
        return <IntegrationSettings />;
      case 'Workspace':
        return (
          <VStack spacing={6} align="stretch">
            {/* Workspace Info */}
            <Box>
              <Text fontSize="lg" fontWeight="medium" mb={3}>Workspace Information</Text>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Workspace Name</FormLabel>
                  <Input value={currentWorkspace.name} isReadOnly />
                </FormControl>
                <FormControl>
                  <FormLabel>Created At</FormLabel>
                  <Input value={new Date(currentWorkspace.created_at).toLocaleDateString()} isReadOnly />
                </FormControl>
              </VStack>
            </Box>

            {/* Team Management */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="medium">Team Members</Text>
                <Button size="sm" colorScheme="purple" onClick={onOpen}>
                  Add Member
                </Button>
              </HStack>
              
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Last Active</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {currentWorkspace.workspace_members?.map((member) => (
                    <Tr key={member.user_id}>
                      <Td>{member.email}</Td>
                      <Td>
                        <Badge colorScheme={member.role === 'admin' ? 'purple' : 'blue'}>
                          {member.role}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={member.is_active ? 'green' : 'gray'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>{member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleUpdateMemberRole(member.user_id, member.role === 'admin' ? 'agent' : 'admin')}
                          >
                            Change Role
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.user_id)}
                          >
                            Remove
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {/* Twilio Configuration */}
            <Box>
              <Text fontSize="lg" fontWeight="medium" mb={3}>Twilio Configuration</Text>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Account SID</FormLabel>
                  <Input type="password" value="••••••••••••••••" isReadOnly />
                </FormControl>
                <FormControl>
                  <FormLabel>Auth Token</FormLabel>
                  <Input type="password" value="••••••••••••••••" isReadOnly />
                </FormControl>
                <FormControl>
                  <FormLabel>Phone Numbers</FormLabel>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Number</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentWorkspace.phone_numbers?.map((number) => (
                        <Tr key={number.id}>
                          <Td>{number.phone_number}</Td>
                          <Td>{number.type}</Td>
                          <Td>
                            <Badge colorScheme={number.active ? 'green' : 'gray'}>
                              {number.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Button size="sm" colorScheme="purple" mt={2}>
                    Add Phone Number
                  </Button>
                </FormControl>
              </VStack>
            </Box>

            {/* Analytics Overview */}
            <Box>
              <Text fontSize="lg" fontWeight="medium" mb={3}>Analytics Overview</Text>
              <SimpleGrid columns={3} spacing={4}>
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text color={mutedColor}>Total Calls</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {currentWorkspace.analytics?.total_calls || 0}
                  </Text>
                </Box>
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text color={mutedColor}>Active Agents</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {currentWorkspace.workspace_members?.filter(m => m.is_active).length || 0}
                  </Text>
                </Box>
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text color={mutedColor}>Call Success Rate</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {currentWorkspace.analytics?.success_rate || '0%'}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Danger Zone */}
            <Box mt={8} p={4} borderWidth={1} borderRadius="md" borderColor="red.500">
              <Text fontSize="lg" fontWeight="medium" color="red.500" mb={3}>
                Danger Zone
              </Text>
              <VStack spacing={4} align="stretch">
                <Button colorScheme="red" variant="outline" size="sm">
                  Archive Workspace
                </Button>
                <Button colorScheme="red" size="sm">
                  Delete Workspace
                </Button>
              </VStack>
            </Box>
          </VStack>
        );
      default:
        return (
          <Center h="100%">
            <Text>{selectedCategory} settings coming soon</Text>
          </Center>
        );
    }
  };

  if (loading) {
    return (
      <Box h="100%" bg={bg} p={6} display="flex" alignItems="center" justifyContent="center">
        <Text>Loading workspace settings...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box h="100%" bg={bg} p={6} display="flex" alignItems="center" justifyContent="center">
        <Text color="red.500">Error loading workspace settings: {error}</Text>
      </Box>
    );
  }

  if (!currentWorkspace) {
    return (
      <Box h="100%" bg={bg} p={6} display="flex" alignItems="center" justifyContent="center">
        <Text>No workspace found. Please create a workspace first.</Text>
      </Box>
    );
  }

  const handleAddMember = async () => {
    try {
      await addWorkspaceMember(currentWorkspace.id, newMemberEmail, newMemberRole);
      toast({
        title: 'Member added',
        description: `Successfully added ${newMemberEmail} as ${newMemberRole}`,
        status: 'success',
      });
      setNewMemberEmail('');
      onModalClose();
    } catch (error) {
      toast({
        title: 'Error adding member',
        description: error.message,
        status: 'error',
      });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeWorkspaceMember(currentWorkspace.id, userId);
      toast({
        title: 'Member removed',
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error removing member',
        description: error.message,
        status: 'error',
      });
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      await updateWorkspace(currentWorkspace.id, {
        workspace_members: currentWorkspace.workspace_members.map(member =>
          member.user_id === userId ? { ...member, role: newRole } : member
        )
      });
      toast({
        title: 'Member role updated',
        description: `Successfully updated member role to ${newRole}`,
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error updating member role',
        description: error.message,
        status: 'error',
      });
    }
  };

  return (
    <Box h="100%" bg={bg}>
      <Grid templateColumns="200px 1fr" h="100%">
        <GridItem borderRight="1px" borderColor={borderColor} p={4}>
          <VStack align="stretch" spacing={2}>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'solid' : 'ghost'}
                colorScheme={selectedCategory === category ? 'purple' : 'gray'}
                onClick={() => setSelectedCategory(category)}
                justifyContent="flex-start"
              >
                {category}
              </Button>
            ))}
          </VStack>
        </GridItem>

        <GridItem p={6} overflowY="auto">
          {renderContent()}
        </GridItem>
      </Grid>

      {/* Add Member Modal */}
      <Modal isOpen={isOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Team Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onModalClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleAddMember}>
              Add Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
