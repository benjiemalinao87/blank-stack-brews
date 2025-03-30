import React from 'react';
import { 
  Box, 
  Button, 
  VStack, 
  Heading, 
  Text,
  useColorModeValue,
  HStack,
  Divider
} from '@chakra-ui/react';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { 
  createInfoNotification,
  createSuccessNotification,
  createWarningNotification,
  createErrorNotification,
  createSystemNotification,
  createChatNotification,
  createContactNotification,
  createAppointmentNotification
} from './notificationUtils';

const NotificationDemo = () => {
  const { addNotification } = useNotification();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  const addInfoNotification = () => {
    addNotification(createInfoNotification({
      title: 'Information',
      message: 'This is an informational notification.',
    }));
  };
  
  const addSuccessNotification = () => {
    addNotification(createSuccessNotification({
      title: 'Success',
      message: 'Operation completed successfully!',
    }));
  };
  
  const addWarningNotification = () => {
    addNotification(createWarningNotification({
      title: 'Warning',
      message: 'This action might have consequences.',
    }));
  };
  
  const addErrorNotification = () => {
    addNotification(createErrorNotification({
      title: 'Error',
      message: 'Something went wrong. Please try again.',
    }));
  };
  
  const addSystemNotification = () => {
    addNotification(createSystemNotification({
      title: 'System Update',
      message: 'The system will be updated in 5 minutes.',
      type: 'info',
    }));
  };
  
  const addChatNotification = () => {
    addNotification(createChatNotification({
      title: 'New Message',
      message: 'You have received a new message from John Doe.',
      type: 'info',
      onClick: () => console.log('Chat notification clicked'),
    }));
  };
  
  const addContactNotification = () => {
    addNotification(createContactNotification({
      title: 'Contact Added',
      message: 'Jane Smith has been added to your contacts.',
      type: 'success',
    }));
  };
  
  const addAppointmentNotification = () => {
    addNotification(createAppointmentNotification({
      title: 'Upcoming Appointment',
      message: 'You have a meeting with Client XYZ in 30 minutes.',
      type: 'warning',
    }));
  };
  
  return (
    <Box 
      p={5} 
      borderRadius="md" 
      boxShadow="md" 
      bg={bgColor}
      maxWidth="600px"
      mx="auto"
    >
      <Heading size="md" mb={4}>Notification Center Demo</Heading>
      <Text mb={4}>
        Click the buttons below to add different types of notifications to the notification center.
      </Text>
      
      <Divider my={4} />
      
      <Heading size="sm" mb={3}>Notification Types</Heading>
      <HStack spacing={3} mb={5} wrap="wrap">
        <Button colorScheme="blue" onClick={addInfoNotification}>Info</Button>
        <Button colorScheme="green" onClick={addSuccessNotification}>Success</Button>
        <Button colorScheme="yellow" onClick={addWarningNotification}>Warning</Button>
        <Button colorScheme="red" onClick={addErrorNotification}>Error</Button>
      </HStack>
      
      <Heading size="sm" mb={3}>Notification Sources</Heading>
      <HStack spacing={3} wrap="wrap">
        <Button onClick={addSystemNotification}>System</Button>
        <Button onClick={addChatNotification}>Chat</Button>
        <Button onClick={addContactNotification}>Contact</Button>
        <Button onClick={addAppointmentNotification}>Appointment</Button>
      </HStack>
    </Box>
  );
};

export default NotificationDemo; 