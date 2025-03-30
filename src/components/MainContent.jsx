import React, { useState, useEffect } from 'react';
import { Box, IconButton, Center, Text, Spinner, useColorMode } from '@chakra-ui/react';
import { Moon, Sun } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { notificationUtils } from '../components/notification-center';
import LiveChat from './livechat/livechat';
import DockContainer from './dock/DockContainer';
import { DraggableWindow } from './window/DraggableWindow';
import { Pipeline } from './pipelines/Pipeline';
import { CalendarContainer } from './calendar/CalendarContainer';
import { RewardsWindow } from './windows/RewardsWindow.jsx';
import { SettingsWindow } from './windows/SettingsWindow.jsx';
import NotesWindow from './notes/NotesWindow.jsx';
import AnalyticsWindow from './analytics/AnalyticsWindow.jsx';
import BoardWindow from './board/BoardWindow.jsx';
import FlowBuilderWindow from './windows/FlowBuilderWindow.jsx';
import { ToolsWindow } from './windows/ToolsWindow.jsx';
import PhoneWindow from './windows/PhoneWindow.jsx';
import { BroadcastManager } from './broadcast';
import Broadcast2 from './broadcast2/Broadcast2';
import FeatureRequestButton from './feature-request/FeatureRequestButton';
import ContactsPageV2 from './contactV2/ContactsPageV2.jsx';
import InboundLeadManagement from './inbound-lead-management';
import { testSupabaseConnection } from '../test/supabase-connection';
import { pingSupabase } from '../test/ping-test';

// Placeholder components for other sections
const PlaceholderView = ({ title }) => (
  <Center h="100%">
    <Text fontSize="2xl">{title} View - Coming Soon</Text>
  </Center>
);

/**
 * MainContent Component
 * 
 * Primary application UI with dock and windows.
 * Entry point for the main application.
 */
