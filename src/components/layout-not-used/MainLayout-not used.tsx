import React, { useState } from 'react';
import { Box, IconButton, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { Dock } from '../Dock';
import { LiveChatWindow } from '../windows/LiveChatWindow';
import { ContactWindow } from '../windows/ContactWindow';
import { AutomationWindow } from '../windows/AutomationWindow';
import { ToolsWindow } from '../windows/ToolsWindow';
import { SettingsWindow } from '../windows/SettingsWindow';
import { Rocket } from 'lucide-react';
import FeatureRequestSidebar from '../feature-request/FeatureRequestSidebar';

export function MainLayout() {
  const [activeWindow, setActiveWindow] = useState<string | null>('livechat');
  const [isFeatureRequestOpen, setIsFeatureRequestOpen] = useState(false);
  const bgColor = useColorModeValue('whiteAlpha.900', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const renderWindow = () => {
    switch (activeWindow) {
      case 'livechat':
        return <LiveChatWindow />;
      case 'contact':
        return <ContactWindow />;
      case 'automation':
        return <AutomationWindow />;
      case 'tools':
        return <ToolsWindow />;
      case 'settings':
        return <SettingsWindow />;
      default:
        return null;
    }
  };

  return (
    <Box
      minH="100vh"
      width="100%"
      position="relative"
      zIndex={1}
    >
      {/* Active Window */}
      <Box position="relative" zIndex={1}>
        {renderWindow()}
      </Box>

      {/* Dock */}
      <Box position="relative" zIndex={1}>
        <Dock activeWindow={activeWindow} onWindowChange={setActiveWindow} />
      </Box>
      
      {/* Feature Request Button */}
      <Tooltip label="Feature Request" placement="left" hasArrow>
        <IconButton
          icon={<Rocket size={20} />}
          aria-label="Feature Request"
          position="fixed"
          right="6"
          top="50%"
          transform="translateY(-50%)"
          borderRadius="full"
          size="lg"
          colorScheme="blue"
          boxShadow="lg"
          onClick={() => setIsFeatureRequestOpen(!isFeatureRequestOpen)}
          zIndex={900}
          isActive={isFeatureRequestOpen}
        />
      </Tooltip>
      
      {/* Feature Request Sidebar */}
      {isFeatureRequestOpen && (
        <Box
          position="fixed"
          right="24"
          top="50%"
          transform="translateY(-50%)"
          width="300px"
          zIndex={900}
        >
          <FeatureRequestSidebar onClose={() => setIsFeatureRequestOpen(false)} />
        </Box>
      )}
    </Box>
  );
}
