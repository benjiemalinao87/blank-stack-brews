import React, { useState, useEffect } from 'react';
import {
  VStack,
  Text,
  Badge,
  useColorMode,
  IconButton,
  HStack,
  Button,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { VscTrash, VscAdd } from 'react-icons/vsc';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import CustomFieldDialog from './CustomFieldDialog';

// Default sample payload to use when none is provided
const defaultSamplePayload = {
  firstname: "John",
  lastname: "Doe",
  email: "john.doe@example.com",
  phone: "1234567890",
  company: "Example Corp",
  message: "Hello, I'm interested in your services"
};

const getFieldTypeColor = (type) => {
  const colors = {
    text: 'gray',
    number: 'blue',
    date: 'orange',
    email: 'green',
    phone: 'purple',
    url: 'cyan',
    boolean: 'pink'
  };
  return colors[type] || 'gray';
};

const getFieldTypeDescription = (type) => {
  const descriptions = {
    text: 'Plain text value',
    number: 'Numeric value',
    date: 'Date value',
    email: 'Email address',
    phone: 'Phone number',
    url: 'Web URL',
    boolean: 'Yes/No value'
  };
  return descriptions[type] || '';
};

const FieldMapping = ({ fields, mappings, onMapField, onRemoveMapping }) => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [customFields, setCustomFields] = useState([]);
  const { currentWorkspace } = useWorkspace();
  const [samplePayload, setSamplePayload] = useState(null);

  useEffect(() => {
    fetchCustomFields();
  }, [currentWorkspace?.id]);

  const fetchCustomFields = async () => {
    if (!currentWorkspace) return;
    
    const { data } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('workspace_id', currentWorkspace.id);
    
    if (data) {
      setCustomFields(data);
    }
  };

  const handleCustomFieldCreated = (newField) => {
    setCustomFields([...customFields, newField]);
  };

  // Combine standard fields with custom fields
  const allFields = [
    ...fields,
    ...customFields.map(field => ({
      name: field.name,
      label: field.label,
      type: field.field_type,
      isCustom: true
    }))
  ];

  // Update this function to extract sample payload from field_mappings
  const getSamplePayload = async (webhook) => {
    if (!webhook) return null;
    
    try {
      // Get field mappings for this webhook
      const { data, error } = await supabase
        .from('field_mappings')
        .select('mappings')
        .eq('webhook_id', webhook.id)
        .maybeSingle();
        
      if (error) throw error;
      
      // Check if mappings exists and has sample_payload
      if (data?.mappings?.sample_payload) {
        return data.mappings.sample_payload;
      }
      
      return defaultSamplePayload;
    } catch (error) {
      console.error('Error getting sample payload:', error);
      return defaultSamplePayload;
    }
  };

  // Update this function to save sample payload to field_mappings
  const saveSamplePayload = async (webhookId, samplePayload) => {
    try {
      // Get current field mappings
      const { data: currentMappings, error: getError } = await supabase
        .from('field_mappings')
        .select('mappings')
        .eq('webhook_id', webhookId)
        .maybeSingle();
        
      if (getError) throw getError;
      
      // If no mappings exist, create a new record
      if (!currentMappings) {
        const { error: insertError } = await supabase
          .from('field_mappings')
          .insert([{
            webhook_id: webhookId,
            workspace_id: currentWorkspace.id,
            mappings: {
              field_mappings: {},
              sample_payload: samplePayload
            }
          }]);
          
        if (insertError) throw insertError;
      } else {
        // Update existing mappings
        const updatedMappings = {
          ...currentMappings.mappings,
          sample_payload: samplePayload
        };
        
        const { error: updateError } = await supabase
          .from('field_mappings')
          .update({ 
            mappings: updatedMappings,
            updated_at: new Date().toISOString()
          })
          .eq('webhook_id', webhookId);
          
        if (updateError) throw updateError;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving sample payload:', error);
      throw error;
    }
  };

  // When loading the webhook, extract the sample payload from metadata
  const loadWebhookData = async (webhookId) => {
    try {
      // Get webhook data
      const { data: webhook, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();
        
      if (error) throw error;
      
      // Extract sample payload from metadata
      const samplePayload = await getSamplePayload(webhook);
      
      // Set the sample payload state
      setSamplePayload(samplePayload || defaultSamplePayload);
      
      return webhook;
    } catch (error) {
      console.error('Error loading webhook data:', error);
      throw error;
    }
  };

  // When saving the field mappings, also save the sample payload
  const saveFieldMappings = async (webhookId, mappings, samplePayload) => {
    try {
      // Save field mappings
      const { error: mappingsError } = await supabase
        .from('field_mappings')
        .upsert({
          webhook_id: webhookId,
          mappings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'webhook_id'
        });
        
      if (mappingsError) throw mappingsError;
      
      // Save sample payload
      await saveSamplePayload(webhookId, samplePayload);
      
      return true;
    } catch (error) {
      console.error('Error saving field mappings:', error);
      throw error;
    }
  };

  return (
    <VStack align="stretch" spacing={2} w="100%">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium">Available Fields</Text>
        <Button
          size="sm"
          leftIcon={<VscAdd />}
          variant="ghost"
          onClick={onOpen}
        >
          Add Custom Field
        </Button>
      </HStack>
      
      {allFields.map((field) => {
        const isMapped = Object.values(mappings).includes(field.name);
        const mappedTo = Object.entries(mappings).find(
          ([_, value]) => value === field.name
        );

        return (
          <Tooltip
            key={field.name}
            label={getFieldTypeDescription(field.type)}
            placement="top"
          >
            <HStack
              p={2}
              borderRadius="md"
              bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
              justify="space-between"
              transition="all 0.2s"
              _hover={{
                bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
              }}
            >
              <HStack spacing={2}>
                <Text fontSize="sm">{field.label || field.name}</Text>
                {field.type && (
                  <Badge colorScheme={getFieldTypeColor(field.type)} fontSize="xs">
                    {field.type}
                  </Badge>
                )}
                {field.isCustom && (
                  <Badge colorScheme="purple" fontSize="xs">
                    Custom
                  </Badge>
                )}
                {isMapped && (
                  <Badge colorScheme="green" fontSize="xs">
                    Mapped
                  </Badge>
                )}
              </HStack>
              {isMapped && (
                <IconButton
                  icon={<VscTrash />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onRemoveMapping(mappedTo[0])}
                  aria-label="Remove mapping"
                />
              )}
            </HStack>
          </Tooltip>
        );
      })}

      <CustomFieldDialog
        isOpen={isOpen}
        onClose={onClose}
        onFieldCreated={handleCustomFieldCreated}
      />
    </VStack>
  );
};

export default FieldMapping;
