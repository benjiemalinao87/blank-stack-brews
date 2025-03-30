import React, { useState, useCallback, useEffect } from 'react';
import { Box, VStack, Text, Badge, IconButton, HStack, Spinner } from '@chakra-ui/react';
import { useToast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { DeleteIcon } from '@chakra-ui/icons';

const AudienceSegments = ({ workspaceId, boardId }) => {
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const toast = useToast();

  const fetchSegments = useCallback(async () => {
    try {
      console.log('Segment Debug - Fetching segments for:', { workspaceId, boardId });
      
      const { data, error } = await supabase
        .from('audience_segments')
        .select(`
          id,
          name,
          workspace_id,
          board_id,
          contact_count,
          filters,
          created_at,
          updated_at,
          is_active,
          processing_status,
          total_contacts
        `)
        .eq('workspace_id', workspaceId)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      console.log('Segment Debug - Fetch result:', {
        hasData: !!data,
        segmentCount: data?.length,
        segments: data?.map(s => ({
          id: s.id,
          name: s.name,
          contact_count: s.contact_count,
          total_contacts: s.total_contacts,
          processing_status: s.processing_status,
          filters: s.filters
        }))
      });

      if (error) throw error;
      setSegments(data || []);
    } catch (error) {
      console.error('Segment Debug - Error:', error);
      toast({
        title: 'Error loading segments',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, boardId, toast]);

  // Poll for updates to processing segments
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const hasProcessingSegments = segments.some(s => s.processing_status === 'pending' || s.processing_status === 'processing');
      if (hasProcessingSegments) {
        console.log('Segment Debug - Polling segments due to processing status');
        fetchSegments();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [segments, fetchSegments]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green.500';
      case 'processing':
        return 'blue.500';
      case 'failed':
        return 'red.500';
      default:
        return 'gray.500';
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {isLoading ? (
          <Spinner />
        ) : segments.length === 0 ? (
          <Text>No segments found</Text>
        ) : (
          segments.map((segment) => (
            <Box
              key={segment.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              cursor="pointer"
              onClick={() => setSelectedSegment(segment)}
              _hover={{ bg: 'gray.50' }}
            >
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{segment.name}</Text>
                  <HStack spacing={2}>
                    <Badge colorScheme={getStatusColor(segment.processing_status)}>
                      {segment.processing_status}
                    </Badge>
                    <Text fontSize="sm" color="gray.600">
                      {segment.contact_count || 0} contacts
                    </Text>
                  </HStack>
                </VStack>
                <IconButton
                  icon={<DeleteIcon />}
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSegment(segment.id);
                  }}
                />
              </HStack>
            </Box>
          ))
        )}
      </VStack>

      {/* Delete confirmation modal */}
      {/* ... existing modal code ... */}
    </Box>
  );
};

export default AudienceSegments; 