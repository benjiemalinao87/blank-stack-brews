import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Spinner,
  useColorModeValue,
  Code,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Tag, Clock } from 'react-feather';
import { format } from 'date-fns';
import ContactActivitiesService from '../../../services/ContactActivitiesService';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const ActivityHistory = ({ contactId }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const { currentWorkspace } = useWorkspace();

  // Mac OS inspired color mode values
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const spinnerColor = useColorModeValue('gray.400', 'gray.500');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const errorBg = useColorModeValue('red.50', 'red.900');

  useEffect(() => {
    const fetchStatusHistory = async () => {
      if (!contactId || !currentWorkspace?.id) {
        console.log('Missing required data:', { contactId, workspaceId: currentWorkspace?.id });
        setError('Missing contact or workspace information');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setErrorDetails(null);

      try {
        console.log('Fetching status history with:', {
          contactId,
          workspaceId: currentWorkspace.id
        });

        const { data, error, details } = await ContactActivitiesService.getStatusHistory(
          contactId,
          currentWorkspace.id
        );

        if (error) {
          console.error('Error fetching status history:', { error, details });
          setError(error);
          setErrorDetails(details);
          return;
        }

        if (!data || !Array.isArray(data)) {
          console.error('Invalid data format:', data);
          setError('Received invalid data format');
          setErrorDetails({ received: typeof data });
          return;
        }

        console.log('Status history loaded:', {
          count: data.length,
          workspaceId: currentWorkspace.id
        });

        setActivities(data);
      } catch (err) {
        console.error('Error in fetchStatusHistory:', err);
        setError(err.message || 'An unexpected error occurred');
        setErrorDetails({
          error: err.message,
          contactId,
          workspaceId: currentWorkspace.id
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatusHistory();
  }, [contactId, currentWorkspace?.id]);

  if (isLoading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner size="sm" color={spinnerColor} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="subtle" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontSize="sm" fontWeight="medium">
            {error}
          </Text>
          {errorDetails && (
            <Code fontSize="xs" mt={2} p={2} borderRadius="md" whiteSpace="pre-wrap">
              {JSON.stringify(errorDetails, null, 2)}
            </Code>
          )}
        </Box>
      </Alert>
    );
  }

  if (!activities.length) {
    return (
      <Text color={mutedTextColor} fontSize="sm" textAlign="center" py={4}>
        No status changes recorded
      </Text>
    );
  }

  return (
    <VStack spacing={2} align="stretch">
      {activities.map((activity) => (
        <Box
          key={activity.id}
          py={2}
          px={3}
          _hover={{ bg: hoverBg }}
          borderRadius="md"
          transition="background 0.2s"
        >
          <HStack spacing={3} align="flex-start">
            <Icon 
              as={Tag} 
              color={activity.status_options?.color || mutedTextColor}
              boxSize={4}
              mt={1}
            />
            <Box flex={1}>
              <Text fontSize="sm" color={textColor}>
                {activity.metadata?.old_status_name 
                  ? `Changed from ${activity.metadata.old_status_name} to ${activity.metadata.new_status_name}`
                  : `Status set to ${activity.metadata?.new_status_name || activity.status_options?.name || 'Unknown'}`}
                {activity.created_by && (
                  <Text as="span" color={mutedTextColor}>
                    {' '}by {activity.created_by.full_name || activity.created_by.email || 'Unknown User'}
                  </Text>
                )}
              </Text>
              <HStack spacing={2} mt={1}>
                <Icon 
                  as={Clock} 
                  color={mutedTextColor}
                  boxSize={3}
                />
                <Text fontSize="xs" color={mutedTextColor}>
                  {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                </Text>
              </HStack>
            </Box>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};

export default ActivityHistory;
