import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import DockContainer from './dock/DockContainer';
import LiveChat from './livechat/livechat';
import ContactsPageV2 from './contactV2/ContactsPageV2';
import { DraggableWindow } from './window/DraggableWindow';
import { Pipeline } from './pipelines/Pipeline';
import { CalendarContainer } from './calendar/CalendarContainer';
import { RewardsWindow } from './windows/RewardsWindow';
import NotesWindow from './notes/NotesWindow';
import AnalyticsWindow from './analytics/AnalyticsWindow';
import BoardWindow from './board/BoardWindow';
import FlowBuilderWindow from './windows/FlowBuilderWindow';
import { ToolsWindow } from './windows/ToolsWindow';
import PhoneWindow from './windows/PhoneWindow';
import BroadcastManager from './broadcast/BroadcastManager';
import Broadcast2 from './broadcast2/Broadcast2';
import { SettingsWindow } from './windows/SettingsWindow';
import NotificationCenter from './notification-center/NotificationCenter';

const MainLayout = () => {
  const [activeWindows, setActiveWindows] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  const handleDockItemClick = (itemId) => {
    if (!activeWindows.includes(itemId)) {
      setActiveWindows([...activeWindows, itemId]);
    }
  };

  const handleWindowClose = (itemId) => {
    setActiveWindows(activeWindows.filter(id => id !== itemId));
  };

  const renderWindow = (item) => {
    switch (item) {
      case 'livechat':
        return (
          <LiveChat 
            key="livechat"
            onClose={() => handleWindowClose('livechat')}
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
                if (!activeWindows.includes('livechat')) {
                  setActiveWindows([...activeWindows, 'livechat']);
                }
              }}
            />
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
            <Pipeline />
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
          <BoardWindow onClose={() => handleWindowClose('board')} />
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
            title="Campaign Manager"
            onClose={() => handleWindowClose('campaign-manager')}
            defaultSize={{ width: 1200, height: 800 }}
            minSize={{ width: 900, height: 600 }}
          >
            <Broadcast2 onClose={() => handleWindowClose('campaign-manager')} />
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
      default:
        return null;
    }
  };

  return (
    <Box position="relative" h="100vh" overflow="hidden">
      {/* Render active windows */}
      {activeWindows.map(renderWindow)}
      
      {/* Dock */}
      <DockContainer onItemClick={handleDockItemClick} activeItem={activeWindows} />
    </Box>
  );
};

export default MainLayout; 