const MainContent = () => {
  const { user } = useAuth();
  const { isOnboardingComplete, loading: onboardingLoading } = useOnboarding();
  const { colorMode, toggleColorMode } = useColorMode();
  const [activeWindows, setActiveWindows] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [showInboundLeadManagement, setShowInboundLeadManagement] = useState(true);
  const isDark = colorMode === 'dark';
  const location = useLocation();
  const { addNotification } = useNotification();

  // Function to add a test notification
  const addTestNotification = () => {
    addNotification(
      notificationUtils.createInfoNotification({
        title: 'Test Notification',
        message: 'This is a test notification to demonstrate the notification center.',
        source: 'System',
      })
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.openLiveChat = (contact) => {
        setSelectedContact(contact);
        setIsLiveChatOpen(true);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.openLiveChat;
      }
    };
  }, []);

  useEffect(() => {
    // Test basic connectivity first
    pingSupabase().then(success => {
      if (success) {
        // Only proceed with other tests if basic connectivity works
        testSupabaseConnection().then(success => {
          if (success) {
            // Connection successful
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    // Handle URL-based navigation for campaign components
    const path = location.pathname;
    
    // Check for broadcast2 paths to open campaign manager
    if (path.match(/\/broadcast2/) || path.match(/\/campaigns/)) {
      // Open the campaign manager window if not already open
      if (!activeWindows.includes('campaign-manager')) {
        setActiveWindows([...activeWindows, 'campaign-manager']);
      }
    }
  }, [location.pathname]);

  const handleWindowClose = (windowId) => {
    setActiveWindows(activeWindows.filter(id => id !== windowId));
  };

  const handleDockItemClick = (itemId) => {
    switch (itemId) {
      case 'livechat':
        if (!activeWindows.includes('livechat')) {
          setActiveWindows([...activeWindows, 'livechat']);
        }
        setIsLiveChatOpen(true);
        break;
      case 'contacts':
        if (!activeWindows.includes('contacts')) {
          setActiveWindows([...activeWindows, 'contacts']);
        }
        break;
      case 'settings':
        if (!activeWindows.includes('settings')) {
          setActiveWindows([...activeWindows, 'settings']);
        }
        break;
      case 'notes':
        if (!activeWindows.includes('notes')) {
          setActiveWindows([...activeWindows, 'notes']);
        }
        break;
      case 'analytics':
        if (!activeWindows.includes('analytics')) {
          setActiveWindows([...activeWindows, 'analytics']);
        }
        break;
      case 'board':
        if (!activeWindows.includes('board')) {
          setActiveWindows([...activeWindows, 'board']);
        }
        break;
      case 'flowbuilder':
        if (!activeWindows.includes('flowbuilder')) {
          setActiveWindows([...activeWindows, 'flowbuilder']);
        }
        break;
      case 'tools':
        if (!activeWindows.includes('tools')) {
          setActiveWindows([...activeWindows, 'tools']);
        }
        break;
      case 'phone':
        if (!activeWindows.includes('phone')) {
          setActiveWindows([...activeWindows, 'phone']);
        }
        break;
      case 'broadcast':
        if (!activeWindows.includes('broadcast')) {
          setActiveWindows([...activeWindows, 'broadcast']);
        }
        break;
      case 'campaign-manager':
        if (!activeWindows.includes('campaign-manager')) {
          setActiveWindows([...activeWindows, 'campaign-manager']);
        }
        break;
      default:
        if (!activeWindows.includes(itemId)) {
          setActiveWindows([...activeWindows, itemId]);
        }
    }
  };

  const renderWindow = (item) => {
    switch (item) {
      case 'livechat':
        return (
          <LiveChat 
            key="livechat" 
            isDark={isDark} 
            onClose={() => {
              setIsLiveChatOpen(false);
              handleWindowClose('livechat');
            }}
            selectedContact={selectedContact}
          />
        );
      case 'contacts':
        return (
          <DraggableWindow
            key="contacts"
            title="Contacts"
            onClose={() => handleWindowClose('contacts')}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 800, height: 500 }}
          >
            <ContactsPageV2 
              onClose={() => handleWindowClose('contacts')} 
              onOpenLiveChat={(contact) => {
                setSelectedContact(contact);
                setIsLiveChatOpen(true);
              }}
            />
          </DraggableWindow>
        );
      case 'settings':
        return (
          <DraggableWindow
            key="settings"
            title="Settings"
            onClose={() => handleWindowClose('settings')}
            defaultSize={{ width: 900, height: 600 }}
            minSize={{ width: 800, height: 500 }}
          >
            <SettingsWindow onClose={() => handleWindowClose('settings')} />
          </DraggableWindow>
        );
      case 'calendar':
        return (
          <DraggableWindow
            key="calendar"
            title="Calendar"
            onClose={() => handleWindowClose('calendar')}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 800, height: 500 }}
          >
            <CalendarContainer />
          </DraggableWindow>
        );
      case 'pipelines':
        return (
          <DraggableWindow
            key="pipelines"
            title="Pipeline"
            onClose={() => handleWindowClose('pipelines')}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 800, height: 500 }}
          >
            <Pipeline onOpenChat={(contact) => {
              if (!activeWindows.includes('livechat')) {
                setActiveWindows([...activeWindows, 'livechat']);
              }
              setSelectedContact(contact);
            }} />
          </DraggableWindow>
        );
      case 'rewards':
        return (
          <DraggableWindow
            key="rewards"
            title="Rewards"
            onClose={() => handleWindowClose('rewards')}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 800, height: 500 }}
          >
            <RewardsWindow onClose={() => handleWindowClose('rewards')} />
          </DraggableWindow>
        );
      case 'notes':
        return (
          <NotesWindow onClose={() => handleWindowClose('notes')} />
        );
      case 'analytics':
        return (
          <AnalyticsWindow onClose={() => handleWindowClose('analytics')} />
        );
      case 'board':
        return (
          <BoardWindow 
            boardData={{
              phoneNumber: null,
              id: 'board-1',
            }}
            onClose={() => handleWindowClose('board')} 
          />
        );
      case 'flowbuilder':
        return (
          <FlowBuilderWindow onClose={() => handleWindowClose('flowbuilder')} />
        );
      case 'tools':
        return (
          <DraggableWindow
            key="tools"
            title="Tools"
            onClose={() => handleWindowClose('tools')}
            defaultSize={{ width: 1200, height: 700 }}
            minSize={{ width: 900, height: 600 }}
          >
            <ToolsWindow />
          </DraggableWindow>
        );
      case 'phone':
        return (
          <DraggableWindow
            key="phone"
            title="Phone"
            onClose={() => handleWindowClose('phone')}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 800, height: 500 }}
          >
            <PhoneWindow onClose={() => handleWindowClose('phone')} />
          </DraggableWindow>
        );
      case 'broadcast':
        return (
          <DraggableWindow
            key="broadcast"
            title="Broadcast"
            onClose={() => handleWindowClose('broadcast')}
            defaultSize={{ width: 1100, height: 800 }}
            minSize={{ width: 800, height: 600 }}
          >
            <BroadcastManager />
          </DraggableWindow>
        );
      case 'campaign-manager':
        return (
          <DraggableWindow
            key="campaign-manager"
            title="Campaign Manager 2.0"
            onClose={() => handleWindowClose('campaign-manager')}
            defaultSize={{ width: 1200, height: 800 }}
            minSize={{ width: 900, height: 700 }}
          >
            <Broadcast2 />
          </DraggableWindow>
        );
      default:
        return (
          <DraggableWindow
            key={item}
            title={item}
            onClose={() => handleWindowClose(item)}
            defaultSize={{ width: 1000, height: 700 }}
            minSize={{ width: 800, height: 500 }}
          >
            <PlaceholderView title={item} />
          </DraggableWindow>
        );
    }
  };

  return (
    <Box position="relative" h="100vh" overflow="hidden">
      {/* Color mode toggle */}
      <IconButton
        aria-label="Toggle color mode"
        icon={isDark ? <Sun size={20} /> : <Moon size={20} />}
        onClick={toggleColorMode}
        position="absolute"
        top={4}
        right={4}
        zIndex={100}
        size="sm"
        variant="ghost"
      />

      {/* Inbound Lead Management */}
      {showInboundLeadManagement && (
        <InboundLeadManagement onClose={() => setShowInboundLeadManagement(false)} />
      )}

      {/* Feature Request Button */}
      <FeatureRequestButton
        setActiveWindows={setActiveWindows}
        activeWindows={activeWindows}
        setSelectedContact={setSelectedContact}
        setIsLiveChatOpen={setIsLiveChatOpen}
      />

      {/* Render active windows */}
      {activeWindows.map(renderWindow)}

      {/* Dock */}
      <DockContainer onItemClick={handleDockItemClick} activeItem={activeWindows} />
    </Box>
  );
};

export default MainContent; 