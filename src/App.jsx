
import React from 'react';
import { ChakraProvider, createConfig } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";

// Create Chakra UI config with theme (for v3)
const config = createConfig({
  theme: {
    colors: {
      brand: {
        50: '#e6f7ff',
        100: '#b3e0ff',
        500: '#0080ff',
        600: '#0066cc',
        700: '#004d99',
      },
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
  }
});

const App = () => {
  return (
    <ChakraProvider config={config}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
};

export default App;
