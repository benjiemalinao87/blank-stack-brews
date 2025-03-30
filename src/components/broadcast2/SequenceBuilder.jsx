import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  useToast, 
  VStack,
  useColorModeValue,
  Container,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Spinner,
  Radio,
  RadioGroup,
  Stack,
  HStack,
  Badge,
  Icon,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, InfoIcon, TimeIcon } from '@chakra-ui/icons';
import { FaPaperPlane, FaPlus } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { v4 as uuidv4 } from 'uuid';
import { testSupabaseConnection } from '../../test/supabase-connection';

// Import components
import CampaignForm from './CampaignForm';
import AudienceSelector from './AudienceSelector';
import VisualSequenceBuilder from './VisualSequenceBuilder';

// Constants for broadcast configuration
const BATCH_SIZE = 50; // Process recipients in batches of 50
const QUEUE_SERVICE_URL = process.env.REACT_APP_QUEUE_SERVICE_URL || 'https://queue-services-production.up.railway.app';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://cc.automate8.com';

// API endpoints
const API_ENDPOINTS = {
  sms: '/api/proxy/queue/schedule-sms',
  email: '/api/proxy/queue/schedule-email'
};

// Helper function to calculate delay in milliseconds
const calculateStepDelay = (waitDuration) => {
  if (!waitDuration) return 0;
  // Convert days to milliseconds (days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  return waitDuration * 24 * 60 * 60 * 1000;
};

// Add error handling helper
const handleApiError = async (response) => {
  const text = await response.text();
  let errorMessage;
  try {
    const json = JSON.parse(text);
    errorMessage = json.message || json.error || text;
  } catch {
    errorMessage = text;
  }
  throw new Error(`API Error (${response.status}): ${errorMessage}`);
};

// Add this function near the top with other utility functions
const ensureUniqueCampaignName = async (name, workspaceId) => {
  // First try with the original name
  const { data: existing } = await supabase
    .from('campaigns')
    .select('name')
    .eq('workspace_id', workspaceId)
    .eq('name', name)
    .limit(1);

  if (!existing || existing.length === 0) {
    return name; // Original name is unique
  }

  // If name exists, add a number suffix
  let counter = 1;
  let uniqueName = name;
  
  while (true) {
    uniqueName = `${name} (${counter})`;
    const { data: checkDuplicate } = await supabase
      .from('campaigns')
      .select('name')
      .eq('workspace_id', workspaceId)
      .eq('name', uniqueName)
      .limit(1);

    if (!checkDuplicate || checkDuplicate.length === 0) {
      return uniqueName;
    }
    counter++;
  }
};

/**
 * Sequence Builder Component
 * 
 * Allows creation and editing of multi-day campaign sequences.
 * Provides visual drag-and-drop interface for sequence steps.
 * 
 * Works within the Mac OS-inspired draggable window pattern.
 */
