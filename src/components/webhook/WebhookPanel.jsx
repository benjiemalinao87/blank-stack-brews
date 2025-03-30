import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseUnified';
import {
  Box,
  Button,
  Text,
  Input,
  useToast,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  HStack,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  IconButton,
  Flex,
  Spacer,
  Tooltip,
  VStack,
  useClipboard,
  useColorMode
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, CopyIcon, DeleteIcon, CheckIcon } from '@chakra-ui/icons';
import { VscSave, VscSync } from 'react-icons/vsc';
import WebhookLogs from './WebhookLogs';
import FieldMapping from './FieldMapping';
import SimulationTool from './SimulationTool';
import JsonPathFinder from './JsonPathFinder';

const WebhookPanel = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isValidJson, setIsValidJson] = useState(false);
  const [mappings, setMappings] = useState({});
  const [name, setName] = useState('');
  const [samplePayload, setSamplePayload] = useState({});
  const [isLoadingPayload, setIsLoadingPayload] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const toast = useToast();
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWebhooks();
    }
  }, [currentWorkspace?.id]);

  const fetchWebhooks = async () => {
    try {
      const { data: webhooksData, error: webhooksError } = await supabase
        .from('webhooks')
        .select('*, field_mappings(*)')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (webhooksError) throw webhooksError;

      const webhooksWithUrls = webhooksData.map(webhook => {
        // Extract field_mappings data
        const fieldMappings = webhook.field_mappings?.[0] || {};
        const mappingsData = fieldMappings.mappings || {};
        
        // Log the data structure for debugging
        console.log('Field Mappings Data:', {
          fieldMappings,
          mappingsData
        });
        
        return {
          ...webhook,
          webhookUrl: `${process.env.REACT_APP_API_URL}/webhooks/${webhook.id}`,
          webhookNote: `Note: Include 'x-workspace-id: ${currentWorkspace.id}' in request headers`,
          mappings: mappingsData.field_mappings || {},
          samplePayload: mappingsData.sample_payload || {}
        };
      });

      setWebhooks(webhooksWithUrls || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: 'Error fetching webhooks',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMappings = async (webhook, { mappings }) => {
    try {
      setIsLoading(true);
      
      // First, get the current field mappings to preserve the sample_payload
      const { data: currentMappings, error: getError } = await supabase
        .from('field_mappings')
        .select('mappings')
        .eq('webhook_id', webhook.id)
        .maybeSingle();
      
      // Prepare the mappings object with field_mappings and sample_payload
      const updatedMappings = {
        field_mappings: mappings,
        sample_payload: currentMappings?.mappings?.sample_payload || {}
      };
      
      // Update or insert the field mappings
      const { data, error } = await supabase
        .from('field_mappings')
        .upsert({
          webhook_id: webhook.id,
          workspace_id: currentWorkspace.id,
          mappings: updatedMappings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'webhook_id'
        })
        .select('mappings')
        .maybeSingle();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field mappings saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

      // Refresh webhook data
      await fetchWebhooks();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save mappings",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMappings = async (webhook) => {
    try {
      const { data, error } = await supabase
        .from('field_mappings')
        .select('mappings')
        .eq('webhook_id', webhook.id)
        .maybeSingle();

      if (error) throw error;

      return data?.mappings || {};
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch mappings",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
      return {};
    }
  };

  const handleStatusChange = async (webhook) => {
    const newStatus = webhook.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ status: newStatus })
        .eq('id', webhook.id);

      if (error) throw error;

      setWebhooks(webhooks.map(w => 
        w.id === webhook.id ? { ...w, status: newStatus } : w
      ));

      toast({
        title: `Webhook ${newStatus}`,
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating webhook status:', error);
      toast({
        title: 'Error updating status',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL copied',
      status: 'success',
      duration: 2000,
    });
  };

  const handleEdit = (webhook) => {
    setSelectedWebhook(webhook);
    setName(webhook.name);
    
    // Convert existing mappings to JSONPath format if they're in the old format
    const formattedMappings = {};
    Object.entries(webhook.mappings || {}).forEach(([field, value]) => {
      formattedMappings[field] = typeof value === 'string' 
        ? { type: 'jsonpath', path: `$.${value}` }
        : value;
    });
    
    setMappings(formattedMappings);
    setSamplePayload(webhook.samplePayload || {});
    setIsValidJson(true);
    onEditOpen();
  };

  const handleLogs = (webhook) => {
    setSelectedWebhook(webhook);
    onLogsOpen();
  };

  const handleCreateWebhook = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert([{
          name: newWebhook.name,
          workspace_id: currentWorkspace.id,
          status: 'active',
          created_by_email: user.email,
          source: 'custom'
        }])
        .select()
        .single();

      if (error) throw error;

      // Create a corresponding field_mappings record
      const { error: mappingsError } = await supabase
        .from('field_mappings')
        .insert([{
          webhook_id: data.id,
          workspace_id: currentWorkspace.id,
          mapping_type: 'jsonpath',
          mappings: {
            field_mappings: {
              firstname: {
                type: 'jsonpath',
                path: '$.firstname'
              },
              lastname: {
                type: 'jsonpath',
                path: '$.lastname'
              },
              email: {
                type: 'jsonpath',
                path: '$.email'
              },
              phone_number: {
                type: 'jsonpath',
                path: '$.phone_number'
              }
            },
            sample_payload: {
              firstname: 'John',
              lastname: 'Doe',
              email: 'john@example.com',
              phone_number: '(555) 123-4567'
            }
          }
        }]);

      if (mappingsError) {
        console.error('Error creating field mappings:', mappingsError);
        // Continue anyway, as the webhook was created successfully
      }

      const webhookWithUrl = {
        ...data,
        webhookUrl: `${process.env.REACT_APP_API_URL}/webhooks/${data.id}`,
        webhookNote: `Note: Include 'x-workspace-id: ${currentWorkspace.id}' in request headers`
      };

      setWebhooks([webhookWithUrl, ...webhooks]);
      setNewWebhook({ name: '', url: '' });
      onCreateClose();
      
      toast({
        title: 'Webhook created',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error creating webhook',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteClick = (webhook) => {
    if (deleteConfirmId === webhook.id) {
      handleDeleteWebhook(webhook);
    } else {
      setDeleteConfirmId(webhook.id);
    }
  };

  const handleDeleteWebhook = async (webhook) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhook.id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      setWebhooks(webhooks.filter(w => w.id !== webhook.id));
      setDeleteConfirmId(null);
      toast({
        title: 'Webhook deleted',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error deleting webhook',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderActions = (webhook) => {
    const hasMappings = webhook.mappings && Object.keys(webhook.mappings).length > 0;
    
    return (
      <HStack spacing={2}>
        <Button
          size="sm"
          onClick={() => handleEdit(webhook)}
          colorScheme={hasMappings ? "green" : "gray"}
          variant={hasMappings ? "solid" : "outline"}
          leftIcon={hasMappings ? <CheckIcon /> : undefined}
        >
          {hasMappings ? "Configured" : "Configure"}
        </Button>
        <Button
          size="sm"
          onClick={() => handleLogs(webhook)}
        >
          Logs
        </Button>
        <Button
          size="sm"
          colorScheme="red"
          variant={deleteConfirmId === webhook.id ? "solid" : "ghost"}
          leftIcon={<DeleteIcon />}
          isLoading={isDeleting && deleteConfirmId === webhook.id}
          onClick={() => handleDeleteClick(webhook)}
        >
          {deleteConfirmId === webhook.id ? "Really?" : "Delete"}
        </Button>
      </HStack>
    );
  };

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isLogsOpen, onOpen: onLogsOpen, onClose: onLogsClose } = useDisclosure();

  const filteredWebhooks = webhooks.filter(webhook => 
    webhook.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // First update the webhook name
      const { error: webhookError } = await supabase
        .from('webhooks')
        .update({ name })
        .eq('id', selectedWebhook.id);

      if (webhookError) throw webhookError;

      // Ensure all mappings are in JSONPath format
      const formattedMappings = {};
      Object.entries(mappings).forEach(([field, value]) => {
        formattedMappings[field] = typeof value === 'string'
          ? { type: 'jsonpath', path: `$.${value}` }
          : value;
      });

      // Then update the field mappings
      const { error: mappingsError } = await supabase
        .from('field_mappings')
        .update({
          mappings: {
            field_mappings: formattedMappings,
            sample_payload: samplePayload
          },
          mapping_type: 'jsonpath',
          updated_at: new Date().toISOString()
        })
        .eq('webhook_id', selectedWebhook.id);

      if (mappingsError) throw mappingsError;

      toast({
        title: "Success",
        description: "Webhook updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });

      // Refresh webhook data
      await fetchWebhooks();
      onEditClose();
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update webhook",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapField = (field, path) => {
    if (!path) {
      // If path is empty, we're unmapping
      const { [field]: _, ...restMappings } = mappings;
      setMappings(restMappings);
    } else {
      // Add the field mapping with the correct path format
      setMappings({
        ...mappings,
        [field]: {
          type: 'jsonpath',
          path: path.startsWith('$.') ? path : `$.${path}`
        }
      });
    }
  };

  const handleSamplePayloadChange = (e) => {
    const value = e.target.value;
    try {
      // If the value is empty, set an empty object
      const parsed = value.trim() ? JSON.parse(value) : {};
      setSamplePayload(parsed);
      setIsValidJson(true);
    } catch (err) {
      setIsValidJson(false);
      toast({
        title: "Invalid JSON",
        description: "Please enter a valid JSON payload",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    }
  };

  const fetchLatestPayload = async () => {
    setIsLoadingPayload(true);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('payload')
        .eq('webhook_id', selectedWebhook.id)
        .eq('workspace_id', selectedWebhook.workspace_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.payload) {
        setSamplePayload(data.payload);
        toast({
          title: 'Latest payload loaded',
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'No previous payloads found',
          description: 'Try sending a test webhook first',
          status: 'info',
          duration: 5000,
        });
      }
    } catch (err) {
      toast({
        title: 'Failed to load payload',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoadingPayload(false);
    }
  };

  // Add this function to extract sample payload from metadata
  const getSamplePayload = (webhook) => {
    if (!webhook) return null;
    
    // Check if metadata exists and has sample_payload
    if (webhook.metadata && webhook.metadata.sample_payload) {
      return webhook.metadata.sample_payload;
    }
    
    return null;
  };

  // When saving the webhook, update the code to include sample payload in the request
  const handleSaveWebhook = async (webhookData) => {
    try {
      setIsLoading(true);
      
      // Extract sample_payload if it exists
      const { sample_payload, ...restData } = webhookData;
      
      // Create the request data
      const requestData = {
        ...restData
      };
      
      // Add sample_payload to the request if it exists
      if (sample_payload) {
        requestData.sample_payload = sample_payload;
      }
      
      // Make the API call
      const response = await supabase
        .from('webhooks')
        .update(requestData)
        .eq('id', webhookData.id);

      if (response.error) throw response.error;

      toast({
        title: 'Webhook updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh webhooks list
      await fetchWebhooks();
      
      // Close the modal
      onEditClose();
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: 'Error updating webhook',
        description: error.response?.data?.error || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // When loading the webhook for editing, extract sample payload from metadata
  const loadWebhookForEditing = (webhook) => {
    if (!webhook) return;
    
    setSelectedWebhook({
      ...webhook,
      samplePayload: getSamplePayload(webhook)
    });
  };

  // When updating the webhook, include sample payload in the request
  const handleUpdateWebhook = async (webhookId, webhookData) => {
    try {
      setIsLoading(true);
      
      // Extract sample_payload if it exists
      const { sample_payload, ...restData } = webhookData;
      
      // Create the request data
      const requestData = {
        ...restData
      };
      
      // Add sample_payload to the request if it exists
      if (sample_payload) {
        requestData.sample_payload = sample_payload;
      }
      
      // Make the API call
      const response = await supabase
        .from('webhooks')
        .update(requestData)
        .eq('id', webhookId);

      if (response.error) throw response.error;

      toast({
        title: 'Webhook updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh webhooks list
      await fetchWebhooks();
      
      // Close the modal
      onEditClose();
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: 'Error updating webhook',
        description: error.response?.data?.error || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4}>
      <HStack mb={4} justify="space-between">
        <Text fontSize="lg" fontWeight="medium">Webhooks</Text>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          size="sm"
          onClick={onCreateOpen}
        >
          Create Webhook
        </Button>
      </HStack>

      <Input
        placeholder="Search by name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        mb={4}
        size="sm"
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        _hover={{
          borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.300'
        }}
      />

      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Active</Th>
            <Th>Name</Th>
            <Th>Webhook URL</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredWebhooks.map(webhook => (
            <Tr key={webhook.id}>
              <Td>
                <Switch
                  isChecked={webhook.status === 'active'}
                  onChange={() => handleStatusChange(webhook)}
                />
              </Td>
              <Td>{webhook.name}</Td>
              <Td>
                <HStack>
                  <Text isTruncated maxW="300px">{webhook.webhookUrl}</Text>
                  <IconButton
                    aria-label="Copy webhook URL"
                    icon={<CopyIcon />}
                    size="sm"
                    onClick={() => handleCopyUrl(webhook.webhookUrl)}
                  />
                </HStack>
                <Text fontSize="sm" color="gray.500">{webhook.webhookNote}</Text>
              </Td>
              <Td>
                {renderActions(webhook)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="sm">
        <ModalOverlay />
        <ModalContent 
          bg={colorMode === 'dark' ? 'gray.900' : 'white'}
          borderRadius="md"
          boxShadow="lg"
        >
          <ModalHeader 
            borderBottomWidth="1px" 
            borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
            fontSize="md"
            py={3}
          >
            Create New Webhook
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Name</FormLabel>
              <Input
                placeholder="Enter webhook name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.300'
                }}
                size="md"
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter py={3}>
            <Button variant="ghost" mr={3} onClick={onCreateClose} size="sm">
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateWebhook}
              size="sm"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent 
          maxW="90vw" 
          maxH="90vh"
          bg={colorMode === 'dark' ? 'gray.900' : 'white'}
        >
          <ModalHeader 
            borderBottomWidth="1px" 
            borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
          >
            Configure Webhook
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch" maxH="calc(90vh - 150px)" overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: colorMode === 'dark' ? 'gray.800' : 'gray.100',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: colorMode === 'dark' ? 'gray.600' : 'gray.300',
                  borderRadius: '4px',
                  '&:hover': {
                    background: colorMode === 'dark' ? 'gray.500' : 'gray.400',
                  },
                },
              }}
            >
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter webhook name"
                  bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                  borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
                  _hover={{
                    borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.300'
                  }}
                />
              </FormControl>

              {isValidJson ? (
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <Box>
                    <HStack mb={2} justify="space-between" align="center">
                      <FormLabel mb={0}>Sample Payload</FormLabel>
                      <Button
                        leftIcon={<VscSync />}
                        size="sm"
                        variant="ghost"
                        isLoading={isLoadingPayload}
                        onClick={fetchLatestPayload}
                        _hover={{
                          bg: colorMode === 'dark' ? 'gray.700' : 'gray.100'
                        }}
                      >
                        Load Latest Payload
                      </Button>
                    </HStack>
                    <Box
                      position="relative"
                      bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                      borderWidth="1px"
                      borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
                      borderRadius="md"
                      h="400px"
                      _hover={{
                        borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.300'
                      }}
                    >
                      <Textarea
                        value={JSON.stringify(samplePayload, null, 2)}
                        onChange={handleSamplePayloadChange}
                        placeholder="Paste a sample JSON payload from your webhook"
                        h="100%"
                        fontFamily="mono"
                        fontSize="sm"
                        bg="transparent"
                        border="none"
                        _hover={{ border: 'none' }}
                        _focus={{ border: 'none', boxShadow: 'none' }}
                        spellCheck="false"
                        resize="none"
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    <HStack mb={2} justify="space-between" align="center">
                      <FormLabel mb={0}>Field Mappings</FormLabel>
                      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                        Click fields to map
                      </Text>
                    </HStack>
                    <JsonPathFinder
                      sampleData={samplePayload}
                      mappings={mappings}
                      onMapField={handleMapField}
                    />
                  </Box>
                </Grid>
              ) : (
                <Box>
                  <HStack mb={2} justify="space-between" align="center">
                    <FormLabel mb={0}>Sample Payload</FormLabel>
                    <Button
                      leftIcon={<VscSync />}
                      size="sm"
                      variant="ghost"
                      isLoading={isLoadingPayload}
                      onClick={fetchLatestPayload}
                      _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.100'
                      }}
                    >
                      Load Latest Payload
                    </Button>
                  </HStack>
                  <Box
                    position="relative"
                    bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                    borderWidth="1px"
                    borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
                    borderRadius="md"
                    h="400px"
                    _hover={{
                      borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.300'
                    }}
                  >
                    <Textarea
                      value={JSON.stringify(samplePayload, null, 2)}
                      onChange={handleSamplePayloadChange}
                      placeholder="Paste a sample JSON payload from your webhook"
                      h="100%"
                      fontFamily="mono"
                      fontSize="sm"
                      bg="transparent"
                      border="none"
                      _hover={{ border: 'none' }}
                      _focus={{ border: 'none', boxShadow: 'none' }}
                      spellCheck="false"
                      resize="none"
                    />
                  </Box>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTopWidth="1px"
            borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
          >
            <Button 
              mr={3} 
              onClick={onEditClose}
              variant="ghost"
              _hover={{
                bg: colorMode === 'dark' ? 'gray.700' : 'gray.100'
              }}
            >
              Close
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSave}
              isLoading={isLoading}
              leftIcon={<VscSave />}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Logs Modal */}
      <Modal isOpen={isLogsOpen} onClose={onLogsClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack>
              <IconButton
                icon={<ChevronLeftIcon />}
                variant="ghost"
                onClick={onLogsClose}
                aria-label="Back"
              />
              <Text>Logs for {selectedWebhook?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalBody overflowY="auto">
            <WebhookLogs webhook={selectedWebhook} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WebhookPanel;
