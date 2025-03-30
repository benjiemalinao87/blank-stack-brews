import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  useToast,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  Badge,
  useColorModeValue,
  Flex,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Spinner,
  Center,
  Select,
  FormHelperText,
  Alert,
  AlertIcon,
  Switch,
  Divider
} from '@chakra-ui/react';
import { supabase } from '../../../services/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import ActivityLog from '../ActivityLog';
import WebhookPanel from '../../webhook/WebhookPanel';

const PhoneNumbersPanel = ({ selectedNumber, setSelectedNumber, availableNumbers, isLoading, assignedNumbers, board }) => {
  const formatPhoneNumber = (phone) => {
    // Format E.164 to (XXX) XXX-XXXX for US numbers
    const match = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  }

  if (!availableNumbers?.length) {
    return (
      <Center py={8}>
        <Text color="gray.500">No phone numbers available. Please configure Twilio integration first.</Text>
      </Center>
    );
  }

  return (
    <FormControl>
      <FormLabel fontSize="sm" mb={2}>Select a phone number for board communications</FormLabel>
      <RadioGroup onChange={setSelectedNumber} value={selectedNumber}>
        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          {availableNumbers.map((num) => {
            const isAssigned = assignedNumbers[num.phone_number] && assignedNumbers[num.phone_number].id !== board?.id;
            const assignedToBoard = isAssigned ? assignedNumbers[num.phone_number].name : null;
            
            return (
              <GridItem key={num.id}>
                <Box
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  opacity={isAssigned ? 0.6 : 1}
                  borderColor={selectedNumber === num.phone_number ? 'purple.500' : 'gray.200'}
                  _hover={{ borderColor: isAssigned ? 'red.500' : 'purple.500', shadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <Radio 
                    value={num.phone_number} 
                    w="100%" 
                    isDisabled={isAssigned}
                  >
                    <Flex direction="column" w="100%" ml={2}>
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="sm" fontWeight="medium">{formatPhoneNumber(num.phone_number)}</Text>
                        <Badge
                          colorScheme={isAssigned ? "red" : "green"}
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                        >
                          {isAssigned ? 'IN USE' : 'AVAILABLE'}
                        </Badge>
                      </HStack>
                      {isAssigned && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          In use by: {assignedToBoard}
                        </Text>
                      )}
                    </Flex>
                  </Radio>
                </Box>
              </GridItem>
            );
          })}
        </Grid>
      </RadioGroup>
    </FormControl>
  );
};

const ConfigureBoard = ({ board, onUpdateBoard }) => {
  const { workspace, setWorkspace } = useWorkspace();
  const [selectedNumber, setSelectedNumber] = useState(board?.phone_number || '');
  const [isLoading, setIsLoading] = useState(true);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [assignedNumbers, setAssignedNumbers] = useState({});
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  useEffect(() => {
    if (board?.workspace_id) {
      loadPhoneNumbers();
    }
  }, [board]);

  const loadPhoneNumbers = async () => {
    try {
      setIsLoading(true);

      // First check if Twilio is configured for this workspace
      const { data: twilioConfig, error: configError } = await supabase
        .from('workspace_twilio_config')
        .select('is_configured')
        .eq('workspace_id', board.workspace_id)
        .single();

      if (configError) throw configError;

      if (!twilioConfig?.is_configured) {
        toast({
          title: 'Twilio Not Configured',
          description: 'Please configure Twilio integration for your workspace first.',
          status: 'warning',
          duration: 5000,
        });
        return;
      }

      // Fetch available phone numbers for this workspace
      const { data: numbers, error: numbersError } = await supabase
        .from('twilio_numbers')
        .select('id, phone_number, friendly_name, status')
        .eq('workspace_id', board.workspace_id)
        .eq('status', 'active');

      if (numbersError) throw numbersError;

      // Fetch all boards in this workspace to check number assignments
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('id, name, phone_number')
        .eq('workspace_id', board.workspace_id)
        .not('id', 'eq', board.id);

      if (boardsError) throw boardsError;

      // Create map of assigned numbers
      const assignments = {};
      boards?.forEach(b => {
        if (b.phone_number) {
          assignments[b.phone_number] = {
            id: b.id,
            name: b.name
          };
        }
      });

      if (!numbers?.length) {
        toast({
          title: 'No Phone Numbers Available',
          description: 'No active phone numbers found for your workspace.',
          status: 'info',
          duration: 5000,
        });
      }

      setAvailableNumbers(numbers || []);
      setAssignedNumbers(assignments);
      
      if (board?.phone_number) {
        setSelectedNumber(board.phone_number);
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      toast({
        title: 'Error loading phone numbers',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberUpdate = async () => {
    if (!board?.id) return;
    
    try {
      // Create updated board object
      const updatedBoard = {
        ...board,
        phone_number: selectedNumber
      };
      
      // Call the update function passed from the parent
      await onUpdateBoard(updatedBoard);
      
      toast({
        title: 'Phone number updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast({
        title: 'Error updating phone number',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteBoard = async () => {
    if (!board?.id) return;
    
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', board.id);

      if (error) throw error;

      toast({
        title: 'Board deleted',
        description: 'The board has been successfully deleted',
        status: 'success',
        duration: 3000,
      });

      // Redirect or handle post-deletion
      window.location.href = '/boards';
    } catch (error) {
      console.error('Error deleting board:', error);
      toast({
        title: 'Error deleting board',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
    onClose();
  };

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>Phone Numbers</Tab>
          <Tab>Notifications</Tab>
          <Tab>Inbound Webhook</Tab>
          <Tab>Pipeline Config</Tab>
          <Tab>Team</Tab>
          <Tab>Integrations</Tab>
          <Tab>Activity Log</Tab>
          <Tab color="red.500">Danger zone</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <PhoneNumbersPanel
              selectedNumber={selectedNumber}
              setSelectedNumber={setSelectedNumber}
              availableNumbers={availableNumbers}
              isLoading={isLoading}
              assignedNumbers={assignedNumbers}
              board={board}
            />
            <Button
              mt={4}
              colorScheme="purple"
              onClick={handlePhoneNumberUpdate}
              isDisabled={selectedNumber === board?.phone_number}
            >
              Save Changes
            </Button>
          </TabPanel>

          <TabPanel>
            <Text>Notifications settings coming soon</Text>
          </TabPanel>

          <TabPanel>
            <WebhookPanel board={board} />
          </TabPanel>

          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>Pipeline Configuration</Heading>
              <Text mb={4}>Configure which pipeline statuses are visible to users in the contact detail view.</Text>
              
              <VStack spacing={4} align="stretch" mb={6}>
                <Box>
                  <Heading size="sm" mb={2}>Lead Status Pipeline</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    This is the main pipeline and cannot be disabled.
                  </Text>
                  <Badge colorScheme="green">Always Visible</Badge>
                </Box>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={2}>Appointment Status Pipeline</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Controls visibility of the Appointment Status pipeline in the contact detail view.
                  </Text>
                  <Switch 
                    id="show-appointment-status"
                    size="lg"
                    colorScheme="blue"
                    defaultChecked={board?.show_appointment_status !== false}
                    onChange={(e) => {
                      const updatedBoard = {
                        ...board,
                        show_appointment_status: e.target.checked
                      };
                      onUpdateBoard(updatedBoard);
                    }}
                  />
                  <FormLabel htmlFor="show-appointment-status" ml={2} mb={0}>
                    {board?.show_appointment_status !== false ? 'Visible' : 'Hidden'}
                  </FormLabel>
                </Box>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={2}>Appointment Result Pipeline</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Controls visibility of the Appointment Result pipeline in the contact detail view.
                  </Text>
                  <Switch 
                    id="show-appointment-result"
                    size="lg"
                    colorScheme="blue"
                    defaultChecked={board?.show_appointment_result !== false}
                    onChange={(e) => {
                      const updatedBoard = {
                        ...board,
                        show_appointment_result: e.target.checked
                      };
                      onUpdateBoard(updatedBoard);
                    }}
                  />
                  <FormLabel htmlFor="show-appointment-result" ml={2} mb={0}>
                    {board?.show_appointment_result !== false ? 'Visible' : 'Hidden'}
                  </FormLabel>
                </Box>
              </VStack>
              
              <Text fontSize="sm" color="gray.500" fontStyle="italic">
                Note: Changes to pipeline visibility will apply to all users viewing this board.
              </Text>
            </Box>
          </TabPanel>

          <TabPanel>
            <Text>Team settings coming soon</Text>
          </TabPanel>

          <TabPanel>
            <Text>Integrations settings coming soon</Text>
          </TabPanel>

          <TabPanel>
            <ActivityLog boardId={board.id} workspaceId={workspace?.id} viewMode="board" />
          </TabPanel>

          <TabPanel>
            <Box borderWidth="1px" borderRadius="md" p={4} bg="red.50">
              <Heading size="sm" color="red.500" mb={2}>Delete Board</Heading>
              <Text mb={4}>Once you delete a board, there is no going back. Please be certain.</Text>
              <Button colorScheme="red" onClick={onOpen}>
                Delete Board
              </Button>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Board
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this board? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteBoard} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ConfigureBoard;
