import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Button,
  Flex,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import CampaignDashboard from './CampaignDashboard';
import CampaignAnalytics from './CampaignAnalytics';
import TemplateLibrary from './TemplateLibrary';
import SequenceBuilder from './SequenceBuilder';

/**
 * Broadcast 2.0 - Advanced Campaign & Sequence Builder
 * 
 * This is a completely isolated implementation that builds upon the
 * lessons learned from the original broadcast feature, providing more
 * advanced functionality like multi-day sequences, templates, and
 * detailed analytics.
 */
const Broadcast2 = ({ onOpenWindow }) => {
  const { currentWorkspace } = useWorkspace();
  const [tabIndex, setTabIndex] = useState(0);
  const [currentView, setCurrentView] = useState('dashboard');
  const [campaignId, setCampaignId] = useState(null);
  const [isNewCampaign, setIsNewCampaign] = useState(false);
  
  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const headerBg = useColorModeValue('white', 'gray.800');
  
  // Handlers for view changes within the same window
  const handleNewCampaign = () => {
    setCurrentView('sequence-builder');
    setCampaignId(null);
    setIsNewCampaign(true);
  };
  
  const handleEditCampaign = (id) => {
    setCurrentView('sequence-builder');
    setCampaignId(id);
    setIsNewCampaign(false);
  };
  
  const handleViewCampaign = (id) => {
    setCurrentView('campaign-analytics');
    setCampaignId(id);
  };
  
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCampaignId(null);
    setIsNewCampaign(false);
  };
  
  // Render appropriate content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'sequence-builder':
        return (
          <Box height="100%" display="flex" flexDirection="column">
            <Flex 
              p={4} 
              borderBottomWidth="1px" 
              borderColor={borderColor}
              alignItems="center"
              bg={headerBg}
            >
              <Button 
                leftIcon={<ChevronLeftIcon />} 
                variant="ghost" 
                onClick={handleBackToDashboard}
                mr={4}
              >
                Back to Campaigns
              </Button>
              <Heading size="md">
                {isNewCampaign ? 'Create New Campaign' : 'Edit Campaign'}
              </Heading>
            </Flex>
            <Box flex="1" overflow="auto">
              <SequenceBuilder 
                campaignId={campaignId} 
                isNew={isNewCampaign} 
                onClose={handleBackToDashboard}
                workspaceId={currentWorkspace?.id}
              />
            </Box>
          </Box>
        );
        
      case 'campaign-analytics':
        return (
          <Box height="100%" display="flex" flexDirection="column">
            <Flex 
              p={4} 
              borderBottomWidth="1px" 
              borderColor={borderColor}
              alignItems="center"
              bg={headerBg}
            >
              <Button 
                leftIcon={<ChevronLeftIcon />} 
                variant="ghost" 
                onClick={handleBackToDashboard}
                mr={4}
              >
                Back to Campaigns
              </Button>
              <Heading size="md">Campaign Analytics</Heading>
            </Flex>
            <Box flex="1" overflow="auto">
              <CampaignAnalytics 
                campaignId={campaignId}
                onClose={handleBackToDashboard}
                workspaceId={currentWorkspace?.id}
              />
            </Box>
          </Box>
        );
        
      case 'dashboard':
      default:
        return (
          <Tabs 
            flex="1"
            display="flex" 
            flexDirection="column"
            variant="enclosed"
            colorScheme="purple"
            index={tabIndex}
            onChange={setTabIndex}
            height="100%"
          >
            <TabList px={6} pt={2}>
              <Tab>Campaigns</Tab>
              <Tab>Templates</Tab>
              <Tab>Analytics</Tab>
              <Tab>Settings</Tab>
            </TabList>
            
            <TabPanels flex="1" overflow="auto">
              <TabPanel p={0} height="100%">
                <CampaignDashboard 
                  workspaceId={currentWorkspace?.id}
                  onNewCampaign={handleNewCampaign}
                  onEditCampaign={handleEditCampaign}
                  onViewCampaign={handleViewCampaign}
                />
              </TabPanel>
              <TabPanel p={0} height="100%">
                <TemplateLibrary workspaceId={currentWorkspace?.id} />
              </TabPanel>
              <TabPanel p={0} height="100%">
                <CampaignAnalytics workspaceId={currentWorkspace?.id} />
              </TabPanel>
              <TabPanel>
                <VStack align="stretch" spacing={6} p={6}>
                  <Text>Campaign Settings (Coming Soon)</Text>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        );
    }
  };
  
  return (
    <Box height="100%" width="100%">
      {renderContent()}
    </Box>
  );
};

export default Broadcast2; 