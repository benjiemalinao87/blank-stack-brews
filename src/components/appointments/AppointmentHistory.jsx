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
  useToast,
  Button,
  Icon
} from '@chakra-ui/react';
import { CalendarIcon, InfoIcon } from '@chakra-ui/icons';
import appointmentService from '../../services/appointmentService';

const AppointmentHistory = ({ contactId, workspaceId }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [resultOptions, setResultOptions] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data: statusData, error: statusError } = await appointmentService.getAppointmentStatusOptions();
        if (statusError) throw statusError;
        setStatusOptions(statusData || []);

        const { data: resultData, error: resultError } = await appointmentService.getAppointmentResultOptions();
        if (resultError) throw resultError;
        setResultOptions(resultData || []);
      } catch (err) {
        console.error('Error fetching options:', err);
        toast({
          title: 'Error fetching status options',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchOptions();
  }, [toast]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await appointmentService.getAppointmentsForContact(contactId, workspaceId);
        
        if (error) throw error;
        
        setAppointments(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err.message);
        toast({
          title: 'Error fetching appointments',
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
      fetchAppointments();
    }
  }, [contactId, workspaceId, toast]);

  const getStatusName = (statusId) => {
    const status = statusOptions.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  };

  const getStatusColor = (statusId) => {
    const status = statusOptions.find(s => s.id === statusId);
    return status ? status.color : null;
  };

  const getResultName = (resultId) => {
    const result = resultOptions.find(r => r.id === resultId);
    return result ? result.name : 'Unknown';
  };

  const getResultColor = (resultId) => {
    const result = resultOptions.find(r => r.id === resultId);
    return result ? result.color : null;
  };

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

  const getColorScheme = (color) => {
    if (!color) return 'gray';
    
    const colorMap = {
      '#4285F4': 'blue',
      '#34A853': 'green',
      '#FBBC05': 'yellow',
      '#EA4335': 'red',
      // Add more color mappings as needed
    };
    
    return colorMap[color] || 'gray';
  };

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading appointments...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="red.500">
        <Icon as={InfoIcon} boxSize={10} />
        <Text mt={4} fontSize="lg">Error loading appointments</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (appointments.length === 0) {
    return (
      <Box p={6} textAlign="center" color="gray.500">
        <Icon as={CalendarIcon} boxSize={10} />
        <Text mt={4} fontSize="lg">No appointments found</Text>
        <Text mb={4}>There are no appointments scheduled with this contact.</Text>
        <Button colorScheme="blue" size="sm">Schedule Appointment</Button>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Date & Time</Th>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Result</Th>
            <Th>Created By</Th>
          </Tr>
        </Thead>
        <Tbody>
          {appointments.map(appointment => (
            <Tr key={appointment.id}>
              <Td>
                <Flex direction="column">
                  <Text fontWeight="medium">{formatDate(appointment.appointment_date)}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {appointment.duration_minutes} mins
                  </Text>
                </Flex>
              </Td>
              <Td>{appointment.title || 'N/A'}</Td>
              <Td>
                {appointment.status_id ? (
                  <Badge colorScheme={getColorScheme(getStatusColor(appointment.status_id))}>
                    {getStatusName(appointment.status_id)}
                  </Badge>
                ) : 'N/A'}
              </Td>
              <Td>
                {appointment.result_id ? (
                  <Badge colorScheme={getColorScheme(getResultColor(appointment.result_id))}>
                    {getResultName(appointment.result_id)}
                  </Badge>
                ) : 'N/A'}
              </Td>
              <Td>System</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AppointmentHistory;
