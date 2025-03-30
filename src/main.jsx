
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import MainLayout from './components/MainLayout.jsx';
import theme from './theme';
import './index.css';

// This is the main entry point for Vite
// It renders MainLayout.jsx as the root component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <MainLayout />
    </ChakraProvider>
  </React.StrictMode>
);
