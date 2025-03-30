import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  HStack,
  useSteps,
  useToast,
  useColorModeValue,
  Container,
  VStack,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import Confetti from 'react-confetti';
import { AddIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { CAMPAIGN_STEPS } from '../CampaignBuilder/constants';
import CampaignNode from '../CampaignBuilder/CampaignNode';
import CampaignSetup from '../CampaignBuilder/CampaignSetup';
import CampaignReview from '../CampaignBuilder/CampaignReview';
import StepperComponent from '../CampaignBuilder/StepperComponent';
import ActiveCampaigns from './ActiveCampaigns';
import { useCampaignOperations } from '../../../hooks/useCampaignOperations';
import { supabase } from '../../../services/supabase';

const CampaignBuilder = ({ board }) => {
  // Extract workspaceId and boardId from the board prop
  const workspaceId = board?.workspace_id || '';
  const boardId = board?.id || '';
  const boardTitle = board?.name || '';
  
  console.log('CampaignBuilder initialized with:', { workspaceId, boardId, boardTitle });
  
  // Move all hook calls to the top of the component
  const toast = useToast();
  const buttonHoverBg = useColorModeValue('purple.100', 'purple.800');
  const boxBg = useColorModeValue('white', 'gray.800');
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiColors, setConfettiColors] = useState(['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B']);
  const [isLoading, setIsLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600
  });

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: CAMPAIGN_STEPS.length,
  });

  const {
    saveCampaign,
    launchCampaign,
    isEnrolling,
    CAMPAIGN_STATUS
  } = useCampaignOperations(workspaceId, boardId);

  const [campaign, setCampaign] = useState({
    name: '',
    workspace_id: workspaceId,
    board_id: boardId,
    status: 'draft',
    description: '',
    segment_id: null
  });

  // Add selectedSegment state
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Update campaign state when workspaceId or boardId changes
  useEffect(() => {
    console.log('Updating campaign with new workspace/board:', { workspaceId, boardId });
    setCampaign(prev => ({
      ...prev,
      workspace_id: workspaceId,
      board_id: boardId
    }));
  }, [workspaceId, boardId]);

  const [nodes, setNodes] = useState([
    {
      type: 'sms',
      message: '',
      send_time: '09:00',
      sequence_order: 1,
      day: 1
    },
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add cleanup for confetti
  useEffect(() => {
    if (showConfetti) {
      // Auto-cleanup confetti after 7 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleAddNode = () => {
    const newSequenceOrder = nodes.length + 1;
    setNodes([
      ...nodes,
      {
        type: 'sms',
        message: '',
        send_time: '09:00',
        sequence_order: newSequenceOrder,
        day: newSequenceOrder
      },
    ]);
  };

  const handleNodeChange = (index, updatedNode) => {
    setNodes(nodes.map((node, i) => (i === index ? { ...node, ...updatedNode } : node)));
  };

  const handleDeleteNode = (index) => {
    if (nodes.length > 1) {
      const updatedNodes = nodes.filter((_, i) => i !== index);
      // Update sequence_order after deletion
      const reorderedNodes = updatedNodes.map((node, index) => ({
        ...node,
        sequence_order: index + 1,
      }));
      setNodes(reorderedNodes);
    } else {
      toast({
        title: 'Cannot delete',
        description: 'You must have at least one message in your campaign.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCampaignChange = useCallback((updatedCampaign) => {
    setCampaign(updatedCampaign);
  }, []);

  // Add segment change handler
  const handleSegmentChange = async (segmentId) => {
    console.log('🔍 Segment Change - Starting with segmentId:', segmentId);
    setSelectedSegment(segmentId);
    setCampaign(prev => ({
      ...prev,
      segment_id: segmentId
    }));

    // If no segment selected, just return without showing error
    if (!segmentId) {
      return;
    }

    // Prefetch segment contacts
    try {
      // First get the segment details to get its conditions
      const { data: segmentData, error: segmentError } = await supabase
        .from('audience_segments')
        .select('*')
        .eq('id', segmentId)
        .single();

      if (segmentError) {
        console.error('❌ Error fetching segment:', segmentError);
        throw segmentError;
      }

      console.log('📥 Fetching contacts for segment:', segmentId);
      
      // Start building the query
      const { data: segmentContacts, error: contactsError } = await supabase
        .from('segment_contacts')
        .select(`
          contact_id,
          contacts (
            id,
            firstname,
            lastname,
            email,
            phone_number,
            workspace_id,
            name,
            lead_status,
            lead_status_id,
            conversation_status,
            market,
            product,
            opt_in_through
          )
        `)
        .eq('segment_id', segmentId);

      if (contactsError) {
        console.error('❌ Error fetching segment contacts:', contactsError);
        throw contactsError;
      }

      // Extract valid contacts and remove any null values
      const validContacts = segmentContacts
        ?.filter(sc => sc.contacts && sc.contact_id)
        ?.map(sc => ({
          ...sc.contacts,
          segment_contact_id: sc.contact_id
        }))
        ?.filter(Boolean) || [];

      console.log('Processed contacts:', {
        raw: segmentContacts,
        valid: validContacts,
        count: validContacts.length
      });

      // If no contacts found, show a message
      if (validContacts.length === 0) {
        console.log('⚠️ No valid contacts found in segment');
        toast({
          title: 'No Contacts Found',
          description: 'This segment currently has no contacts. Please add contacts to the segment before creating a campaign.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setSegmentContactsCache(prev => ({
          ...prev,
          [segmentId]: []
        }));
        return;
      }

      // Cache the valid contacts for this segment
      setSegmentContactsCache(prev => ({
        ...prev,
        [segmentId]: validContacts
      }));

    } catch (error) {
      console.error('❌ Error in handleSegmentChange:', error);
      toast({
        title: 'Error loading segment contacts',
        description: error.message || 'Failed to load contacts for the selected segment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add state for caching segment contacts
  const [segmentContactsCache, setSegmentContactsCache] = useState({});

  // Add state for manually selected contacts
  const [manuallySelectedContacts, setManuallySelectedContacts] = useState([]);

  // Handle manually selected contacts
  const handleContactsSelected = (contacts) => {
    console.log('Manually selected contacts:', contacts);
    setManuallySelectedContacts(prev => {
      // Combine existing and new contacts, removing duplicates
      const combined = [...prev, ...contacts];
      return Array.from(new Map(combined.map(c => [c.id, c])).values());
    });
  };

  // Add handleReset function
  const handleReset = useCallback(() => {
    // Reset all state to initial values
    setCampaign({
      name: '',
      workspace_id: workspaceId,
      board_id: boardId,
      status: 'draft',
      description: '',
      segment_id: null
    });
    setSelectedSegment(null);
    setNodes([{
      type: 'sms',
      message: '',
      send_time: '09:00',
      sequence_order: 1,
      day: 1
    }]);
    setActiveStep(0);
    setSegmentContactsCache({});
    setManuallySelectedContacts([]);
  }, [workspaceId, boardId]);

  const handleNext = () => {
    if (activeStep === 0) {
      console.log('Validating campaign setup:', { 
        name: campaign.name, 
        segment_id: campaign.segment_id,
        selectedSegment,
        manuallySelectedContacts: manuallySelectedContacts.length
      });
      // Validate campaign setup
      if (!campaign.name?.trim()) {
        toast({
          title: 'Missing information',
          description: 'Please enter a campaign name.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Validate that either a segment is selected OR contacts are manually selected
      if (!campaign.segment_id && manuallySelectedContacts.length === 0) {
        toast({
          title: 'Missing contacts',
          description: 'Please select a target segment or add contacts manually for your campaign.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    } else if (activeStep === 1) {
      // Validate nodes
      const MIN_MESSAGE_LENGTH = 10; // Minimum characters for a meaningful message
      
      // Check for empty messages
      const emptyNodes = nodes.filter((node) => !node.message?.trim());
      if (emptyNodes.length > 0) {
        toast({
          title: 'Missing content',
          description: `Please add content to all messages.`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Check for messages that are too short
      const shortNodes = nodes.filter((node) => node.message?.trim()?.length < MIN_MESSAGE_LENGTH);
      if (shortNodes.length > 0) {
        toast({
          title: 'Message too short',
          description: `One or more messages are too short. Messages should be at least ${MIN_MESSAGE_LENGTH} characters long to be effective.`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevious = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleLaunch = async () => {
    try {
      setIsLoading(true);
      
      // Combine segment contacts and manually selected contacts
      const segmentContacts = selectedSegment ? (segmentContactsCache[selectedSegment] || []) : [];
      const allContacts = [...segmentContacts, ...manuallySelectedContacts];
      
      // Remove duplicates by contact ID
      const uniqueContacts = Array.from(new Map(allContacts.map(c => [c.id, c])).values());
      
      if (uniqueContacts.length === 0) {
        throw new Error('No contacts available for this campaign. Please add contacts or select a segment.');
      }
      
      console.log('Launching campaign with contacts:', {
        segmentContactsCount: segmentContacts.length,
        manualContactsCount: manuallySelectedContacts.length,
        uniqueContactsCount: uniqueContacts.length,
        isExistingCampaign: !!campaign.id
      });
      
      // Generate a 4-digit random number for unique campaign ID (only for new campaigns)
      const uniqueId = Math.floor(Math.random() * 9000) + 1000;
      
      // Create a clean copy of the campaign object without window references
      // Use a more explicit approach to avoid circular references
      const campaignToLaunch = {
        // Preserve the original ID if it exists (for updates)
        ...(campaign.id && { id: campaign.id }),
        // Keep the original name for existing campaigns, only append uniqueId for new ones
        name: campaign.id ? campaign.name : `${campaign.name} (${uniqueId})`,
        workspace_id: campaign.workspace_id,
        board_id: campaign.board_id,
        status: campaign.status || 'draft',
        description: campaign.description || '',
        segment_id: campaign.segment_id, // Can be null now
        settings: {
          active_days: Array.isArray(campaign.settings?.active_days) 
            ? [...campaign.settings.active_days] 
            : [],
          time_window: {
            start: campaign.settings?.time_window?.start || '09:00',
            end: campaign.settings?.time_window?.end || '17:00'
          }
        }
      };

      // Create clean copies of nodes without any potential circular references
      const cleanNodes = nodes.map(node => ({
        type: node.type || 'sms',
        message: node.message || '',
        send_time: node.send_time || '09:00',
        sequence_order: node.sequence_order || 1,
        day: node.day || 1,
        subject: node.subject || ''
      }));

      // Create clean copies of contacts to avoid circular references
      const cleanContacts = uniqueContacts.map(contact => ({
        id: contact.id,
        firstname: contact.firstname || '',
        lastname: contact.lastname || '',
        email: contact.email || '',
        phone_number: contact.phone_number || '',
        workspace_id: contact.workspace_id,
        lead_status_id: contact.lead_status_id,
        conversation_status: contact.conversation_status || 'Open',
        opt_in_through: contact.opt_in_through || 'manual'
      }));
      
      // If this is an existing campaign, we need to handle contacts differently
      // to avoid re-enrolling existing contacts
      const isExistingCampaign = !!campaign.id;
      
      const result = await launchCampaign(
        campaignToLaunch, 
        cleanNodes, 
        cleanContacts, 
        isExistingCampaign
      );
      
      if (result.error) {
        throw result.error;
      }

      // Show success message and confetti
      toast({
        title: campaign.id ? 'Campaign Updated! 🎉' : 'Campaign Launched! 🎉',
        description: campaign.id 
          ? `Successfully updated campaign with ${result.contactCount || 0} new contacts` 
          : `Successfully launched campaign with ${uniqueContacts.length} contacts`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Trigger confetti celebration!
      setShowConfetti(true);
      
      // Reset the builder after a short delay to allow confetti to be seen
      setTimeout(() => {
        handleReset();
        setShowBuilder(false);
      }, 2500);
      
    } catch (error) {
      console.error('Error launching campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to launch campaign',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Create a clean copy of the campaign object without window references
      // Use a more explicit approach to avoid circular references
      const cleanCampaign = {
        // Preserve the original ID if it exists (for updates)
        ...(campaign.id && { id: campaign.id }),
        // Keep the original name for existing campaigns, only append timestamp for new ones
        name: campaign.id ? campaign.name : `${campaign.name} (${new Date().getTime()})`,
        workspace_id: campaign.workspace_id,
        board_id: campaign.board_id,
        status: campaign.status || 'draft',
        description: campaign.description || '',
        segment_id: campaign.segment_id, // Can be null now
        settings: {
          active_days: Array.isArray(campaign.settings?.active_days) 
            ? [...campaign.settings.active_days] 
            : [],
          time_window: {
            start: campaign.settings?.time_window?.start || '09:00',
            end: campaign.settings?.time_window?.end || '17:00'
          }
        }
      };
      
      // Create clean copies of nodes without any potential circular references
      const cleanNodes = nodes.map(node => ({
        type: node.type || 'sms',
        message: node.message || '',
        send_time: node.send_time || '09:00',
        sequence_order: node.sequence_order || 1,
        day: node.day || 1,
        subject: node.subject || ''
      }));
      
      const savedCampaign = await saveCampaign(cleanCampaign, cleanNodes);
      
      if (savedCampaign) {
        toast({
          title: campaign.id ? 'Campaign Updated' : 'Campaign Saved',
          description: campaign.id ? 'Your campaign has been updated.' : 'Your campaign has been saved as a draft.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      return savedCampaign;
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error saving campaign',
        description: error.message || 'An error occurred while saving your campaign.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [campaign, nodes, saveCampaign, toast]);

  // Add this function after the handleSegmentChange function
  const fetchCampaignContacts = async (campaignId) => {
    if (!campaignId) return;
    
    console.log('🔍 Fetching contacts for existing campaign:', campaignId);
    
    try {
      // Fetch contacts from campaign_contact_status table
      const { data, error } = await supabase
        .from('campaign_contact_status')
        .select(`
          contact_id,
          contacts (
            id,
            firstname,
            lastname,
            email,
            phone_number,
            workspace_id,
            lead_status,
            lead_status_id,
            conversation_status,
            market,
            product,
            opt_in_through
          )
        `)
        .eq('campaign_id', campaignId);
      
      if (error) {
        console.error('❌ Error fetching campaign contacts:', error);
        throw error;
      }
      
      // Extract valid contacts and remove any null values
      const validContacts = data
        ?.filter(cs => cs.contacts && cs.contact_id)
        ?.map(cs => cs.contacts)
        ?.filter(Boolean) || [];
      
      console.log('📥 Fetched campaign contacts:', {
        count: validContacts.length,
        sample: validContacts.slice(0, 2)
      });
      
      // Set the manually selected contacts
      setManuallySelectedContacts(validContacts);
      
    } catch (error) {
      console.error('❌ Error in fetchCampaignContacts:', error);
      toast({
        title: 'Error loading campaign contacts',
        description: error.message || 'Failed to load contacts for this campaign. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <CampaignSetup
            campaign={campaign}
            onCampaignChange={handleCampaignChange}
            selectedSegment={selectedSegment}
            onSegmentChange={handleSegmentChange}
            workspaceId={workspaceId}
            boardId={boardId}
            onContactsSelected={handleContactsSelected}
            selectedContacts={manuallySelectedContacts}
          />
        );
      case 1:
        return (
          <Box w="100%">
            <VStack spacing={6} align="stretch" w="100%">
              {nodes.map((node, index) => (
                <CampaignNode
                  key={index}
                  node={node}
                  onChange={(updatedNode) => handleNodeChange(index, updatedNode)}
                  onDelete={() => handleDeleteNode(index)}
                />
              ))}
              <Button
                leftIcon={<AddIcon />}
                colorScheme="purple"
                variant="outline"
                onClick={handleAddNode}
                alignSelf="center"
                mt={4}
              >
                Add Message
              </Button>
            </VStack>
          </Box>
        );
      case 2:
        return (
          <CampaignReview 
            campaign={campaign} 
            nodes={nodes} 
            selectedSegment={selectedSegment}
          />
        );
      default:
        return null;
    }
  };

  // Render ActiveCampaigns if not showing builder
  if (!showBuilder) {
    return <ActiveCampaigns 
      workspaceId={workspaceId} 
      boardId={boardId} 
      boardTitle={boardTitle} 
      onCreateNew={(existingCampaign, existingNodes) => {
        // If we have an existing campaign, set it up for editing
        if (existingCampaign) {
          setCampaign(existingCampaign);
          setSelectedSegment(existingCampaign.segment_id);
          
          // If we have existing nodes, use them
          if (existingNodes && existingNodes.length > 0) {
            setNodes(existingNodes);
          }
          
          // Fetch campaign contacts for editing
          fetchCampaignContacts(existingCampaign.id);
        }
        
        // Show the builder
        setShowBuilder(true);
      }} 
    />;
  }

  // Otherwise render the campaign builder
  return (
    <Container maxW="container.xl" py={8}>
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={800}
          gravity={0.15}
          colors={confettiColors}
          tweenDuration={6000}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 9999,
            pointerEvents: 'none' // Make sure confetti doesn't block interactions
          }}
        />
      )}
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" w="100%">
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label="Back to campaigns"
            variant="outline"
            colorScheme="purple"
            onClick={() => setShowBuilder(false)}
            size="md"
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
          />
          <StepperComponent
            steps={CAMPAIGN_STEPS}
            activeStep={activeStep}
          />
          <Box w="40px" /> {/* Empty box for alignment */}
        </Flex>
        <Box
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg={boxBg}
          boxShadow="md"
        >
          {renderStep()}
        </Box>
        <HStack spacing={4} justify="flex-end">
          {activeStep > 0 && (
            <Button
              onClick={handlePrevious}
              variant="outline"
              colorScheme="purple"
              isDisabled={isLoading}
              _hover={{ bg: buttonHoverBg }}
            >
              Previous
            </Button>
          )}
          {activeStep < CAMPAIGN_STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              colorScheme="purple"
              isDisabled={isLoading}
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                colorScheme="purple"
                variant="outline"
                isLoading={isLoading && !isEnrolling}
                loadingText="Saving"
                _hover={{ bg: buttonHoverBg }}
              >
                Save Draft
              </Button>
              <Button
                onClick={handleLaunch}
                colorScheme="purple"
                isLoading={isLoading && isEnrolling}
                loadingText="Launching"
              >
                Launch Campaign
              </Button>
            </>
          )}
        </HStack>
      </VStack>
    </Container>
  );
};

export default CampaignBuilder;
