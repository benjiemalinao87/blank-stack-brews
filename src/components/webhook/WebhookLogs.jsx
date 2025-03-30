import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Code,
  Badge,
  Collapse,
  IconButton,
  HStack,
  useColorModeValue,
  Button,
  Flex,
  Divider,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const WebhookLogs = ({ webhook, onBack }) => {
  const [logs, setLogs] = useState([]);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (webhook?.id) {
      fetchLogs();
    }
  }, [webhook?.id]);

  const fetchLogs = async () => {
    try {
      console.log('Fetching logs for webhook:', webhook.id);
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhook.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      console.log('Fetched logs:', data);
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLog = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <Text>Loading logs...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={2} align="stretch">
      {logs.map(log => (
        <Box
          key={log.id}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          overflow="hidden"
        >
          <HStack
            p={3}
            bg={bgColor}
            justify="space-between"
            cursor="pointer"
            onClick={() => toggleLog(log.id)}
          >
            <HStack spacing={4}>
              <Text>{formatDate(log.timestamp)}</Text>
              <Badge colorScheme={log.status === 'success' ? 'green' : 'red'}>
                {log.status}
              </Badge>
            </HStack>
            <IconButton
              icon={expandedLogs[log.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
              variant="ghost"
              size="sm"
              aria-label={expandedLogs[log.id] ? 'Collapse' : 'Expand'}
            />
          </HStack>

          <Collapse in={expandedLogs[log.id]}>
            <Box p={4} bg="white">
              <Code
                display="block"
                whiteSpace="pre-wrap"
                p={3}
                borderRadius="md"
                fontSize="sm"
                width="100%"
              >
                {JSON.stringify(log.payload, null, 2)}
              </Code>
            </Box>
          </Collapse>
        </Box>
      ))}

      {logs.length === 0 && (
        <Box p={4} textAlign="center">
          <Text color="gray.500">No logs found</Text>
        </Box>
      )}
    </VStack>
  );
};

export default WebhookLogs;
