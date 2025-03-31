
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { WorkspaceProvider } from './contexts/WorkspaceContext.jsx';
import { DockProvider } from './contexts/DockContext.jsx';
import { WindowProvider } from './contexts/WindowContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { StatusProvider } from './contexts/StatusContext.jsx';
import { TwilioProvider } from './contexts/TwilioContext.jsx';
import AppRoutes from './AppRoutes';
import NotificationCenter from './components/notification-center/NotificationCenter.jsx';
import theme from './theme';

const App = () => {
  return (
    <Router>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <WorkspaceProvider>
            <DockProvider>
              <WindowProvider>
                <NotificationProvider>
                  <StatusProvider>
                    <TwilioProvider>
                      <AppRoutes />
                      <NotificationCenter />
                    </TwilioProvider>
                  </StatusProvider>
                </NotificationProvider>
              </WindowProvider>
            </DockProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ChakraProvider>
    </Router>
  );
};

export default App;
