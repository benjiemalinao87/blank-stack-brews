import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Flex,
  Spinner,
  Badge,
  Checkbox,
  useToast,
  Button,
  Icon
} from '@chakra-ui/react';
import { CalendarIcon, InfoIcon } from '@chakra-ui/icons';
import appointmentService from '../../services/appointmentService';

const AppointmentFollowUps = ({ contactId, workspaceId }) => {
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await appointmentService.getFollowUpsForContact(contactId, workspaceId);
        
        if (error) throw error;
        
        setFollowUps(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching follow-ups:', err);
        setError(err.message);
        toast({
          title: 'Error fetching follow-up tasks',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (contactId && workspaceId) {
      fetchFollowUps();
    }
  }, [contactId, workspaceId, toast]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleComplete = async (followUp) => {
    try {
      const updateData = {
        is_completed: !followUp.is_completed,
        completed_at: !followUp.is_completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await appointmentService.updateAppointmentFollowUp(followUp.id, updateData);
      
      if (error) throw error;
      
      // Update local state
      setFollowUps(followUps.map(item => 
        item.id === followUp.id ? { ...item, ...updateData } : item
      ));
      
      toast({
        title: followUp.is_completed ? 'Task marked as incomplete' : 'Task marked as complete',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error updating follow-up:', err);
      toast({
        title: 'Error updating follow-up',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading follow-up tasks...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="red.500">
        <Icon as={InfoIcon} boxSize={10} />
        <Text mt={4} fontSize="lg">Error loading follow-up tasks</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (followUps.length === 0) {
    return (
      <Box p={6} textAlign="center" color="gray.500">
        <Icon as={CalendarIcon} boxSize={10} />
        <Text mt={4} fontSize="lg">No follow-up tasks found</Text>
        <Text mb={4}>There are no follow-up tasks for this contact.</Text>
        <Button colorScheme="blue" size="sm">Create Follow-up Task</Button>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th width="50px">Done</Th>
            <Th>Due Date</Th>
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>Appointment</Th>
          </Tr>
        </Thead>
        <Tbody>
          {followUps.map(followUp => (
            <Tr key={followUp.id} opacity={followUp.is_completed ? 0.6 : 1}>
              <Td>
                <Checkbox 
                  isChecked={followUp.is_completed}
                  onChange={() => handleToggleComplete(followUp)}
                  colorScheme="green"
                />
              </Td>
              <Td>
                <Text 
                  fontWeight={!followUp.is_completed && new Date(followUp.due_date) < new Date() ? "bold" : "normal"}
                  color={!followUp.is_completed && new Date(followUp.due_date) < new Date() ? "red.500" : "inherit"}
                >
                  {formatDate(followUp.due_date)}
                </Text>
              </Td>
              <Td>
                <Badge colorScheme={followUp.action_type === 'Call' ? 'blue' : 'purple'}>
                  {followUp.action_type}
                </Badge>
              </Td>
              <Td>{followUp.description}</Td>
              <Td>{followUp.appointments?.title || 'N/A'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AppointmentFollowUps;
