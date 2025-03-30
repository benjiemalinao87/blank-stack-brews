import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Link,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  Badge,
  Flex,
  Heading,
  RadioGroup,
  Radio,
  Checkbox,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Phone, MessageCircle, MessageCircleMore } from 'lucide-react';
import { useTwilio } from '../../contexts/TwilioContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabaseUnified';

export function IntegrationSettings() {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPhoneNumbers, setIsLoadingPhoneNumbers] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [webhookType, setWebhookType] = useState('workspace');
  const [isUpdatingWebhook, setIsUpdatingWebhook] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [isLoadingAvailableNumbers, setIsLoadingAvailableNumbers] = useState(false);
  const { twilioConfig, isLoading: isTwilioLoading, saveTwilioConfig, getTwilioConfig } = useTwilio();
  const { currentWorkspace } = useWorkspace();
  const toast = useToast();

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadTwilioConfig();
    }
  }, [currentWorkspace]);

  const loadTwilioConfig = async () => {
    try {
      const config = await getTwilioConfig(currentWorkspace.id);
      if (config) {
        setAccountSid(config.accountSid || '');
        setAuthToken(config.authToken || '');
        setIsConfigured(config.isConfigured || false);
        if (config.isConfigured) {
          await loadPhoneNumbers();
        }
      }
    } catch (error) {
      console.error('Error loading Twilio config:', error);
    }
  };

  const loadPhoneNumbers = async () => {
    if (!isConfigured || !currentWorkspace?.id) return;
    
    try {
      setIsLoadingPhoneNumbers(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://cc.automate8.com'}/api/twilio/phone-numbers/${currentWorkspace.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error loading phone numbers:', errorData.error);
        return;
      }

      const data = await response.json();
      if (data.numbers && data.numbers.length > 0) {
        setPhoneNumbers(data.numbers.map(number => ({
          phoneNumber: number.phone_number || number.phoneNumber,
          friendlyName: number.friendly_name || number.friendlyName || number.phone_number || number.phoneNumber,
          status: number.status || 'active'
        })));
      } else {
        setPhoneNumbers([]);
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    } finally {
      setIsLoadingPhoneNumbers(false);
    }
  };

  useEffect(() => {
    if (isConfigured && currentWorkspace?.id) {
      loadPhoneNumbers();
    }
  }, [isConfigured, currentWorkspace?.id]);

  const handleSave = async () => {
    if (!accountSid || !authToken) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter both Account SID and Auth Token',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      await saveTwilioConfig(currentWorkspace.id, {
        accountSid: accountSid.trim(),
        authToken: authToken.trim(),
      });
      
      setIsConfigured(true);
      await loadPhoneNumbers();

      toast({
        title: 'Success',
        description: 'Twilio configuration saved successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving Twilio config:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Twilio configuration',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsLoading(true);
      await supabase
        .from('workspace_twilio_config')
        .delete()
        .eq('workspace_id', currentWorkspace.id);

      setAccountSid('');
      setAuthToken('');
      setIsConfigured(false);
      setPhoneNumbers([]);

      toast({
        title: 'Success',
        description: 'Twilio configuration cleared',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error clearing Twilio config:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear Twilio configuration',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberSelect = (phoneNumber) => {
    setSelectedPhoneNumber(selectedPhoneNumber === phoneNumber ? null : phoneNumber);
  };

  const handleWebhookTypeChange = async (type) => {
    if (!selectedPhoneNumber) {
      toast({
        title: 'Select a Phone Number',
        description: 'Please select a phone number to configure webhook',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsUpdatingWebhook(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://cc.automate8.com'}/api/twilio/configure-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          webhookType: type,
          phoneNumbers: [selectedPhoneNumber]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update webhook configuration');
      }

      const data = await response.json();
      setWebhookType(type);
      
      toast({
        title: 'Webhook Updated',
        description: data.message || `Successfully configured ${type} webhook`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update webhook configuration',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingWebhook(false);
    }
  };

  const loadAvailableNumbers = async () => {
    try {
      setIsLoadingAvailableNumbers(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://cc.automate8.com'}/api/twilio/available-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load available numbers');
      }

      const data = await response.json();
      
      if (!data.numbers || data.numbers.length === 0) {
        toast({
          title: 'No Numbers Available',
          description: 'No available phone numbers found in your region. Please try again later.',
          status: 'warning',
          duration: 5000,
        });
        return;
      }
      
      setAvailableNumbers(data.numbers);
      setIsAddingPhone(true);
    } catch (error) {
      console.error('Error loading available numbers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load available phone numbers',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoadingAvailableNumbers(false);
    }
  };

  const handleAddNumber = async () => {
    if (!selectedNumber) {
      toast({
        title: 'Error',
        description: 'Please select a phone number',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://cc.automate8.com'}/api/twilio/purchase-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          phoneNumber: selectedNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase number');
      }

      setIsAddingPhone(false);
      setSelectedNumber('');
      await loadPhoneNumbers();
      
      toast({
        title: 'Success',
        description: 'Phone number purchased successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error purchasing number:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to purchase phone number',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Accordion defaultIndex={[0]} allowToggle>
        <AccordionItem border="none">
          <AccordionButton 
            _hover={{ bg: 'gray.50' }}
            px={4}
            py={2}
          >
            <Text flex="1" textAlign="left">Voice/SMS/WhatsApp</Text>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <VStack spacing={6} align="stretch">
              {/* Capability Icons */}
              <HStack spacing={4}>
                <HStack 
                  p={2} 
                  bg="gray.50" 
                  borderRadius="md"
                  spacing={2}
                >
                  <Phone size={20} />
                  <Text>Voice</Text>
                </HStack>
                <HStack 
                  p={2} 
                  bg="gray.50" 
                  borderRadius="md"
                  spacing={2}
                >
                  <MessageCircle size={20} />
                  <Text>SMS</Text>
                </HStack>
                <HStack 
                  p={2} 
                  bg="gray.50" 
                  borderRadius="md"
                  spacing={2}
                >
                  <MessageCircleMore size={20} />
                  <Text>WhatsApp</Text>
                </HStack>
              </HStack>

              {/* Twilio Sign Up Link */}
              <Text fontSize="sm">
                Sign up{' '}
                <Link 
                  color="blue.500" 
                  href="https://www.twilio.com/try-twilio" 
                  isExternal
                >
                  for a Twilio account
                </Link>
              </Text>

              {/* Twilio Configuration Form */}
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text mb={2}>Account SID</Text>
                  <Input 
                    placeholder="Enter your Account SID"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text mb={2}>Auth Token</Text>
                  <Input 
                    type="password"
                    placeholder="Enter your Auth Token"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                  />
                </Box>

                <HStack spacing={4} justify="flex-start">
                  <Button 
                    colorScheme="blue"
                    onClick={handleSave}
                    isLoading={isLoading}
                    loadingText="Saving..."
                  >
                    Save
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={handleClear}
                    isDisabled={isLoading}
                  >
                    Clear
                  </Button>
                </HStack>
              </VStack>

              {isConfigured && (
                <Alert status="success" mt={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Twilio Connected</AlertTitle>
                    <AlertDescription>
                      Your Twilio integration is configured and ready to use
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {isConfigured && (
                <Box mt={4}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Phone Numbers</Heading>
                    <HStack spacing={4}>
                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={loadAvailableNumbers}
                        isLoading={isLoadingAvailableNumbers}
                        loadingText="Loading numbers..."
                      >
                        Buy Phone Number
                      </Button>
                    </HStack>
                  </Flex>

                  {/* Webhook Configuration */}
                  <Box mb={6}>
                    <Heading size="md" mb={4}>Webhook Configuration</Heading>
                    <Text fontSize="sm" color="gray.600" mb={4}>
                      {selectedPhoneNumber 
                        ? "Configure webhook for selected phone number"
                        : "Select a phone number to configure webhook"
                      }
                    </Text>
                    <RadioGroup 
                      value={webhookType} 
                      onChange={(value) => {
                        setWebhookType(value);
                      }}
                    >
                      <VStack align="start" spacing={4}>
                        <Radio value="global">
                          <Box>
                            <Text fontWeight="medium">Global Webhook</Text>
                            <Text fontSize="sm" color="gray.600">
                              Use a single webhook URL for all workspaces
                            </Text>
                          </Box>
                        </Radio>
                        <Radio value="workspace">
                          <Box>
                            <Text fontWeight="medium">Workspace-Specific Webhook</Text>
                            <Text fontSize="sm" color="gray.600">
                              Use separate webhook URLs for each workspace
                            </Text>
                          </Box>
                        </Radio>
                      </VStack>
                    </RadioGroup>

                    <Button
                      mt={4}
                      colorScheme="blue"
                      isLoading={isUpdatingWebhook}
                      onClick={() => handleWebhookTypeChange(webhookType)}
                      isDisabled={!selectedPhoneNumber}
                    >
                      Configure Webhook
                    </Button>
                  </Box>

                  {/* Phone Numbers List */}
                  {isLoadingPhoneNumbers ? (
                    <Center py={4}>
                      <Spinner size="sm" mr={2} />
                      <Text>Loading phone numbers...</Text>
                    </Center>
                  ) : phoneNumbers.length > 0 ? (
                    <VStack align="stretch" spacing={3}>
                      {phoneNumbers.map((number) => (
                        <Box
                          key={number.phoneNumber}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          bg={selectedPhoneNumber === number.phoneNumber ? 'blue.50' : 'white'}
                          cursor="pointer"
                          onClick={() => handlePhoneNumberSelect(number.phoneNumber)}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex justify="space-between" align="center">
                            <HStack spacing={4} flex={1}>
                              <Checkbox
                                isChecked={selectedPhoneNumber === number.phoneNumber}
                                onChange={() => handlePhoneNumberSelect(number.phoneNumber)}
                                colorScheme="blue"
                              />
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{number.phoneNumber}</Text>
                                {number.friendlyName !== number.phoneNumber && (
                                  <Text fontSize="sm" color="gray.600">
                                    {number.friendlyName}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                            <Badge colorScheme="green">{number.status?.toUpperCase() || 'ACTIVE'}</Badge>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.500">No phone numbers found</Text>
                  )}
                </Box>
              )}
            </VStack>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem border="none">
          <AccordionButton 
            _hover={{ bg: 'gray.50' }}
            px={4}
            py={2}
          >
            <Text flex="1" textAlign="left">Artificial Intelligence</Text>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            {/* AI Settings Content */}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem border="none">
          <AccordionButton 
            _hover={{ bg: 'gray.50' }}
            px={4}
            py={2}
          >
            <Text flex="1" textAlign="left">E-Commerce</Text>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            {/* E-Commerce Settings Content */}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Add Phone Number Modal */}
      <Modal isOpen={isAddingPhone} onClose={() => setIsAddingPhone(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Buy Phone Number</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Select Phone Number</FormLabel>
                {availableNumbers.length > 0 ? (
                  <Select
                    placeholder="Choose a number"
                    value={selectedNumber}
                    onChange={(e) => setSelectedNumber(e.target.value)}
                  >
                    {availableNumbers.map((number) => (
                      <option key={number.phoneNumber} value={number.phoneNumber}>
                        {number.friendlyName || number.phoneNumber} 
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Text color="gray.500">Loading available numbers...</Text>
                )}
              </FormControl>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Note: Purchasing a phone number will incur charges on your Twilio account.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsAddingPhone(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAddNumber}
              isLoading={isLoading}
              loadingText="Purchasing..."
              isDisabled={!selectedNumber || isLoading}
            >
              Purchase Number
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