const SequenceBuilder = ({ campaignId, isNew, onClose, workspaceId }) => {
  // Use either the prop or URL param
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  
  // Use the campaignId prop if provided, otherwise use the URL param
  const id = campaignId || paramId;
  
  // Debug the currentWorkspace to see what's available
  console.log('Current workspace from context:', currentWorkspace);
  
  // Try to find a workspace ID from various sources
  // First try props, then context, then try to fetch workspaces
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaceId || currentWorkspace?.id || null);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(!!activeWorkspaceId);
  
  // Fetch workspaces if not provided
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (activeWorkspaceId) {
        console.log('Already have workspace ID:', activeWorkspaceId);
        return;
      }
      
      try {
        console.log('Attempting to fetch workspace ID');
        // Try to fetch the first workspace for this user
        const { data: workspaces, error } = await supabase
          .from('workspaces')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('Error fetching workspace:', error);
          throw error;
        }
        
        if (workspaces && workspaces.length > 0) {
          console.log('Found workspace:', workspaces[0]);
          setActiveWorkspaceId(workspaces[0].id);
        } else {
          console.error('No workspaces found for user');
          toast({
            title: 'Workspace Required',
            description: 'Could not find a workspace for your account. Please create one first.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error in workspace fetch:', error);
      } finally {
        setWorkspaceLoaded(true);
      }
    };
    
    fetchWorkspace();
  }, []);
  
  // Log any workspace ID changes
  useEffect(() => {
    console.log('Active workspace ID updated:', activeWorkspaceId);
    
    // Update campaign with new workspace ID when it changes
    if (activeWorkspaceId) {
      setCampaign(prevCampaign => ({
        ...prevCampaign,
        workspace_id: activeWorkspaceId
      }));
    }
  }, [activeWorkspaceId]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [campaign, setCampaign] = useState({
    name: '',
    description: '',
    type: 'sequence',
    status: 'draft',
    workspace_id: activeWorkspaceId
  });
  const [sequenceSteps, setSequenceSteps] = useState([]);
  const [audienceCriteria, setAudienceCriteria] = useState({});
  const [tabIndex, setTabIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(!!id && !isNew);
  const [recipientCount, setRecipientCount] = useState(0);
  const [sendOption, setSendOption] = useState('immediately');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [audienceSegment, setAudienceSegment] = useState(null);
  const [activeWindows, setActiveWindows] = useState([]);
  const [isAddingStep, setIsAddingStep] = useState(false);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryBgColor = useColorModeValue('#f8fafc', 'gray.750');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.3)');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBgColor = useColorModeValue('blue.50', 'blue.800');
  const instructionsTextColor = useColorModeValue('gray.600', 'gray.400');
  const scheduleBgColor = useColorModeValue('blue.50', 'blue.900');
  const countBgColor = useColorModeValue('gray.100', 'gray.700');
  
  // Additional color values for Apple-style tabs
  const pillBgColor = useColorModeValue("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)");
  const tabActiveBg = useColorModeValue("white", "gray.700");
  const tabInactiveColor = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) {
        setLoading(false);
        // Set default schedule time if starting a new campaign
        if (!scheduledDate || !scheduledTime) {
          setDefaultScheduleTime();
        }
        return;
      }
      
      try {
        setLoading(true);
        
        // Test Supabase permissions early
        await testSupabasePermissions();
        
        // Fetch the campaign data
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setCampaign(data);
          
          // Load sequence steps
          if (data.sequence_data && Array.isArray(data.sequence_data.steps)) {
            setSequenceSteps(data.sequence_data.steps);
          }
          
          // Parse scheduled date and time
          if (data.scheduled_at) {
            const scheduledDate = new Date(data.scheduled_at);
            setScheduledDate(scheduledDate.toISOString().split('T')[0]);
            setScheduledTime(scheduledDate.toTimeString().slice(0, 5));
          } else if (!scheduledDate || !scheduledTime) {
            // Set default schedule time if not already set
            setDefaultScheduleTime();
          }
          
          // Set send option based on status
          if (data.status === 'scheduled') {
            setSendOption('scheduled');
          }
        }
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast({
          title: 'Error loading campaign',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaign();
  }, [id, supabase, toast]);

  const loadCampaignData = async (campaignId) => {
    setLoading(true);
    try {
      // Fetch campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch audience criteria
      if (campaignData.audience_criteria) {
        setAudienceCriteria(campaignData.audience_criteria);
        
        // Estimate recipient count based on audience criteria
        if (activeWorkspaceId) {
          const { data: countData } = await supabase.rpc(
            'get_broadcast_recipients_count_v1',
            {
              p_workspace_id: activeWorkspaceId,
              p_filters: campaignData.audience_criteria
            }
          );
          setRecipientCount(countData || 0);
        }
      }

      // Fetch sequence steps
      const { data: sequenceData, error: sequenceError } = await supabase
        .from('sequences')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('step_order', { ascending: true });

      if (sequenceError) throw sequenceError;
      setSequenceSteps(sequenceData || []);
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast({
        title: 'Error loading campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch recipients directly from API
  const fetchRecipientsFromAudience = async (criteria, workspaceId) => {
    try {
      console.log('Fetching recipients with criteria:', criteria, 'workspace:', workspaceId);
      
      // Start with base query without aggregates
      let query = supabase
        .from('contacts')
        .select('id, firstname, lastname, phone_number, email')
        .eq('workspace_id', workspaceId)
        .not('phone_number', 'is', null);

      // Apply filters if they exist
      if (criteria) {
        if (criteria.tags && Array.isArray(criteria.tags) && criteria.tags.length > 0) {
          query = query.contains('tags', criteria.tags);
        }
        
        if (criteria.lead_status) {
          query = query.eq('lead_status', criteria.lead_status);
        }
        
        if (criteria.conversation_status) {
          query = query.eq('conversation_status', criteria.conversation_status);
        }

        // Add any custom metadata filters
        if (criteria.metadata && typeof criteria.metadata === 'object') {
          Object.entries(criteria.metadata).forEach(([key, value]) => {
            query = query.eq(`metadata->>${key}`, value);
          });
        }
      }
      
      // Execute query
      const { data: contacts, error } = await query;
      
      if (error) {
        console.error('Error fetching recipients:', error);
        throw error;
      }
      
      if (!contacts || contacts.length === 0) {
        console.warn('No recipients found matching criteria');
        return [];
      }
      
      console.log(`Found ${contacts.length} recipients`);
      return contacts;
    } catch (error) {
      console.error('Error in fetchRecipientsFromAudience:', error);
      throw new Error(`Failed to fetch recipients: ${error.message}`);
    }
  };

  // Handler for audience changes
  const handleAudienceChange = (audienceData) => {
    if (audienceData) {
      if (typeof audienceData.estimatedRecipients === 'number') {
      setRecipientCount(audienceData.estimatedRecipients);
      }
      
      // Store the actual filtering criteria
      if (audienceData.filters) {
        // Convert audience filters to the format expected by the database function
        const filterObj = audienceData.filters.reduce((acc, filter) => {
          if (filter.field && filter.value) {
            acc[filter.field] = filter.value;
          }
          return acc;
        }, {});
        
        setAudienceCriteria(filterObj);
        console.log("Updated audience criteria:", filterObj);
      }
    }
  };

  const handleSave = async () => {
    if (!campaign.name?.trim()) {
      toast({
        title: 'Campaign name required',
        description: 'Please enter a name for your campaign',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setTabIndex(0);
      return;
    }
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const workspace_id = activeWorkspaceId;
      
      // Get unique name if needed
      const uniqueName = await ensureUniqueCampaignName(campaign.name.trim(), workspace_id);
      
      // Prepare campaign data with required fields
      const campaignData = {
        ...campaign,
        workspace_id,
        name: uniqueName,
        type: campaign.type || 'sequence',
        status: campaign.status || 'draft',
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Remove any existing ID to avoid unique constraint violation
      if (!isEditing) {
        delete campaignData.id;
      }
      
      let campaignId = campaign.id;
      
      if (!isEditing) {
        // Create new campaign
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select()
          .single();
        
        if (error) throw error;
        
        campaignId = data.id;
        // Update local state with the new ID
        setCampaign(prev => ({ ...prev, id: campaignId }));
      } else {
        // Update existing campaign
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({
            ...campaign,
            audience_criteria: audienceCriteria || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
        
        if (updateError) throw updateError;
      }
      
      // Save sequence steps
      for (let i = 0; i < sequenceSteps.length; i++) {
        const step = sequenceSteps[i];
        try {
          // Try inserting with minimal required fields first
          const minimalStepData = {
            campaign_id: campaignId,
            step_order: i,
            message: step.content || step.message || ''
          };

          if (step.id?.includes('new-')) {
            // Create new step with minimal fields
            const { data, error: minError } = await supabase
              .from('sequences')
              .insert(minimalStepData)
              .select()
              .single();

            if (minError) throw minError;
            
            // Update the step ID in our local state
            sequenceSteps[i] = { ...step, id: data.id };

            // Try to update with additional fields
            try {
              const additionalFields = {
                wait_duration: parseInt(step.wait_duration || 0),
                channel: step.channel || 'sms',
                subject: step.channel === 'email' ? (step.subject || '') : null,
                updated_at: new Date().toISOString()
              };

              const { error: updateError } = await supabase
                .from('sequences')
                .update(additionalFields)
                .eq('id', data.id);

              if (updateError) {
                console.warn('Could not update additional fields:', updateError);
                // Don't throw error here, continue with basic functionality
              }
            } catch (additionalError) {
              console.warn('Error updating additional fields:', additionalError);
              // Continue with basic functionality
            }
          } else {
            // Update existing step
            const { error: updateError } = await supabase
              .from('sequences')
              .update(minimalStepData)
              .eq('id', step.id);
            
            if (updateError) throw updateError;

            // Try to update additional fields
            try {
              const additionalFields = {
                wait_duration: parseInt(step.wait_duration || 0),
                channel: step.channel || 'sms',
                subject: step.channel === 'email' ? (step.subject || '') : null,
                updated_at: new Date().toISOString()
              };

              await supabase
                .from('sequences')
                .update(additionalFields)
                .eq('id', step.id);
            } catch (additionalError) {
              console.warn('Error updating additional fields:', additionalError);
              // Continue with basic functionality
            }
          }
        } catch (error) {
          console.error(`Error saving sequence step ${i + 1}:`, error);
          throw new Error(`Failed to save sequence step ${i + 1}: ${error.message}`);
        }
      }

      // Update local state with any new IDs
      setSequenceSteps([...sequenceSteps]);

      toast({
        title: 'Campaign saved',
        description: `Campaign "${campaign.name}" has been saved successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Use onClose if provided, otherwise navigate
      if (onClose) {
        onClose();
      } else if (!isEditing) {
        navigate('/broadcast2');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error saving campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendBroadcast = async () => {
    try {
      setSending(true);
      
      // Validate basic requirements
      if (!campaign.name?.trim()) {
        toast({
          title: 'Campaign name required',
          description: 'Please enter a name for your campaign',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setTabIndex(0);
        return;
      }

      // Validate sequence steps
      if (!sequenceSteps.length) {
        throw new Error('Please add at least one message step before sending');
      }

      // Validate workspace ID
      if (!activeWorkspaceId) {
        throw new Error('Workspace ID is required');
      }

      console.log('Starting broadcast send process...');

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Get unique name if needed
      const uniqueName = await ensureUniqueCampaignName(campaign.name.trim(), activeWorkspaceId);
      
      // Prepare campaign data
      const campaignData = {
        ...campaign,
        workspace_id: activeWorkspaceId,
        name: uniqueName,
        type: campaign.type || 'sequence',
        status: 'draft',
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        audience_criteria: audienceCriteria || {}
      };

      // Save or update campaign
      let campaignId = campaign.id;
      if (!campaignId) {
        // Create new campaign
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select()
          .single();
        
        if (error) throw error;
        campaignId = data.id;
        
        // Update local state
        setCampaign(prev => ({ ...prev, id: campaignId }));
      }

      // Save sequence steps
      for (let i = 0; i < sequenceSteps.length; i++) {
        const step = sequenceSteps[i];
        try {
          // Try inserting with minimal required fields first
          const minimalStepData = {
            campaign_id: campaignId,
            step_order: i,
            message: step.content || step.message || ''
          };

          if (step.id?.includes('new-')) {
            // Create new step with minimal fields
            const { data, error: minError } = await supabase
              .from('sequences')
              .insert(minimalStepData)
              .select()
              .single();

            if (minError) throw minError;
            
            // Update the step ID in our local state
            sequenceSteps[i] = { ...step, id: data.id };

            // Try to update with additional fields
            try {
              const additionalFields = {
                wait_duration: parseInt(step.wait_duration || 0),
                channel: step.channel || 'sms',
                subject: step.channel === 'email' ? (step.subject || '') : null,
                updated_at: new Date().toISOString()
              };

              const { error: updateError } = await supabase
                .from('sequences')
                .update(additionalFields)
                .eq('id', data.id);

              if (updateError) {
                console.warn('Could not update additional fields:', updateError);
                // Don't throw error here, continue with basic functionality
              }
            } catch (additionalError) {
              console.warn('Error updating additional fields:', additionalError);
              // Continue with basic functionality
            }
          } else {
            // Update existing step
            const { error: updateError } = await supabase
              .from('sequences')
              .update(minimalStepData)
              .eq('id', step.id);
            
            if (updateError) throw updateError;

            // Try to update additional fields
            try {
              const additionalFields = {
                wait_duration: parseInt(step.wait_duration || 0),
                channel: step.channel || 'sms',
                subject: step.channel === 'email' ? (step.subject || '') : null,
                updated_at: new Date().toISOString()
              };

              await supabase
                .from('sequences')
                .update(additionalFields)
                .eq('id', step.id);
            } catch (additionalError) {
              console.warn('Error updating additional fields:', additionalError);
              // Continue with basic functionality
            }
          }
        } catch (error) {
          console.error(`Error saving sequence step ${i + 1}:`, error);
          throw new Error(`Failed to save sequence step ${i + 1}: ${error.message}`);
        }
      }

      // Update local state with any new IDs
      setSequenceSteps([...sequenceSteps]);

      // Calculate initial delay for scheduled sending
      let initialDelay = 0;
      if (sendOption === 'scheduled') {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const currentDateTime = new Date();
        initialDelay = Math.max(scheduledDateTime.getTime() - currentDateTime.getTime(), 60000);
        
        if (initialDelay < 0) {
          throw new Error('Scheduled time must be in the future');
        }
      }

      // Fetch recipients
      const recipients = await fetchRecipientsFromAudience(audienceCriteria, activeWorkspaceId);
      if (!recipients?.length) {
        throw new Error('No recipients match the audience criteria');
      }

      // Start sending broadcast
      const batchId = `batch_${Date.now()}`;
      let queuedMessages = 0;

      // Process recipients in batches
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        
        for (const recipient of batch) {
          for (const step of sequenceSteps) {
            const stepDelay = calculateStepDelay(step.wait_duration);
            const totalDelay = initialDelay + stepDelay;
            
            const isEmail = step.channel === 'email';
            const endpoint = API_ENDPOINTS[isEmail ? 'email' : 'sms'];
            
            const basePayload = {
              phoneNumber: recipient.phone_number,
              message: step.content || step.message,
              workspaceId: activeWorkspaceId,
              contactId: recipient.id,
              delay: totalDelay,
              metadata: {
                source: 'broadcast2',
                campaignId: campaignId,
                messageId: Date.now().toString(),
                scheduledTime: new Date(Date.now() + totalDelay).toISOString(),
                timestamp: new Date().toISOString(),
                callbackEndpoint: isEmail ? "/api/email/send" : "/send-sms",
                batchId: batchId
              }
            };

            const payload = isEmail ? {
              ...basePayload,
              to: recipient.email,
              subject: step.subject || 'Your campaign message',
              html: step.content || step.message || '',
            } : {
              ...basePayload
            };

            if (isEmail && !payload.html) {
              throw new Error('Email content is required');
            } else if (!isEmail && !payload.message) {
              throw new Error('SMS content is required');
            }

            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              await handleApiError(response);
            }

            const result = await response.json();
            queuedMessages++;
            
            toast({
              title: 'Message Queued',
              description: totalDelay > 0 ? 
                `${isEmail ? 'Email' : 'SMS'} scheduled for ${new Date(Date.now() + totalDelay).toLocaleString()}` :
                `${isEmail ? 'Email' : 'SMS'} queued for immediate delivery`,
              status: 'success',
              duration: 3000,
              isClosable: true
            });
          }
        }
      }

      // Calculate success metrics
      const successCount = queuedMessages;
      const totalMessages = recipients.length * sequenceSteps.length;
      const successRate = (successCount / totalMessages) * 100;

      // Update campaign status
      const updateData = {
        status: sendOption === 'scheduled' ? 'scheduled' : 'active',
        scheduled_at: sendOption === 'scheduled' ? `${scheduledDate}T${scheduledTime}` : null,
        sent_at: sendOption === 'immediately' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        queue_results: {
          total: totalMessages,
          successful: successCount,
          jobIds: Array.from({ length: totalMessages }, (_, i) => `${batchId}_${i + 1}`),
          lastUpdated: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId);

      if (updateError) {
        console.error('Error updating campaign status:', updateError);
        toast({
          title: 'Campaign Status Update Warning',
          description: 'Campaign was sent successfully but status update failed. Please refresh the page.',
          status: 'warning',
          duration: 5000,
          isClosable: true
        });
      }

      // Show final success toast
      toast({
        title: 'Broadcast Queued Successfully',
        description: `${successCount} of ${totalMessages} messages queued (${successRate.toFixed(1)}% success)`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate or close
      if (onClose) {
        onClose();
      } else {
        navigate('/broadcast2');
      }

    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error Sending Broadcast',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const getStepSummary = () => {
    if (!sequenceSteps.length) return null;
    
    return sequenceSteps.map(step => ({
      day: step.wait_duration,
      time: step.wait_until_start && step.wait_until_end 
        ? `${step.wait_until_start} - ${step.wait_until_end}` 
        : step.wait_until,
      channel: step.channel,
      preview: step.content?.length > 50 ? `${step.content.substring(0, 50)}...` : step.content
    }));
  };

  // Add a function to test Supabase permissions
  const testSupabasePermissions = async () => {
    try {
      console.log('Testing Supabase database permissions...');
      
      // 1. Test basic table access
      const { data: tableTest, error: tableError } = await supabase
        .from('campaigns')
        .select('count()')
        .limit(1);
        
      if (tableError) {
        console.error('Error accessing campaigns table:', tableError);
        return { success: false, error: tableError };
      }
      
      console.log('Successfully accessed campaigns table');
      
      // 2. Test RPC function existence and permissions using a simple function first
      try {
        const { error: funcError } = await supabase.rpc('get_server_time');
        
        if (funcError) {
          if (funcError.message.includes('function get_server_time() does not exist')) {
            console.warn('Function get_server_time does not exist - this is just a test function');
          } else if (funcError.message.includes('permission denied')) {
            console.error('Permission denied for RPC functions');
            return { success: false, error: funcError, message: 'Permission denied for RPC functions' };
          } else {
            console.warn('Error in test RPC function:', funcError);
          }
        } else {
          console.log('Successfully tested RPC function access');
        }
      } catch (rpcError) {
        console.warn('Error testing RPC function:', rpcError);
      }
      
      // 3. Test service_role access (if available)
      if (supabase.auth.session()?.access_token) {
        console.log('User is authenticated with token');
      } else {
        console.warn('No authentication token available - might need to sign in');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error testing Supabase permissions:', error);
      return { success: false, error };
    }
  };

  // Add handleDockItemClick function
  const handleDockItemClick = (itemId) => {
    // Handle dock item clicks based on itemId
    switch (itemId) {
      case 'campaign-manager':
        navigate('/broadcast2');
        break;
      case 'contacts':
        navigate('/');
        setActiveWindows([...activeWindows, 'contacts']);
        break;
      case 'livechat':
        navigate('/');
        setActiveWindows([...activeWindows, 'livechat']);
        break;
      // Add more cases for other dock items
      default:
        navigate('/');
        if (!activeWindows.includes(itemId)) {
          setActiveWindows([...activeWindows, itemId]);
        }
    }
  };

  // Set default schedule time to be 15 minutes in the future
  const setDefaultScheduleTime = () => {
    const now = new Date();
    
    // Add 15 minutes to current time
    now.setMinutes(now.getMinutes() + 15);
    
    // Format date as YYYY-MM-DD for the date input
    const dateString = now.toISOString().split('T')[0];
    
    // Format time as HH:MM for the time input (local time)
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    // Pad with leading zeros if needed
    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    
    const timeString = `${hours}:${minutes}`;
    
    setScheduledDate(dateString);
    setScheduledTime(timeString);
    
    console.log(`Default schedule time set to ${dateString} ${timeString} (15 minutes from now)`);
  };

  const handleAddStep = () => {
    const newStep = {
      id: `new-${uuidv4()}`,
      campaign_id: campaign.id,
      step_order: sequenceSteps.length,
      channel: 'sms',
      wait_duration: 0,
      content: '',
      message: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setSequenceSteps([...sequenceSteps, newStep]);
    setIsAddingStep(false);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" p={0}>
        <Box 
          bg={bgColor} 
          borderRadius="lg" 
          borderWidth="1px" 
          borderColor={borderColor}
          overflow="hidden"
          boxShadow="md"
          height="calc(100vh - 100px)"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="purple.500" />
          <Text mt={4}>Loading campaign data...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Box height="100%" overflow="auto">
      <Container maxW="1200px" px={4} py={4}>
        <VStack spacing={4} align="stretch">
          <Box 
            bg={bgColor} 
            borderRadius="16px" 
            overflow="hidden"
            boxShadow={`0 2px 6px ${shadowColor}`}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Tabs 
              index={tabIndex} 
              onChange={setTabIndex}
              colorScheme="blue" 
              size="md"
              variant="unstyled"
              position="relative"
            >
              <Flex 
                bg={secondaryBgColor}
                borderBottomWidth="1px"
                borderBottomColor={borderColor}
                px={6}
                py={3}
                align="center"
                justify="space-between"
                position="relative"
              >
                {/* Apple-style pill tabs */}
                <Flex 
                  bg={pillBgColor} 
                  borderRadius="10px" 
                  p="3px"
                  height="38px"
                  width="auto"
                  align="center"
                  justify="center"
                >
                  <Box 
                    as="button"
                    onClick={() => setTabIndex(0)}
                    position="relative"
                    height="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={4}
                    minWidth="140px"
                    color={tabIndex === 0 ? textColor : tabInactiveColor}
                    fontWeight="medium"
                    fontSize="14px"
                    bg={tabIndex === 0 ? tabActiveBg : "transparent"}
                    borderRadius="8px"
                    boxShadow={tabIndex === 0 ? "0px 1px 2px rgba(0,0,0,0.05)" : "none"}
                    transition="all 0.15s"
                    zIndex="1"
                    _hover={{
                      color: textColor
                    }}
                  >
                    Campaign Details
                  </Box>
                  
                  <Box 
                    as="button"
                    onClick={() => setTabIndex(1)}
                    position="relative"
                    height="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={4}
                    minWidth="140px"
                    color={tabIndex === 1 ? textColor : tabInactiveColor}
                    fontWeight="medium"
                    fontSize="14px"
                    bg={tabIndex === 1 ? tabActiveBg : "transparent"}
                    borderRadius="8px"
                    boxShadow={tabIndex === 1 ? "0px 1px 2px rgba(0,0,0,0.05)" : "none"}
                    transition="all 0.15s"
                    zIndex="1"
                    _hover={{
                      color: textColor
                    }}
                  >
                    Select Audience
                  </Box>
                  
                  <Box 
                    as="button"
                    onClick={() => setTabIndex(2)}
                    position="relative"
                    height="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={4}
                    minWidth="140px"
                    color={tabIndex === 2 ? textColor : tabInactiveColor}
                    fontWeight="medium"
                    fontSize="14px"
                    bg={tabIndex === 2 ? tabActiveBg : "transparent"}
                    borderRadius="8px"
                    boxShadow={tabIndex === 2 ? "0px 1px 2px rgba(0,0,0,0.05)" : "none"}
                    transition="all 0.15s"
                    zIndex="1"
                    _hover={{
                      color: textColor
                    }}
                  >
                    Build Sequence
                  </Box>
                  
                  <Box 
                    as="button"
                    onClick={() => setTabIndex(3)}
                    position="relative"
                    height="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={4}
                    minWidth="140px"
                    color={tabIndex === 3 ? textColor : tabInactiveColor}
                    fontWeight="medium"
                    fontSize="14px"
                    bg={tabIndex === 3 ? tabActiveBg : "transparent"}
                    borderRadius="8px"
                    boxShadow={tabIndex === 3 ? "0px 1px 2px rgba(0,0,0,0.05)" : "none"}
                    transition="all 0.15s"
                    zIndex="1"
                    _hover={{
                      color: textColor
                    }}
                  >
                    Review & Send
                  </Box>
                </Flex>
                
                {/* Only keep the Save Campaign button here */}
                <Button
                  bg="#7F5AD5"
                  color="white"
                  isLoading={saving}
                  onClick={handleSave}
                  fontSize="14px"
                  fontWeight="medium"
                  height="34px"
                  borderRadius="6px"
                  px={4}
                  boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
                  _hover={{ 
                    bg: '#6a4cb3',
                    transform: "translateY(-1px)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" 
                  }}
                  _active={{ bg: '#5a3f99' }}
                  transition="all 0.15s"
                >
                  Save Campaign
                </Button>
              </Flex>
              
            <TabPanels>
                {/* Content panels remain the same */}
              <TabPanel p={0}>
                {loading ? (
                  <Flex justify="center" align="center" py={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <CampaignForm 
                    campaign={campaign} 
                    setCampaign={setCampaign} 
                  />
                )}
              </TabPanel>
              <TabPanel p={0}>
                  <AudienceSelector 
                    onAudienceChange={handleAudienceChange}
                  />
              </TabPanel>
              <TabPanel p={0}>
                <VisualSequenceBuilder
                  sequenceSteps={sequenceSteps}
                  setSequenceSteps={setSequenceSteps}
                  campaign={campaign}
                />
              </TabPanel>
              <TabPanel p={0}>
                <Box p={6}>
                    <VStack spacing={6} align="stretch">
                    <Heading as="h2" size="lg" fontWeight="semibold" color={textColor}>
                      Schedule Your Campaign
                    </Heading>
                    
                    <Text fontSize="16px" color={textColor}>
                      Choose when to send your message sequence
                    </Text>
                    
                    {/* Recipient Count */}
                    <Flex 
                      p={4} 
                      bg={countBgColor} 
                      borderRadius="md" 
                      align="center"
                    >
                      <Text fontSize="17px" fontWeight="semibold">
                        {recipientCount} contacts will receive this message
                      </Text>
                    </Flex>
                    
                    {/* Schedule Options */}
                    <Box 
                      borderWidth="1px" 
                      borderColor={borderColor} 
                      borderRadius="xl" 
                      overflow="hidden"
                    >
                        <RadioGroup 
                          onChange={(value) => {
                            setSendOption(value);
                            if (value === 'scheduled' && (!scheduledDate || !scheduledTime)) {
                              setDefaultScheduleTime();
                            }
                          }} 
                          value={sendOption}
                        >
                        <Stack direction="column" spacing={0}>
                          {/* Immediate Send */}
                          <Box 
                            borderBottomWidth="1px" 
                            borderColor={borderColor}
                            p={6} 
                            bg={sendOption === 'immediately' ? scheduleBgColor : 'transparent'}
                          >
                            <Flex align="flex-start">
                              <Radio 
                                value="immediately" 
                                size="lg" 
                                colorScheme="blue"
                                mr={4}
                              />
                              <Box>
                                <Flex align="center" mb={2}>
                                  <Icon as={FaPaperPlane} color="blue.500" mr={2} />
                                  <Text fontWeight="semibold" fontSize="17px">
                                    Send immediately
                                  </Text>
                                </Flex>
                                <Text fontSize="15px" color={instructionsTextColor}>
                                  Your broadcast will be sent as soon as you confirm
                                </Text>
                              </Box>
                            </Flex>
                          </Box>
                          
                          {/* Scheduled Send */}
                          <Box 
                            p={6} 
                            bg={sendOption === 'scheduled' ? scheduleBgColor : 'transparent'}
                          >
                            <Flex align="flex-start">
                              <Radio 
                                value="scheduled" 
                                size="lg" 
                                colorScheme="blue"
                                mr={4}
                              />
                              <Box>
                                <Flex align="center" mb={2}>
                                  <TimeIcon color="blue.500" mr={2} />
                                  <Text fontWeight="semibold" fontSize="17px">
                                    Schedule for later
                                  </Text>
                                </Flex>
                                
                                {sendOption === 'scheduled' && (
                                    <Box mt={4} borderRadius="md" p={4} bg={bgColor}>
                                      <Text mb={3} fontSize="15px" color={instructionsTextColor}>
                                        Select a future date and time for sending this campaign
                                      </Text>
                                      <HStack spacing={6} alignItems="flex-start">
                                    <Box>
                                      <Text fontSize="14px" fontWeight="medium" mb={1}>Date</Text>
                                      <input 
                                        type="date" 
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        style={{
                                          padding: '8px 12px',
                                          borderRadius: '8px',
                                          border: '1px solid #E2E8F0',
                                              fontSize: '15px',
                                              width: '170px',
                                              outline: 'none'
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                      />
                                    </Box>
                                    <Box>
                                          <Text fontSize="14px" fontWeight="medium" mb={1}>Time (24-hour format)</Text>
                                      <input 
                                        type="time" 
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        style={{
                                          padding: '8px 12px',
                                          borderRadius: '8px',
                                          border: '1px solid #E2E8F0',
                                              fontSize: '15px',
                                              width: '140px',
                                              outline: 'none'
                                        }}
                                      />
                                          <Text fontSize="13px" mt={2} color={instructionsTextColor}>
                                            Current time: {new Date().toLocaleTimeString()}
                                          </Text>
                                    </Box>
                                  </HStack>
                                    </Box>
                                )}
                              </Box>
                            </Flex>
                          </Box>
                        </Stack>
                      </RadioGroup>
                    </Box>
                    
                    {/* Information Alert */}
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="15px">
                        Note: Scheduled campaigns can be viewed and edited in the Scheduled tab.
                      </Text>
                    </Alert>
                    
                    {/* Campaign Summary */}
                    {sequenceSteps.length > 0 && (
                      <Box
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="xl"
                        overflow="hidden"
                        mt={4}
                      >
                        <Box
                          bg={secondaryBgColor}
                          px={6}
                          py={3}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Text fontWeight="semibold" fontSize="16px">
                            Campaign Summary
                          </Text>
                        </Box>
                <Box p={4}>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Text fontWeight="medium" width="200px">Campaign Name:</Text>
                              <Text>{campaign.name || 'Untitled Campaign'}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="medium" width="200px">Total Recipients:</Text>
                              <Text>{recipientCount} contacts</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="medium" width="200px">Number of Steps:</Text>
                              <Text>{sequenceSteps.length} steps</Text>
                            </HStack>
                            
                            <Text fontWeight="medium" mt={2}>Sequence Overview:</Text>
                            <Box borderWidth="1px" borderColor={borderColor} borderRadius="md">
                              <VStack spacing={0} align="stretch">
                                {getStepSummary()?.map((step, index) => (
                                  <Flex 
                                    key={index}
                                    p={3}
                                    borderBottomWidth={index < sequenceSteps.length - 1 ? "1px" : "0"}
                                    borderColor={borderColor}
                                    align="center"
                                  >
                                    <Badge colorScheme="purple" mr={3}>Step {index+1}</Badge>
                                    <Badge 
                                      colorScheme={step.channel === 'sms' ? 'green' : 'blue'} 
                                      mr={3}
                                    >
                                      {step.channel === 'sms' ? 'SMS' : 'Email'}
                                    </Badge>
                                    <Text fontSize="14px" color={instructionsTextColor} mr={3}>
                                      {step.day === 0 
                                        ? 'Same day' 
                                        : `Day ${step.day} at ${step.time}`}
                                    </Text>
                                    <Text fontSize="14px" noOfLines={1} flex="1">
                                      {step.preview || 'No content'}
                                    </Text>
                                  </Flex>
                                ))}
                              </VStack>
                            </Box>
                          </VStack>
                        </Box>
                      </Box>
                    )}
                    
                    {/* Send Button */}
                    <Flex justify="flex-end" mt={6}>
                      <Button
                        bg="#7F5AD5"
                        color="white"
                        size="lg"
                        leftIcon={<Icon as={FaPaperPlane} />}
                        isLoading={sending}
                        onClick={handleSendBroadcast}
                        isDisabled={!sequenceSteps.length || !recipientCount}
                        _hover={{ 
                          bg: '#6a4cb3',
                          transform: "translateY(-1px)",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" 
                        }}
                        _active={{ bg: '#5a3f99' }}
                        transition="all 0.15s"
                      >
                        {sending ? 'Sending...' : 'Send Broadcast'}
                      </Button>
                    </Flex>
                  </VStack>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        
          {/* Tips box - moved below the main content and simplified */}
        <Box 
            p={4} 
          bg={secondaryBgColor} 
          borderRadius="12px"
          borderWidth="1px"
          borderColor={borderColor}
            mt={2}
        >
          <Text 
            fontSize="15px" 
            color={instructionsTextColor}
            lineHeight="1.6"
          >
            <Text as="span" fontWeight="semibold" color={textColor}>
              Tips:
            </Text>{' '}
            Design your multi-day messaging sequence with scheduled steps. Fill out the campaign details, 
            select your target audience, and build your sequence. You can add different types of messages and set 
            delays between them for optimal engagement.
          </Text>
      </Box>
      </VStack>
    </Container>
    </Box>
  );
};

export default SequenceBuilder; 