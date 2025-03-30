import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext.jsx';
import NotificationCenter from './NotificationCenter';

/**
 * This is an example of how to integrate the NotificationCenter with your App component.
 * 
 * Note: This is just an example and should not be used directly.
 * Instead, add the NotificationProvider to your existing App component
 * and add the NotificationCenter component at the end of your App component.
 */
const AppIntegrationExample = () => {
  return (
    <ChakraProvider>
      <NotificationProvider>
        <Router>
          {/* Your existing app structure */}
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/about" element={<div>About Page</div>} />
            {/* Other routes */}
          </Routes>
          
          {/* Add the NotificationCenter at the end of your App component */}
          <NotificationCenter />
        </Router>
      </NotificationProvider>
    </ChakraProvider>
  );
};

/**
 * Example of how to use the notification system in a component
 */
const ExampleComponent = () => {
  const { addNotification } = useNotification();
  
  const handleButtonClick = () => {
    // Add a notification when a button is clicked
    addNotification({
      title: 'Button Clicked',
      message: 'You clicked the button!',
      type: 'info',
    });
  };
  
  return (
    <div>
      <button onClick={handleButtonClick}>Click Me</button>
    </div>
  );
};

export default AppIntegrationExample; 