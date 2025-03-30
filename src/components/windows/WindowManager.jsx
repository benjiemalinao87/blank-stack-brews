
import React from "react";
import { Box } from "@chakra-ui/react";
import PhoneWindow from "./PhoneWindow";
import { AutomationWindow } from "./AutomationWindow";
import { ToolsWindow } from "./ToolsWindow";

export const WindowManager = ({ activeWindow, onClose }) => {
  const getWindowContent = () => {
    switch (activeWindow) {
      case "phone":
        return <PhoneWindow onClose={onClose} />;
      case "automation":
        return <AutomationWindow onClose={onClose} />;
      case "tools":
        return <ToolsWindow onClose={onClose} />;
      default:
        return null;
    }
  };

  if (!activeWindow) return null;

  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} pointerEvents="none">
      <Box 
        width="1000px" 
        height="600px" 
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        pointerEvents="auto"
      >
        <Box 
          w="100%" 
          h="100%" 
          bg="rgba(255, 255, 255, 0.95)" 
          borderRadius="lg" 
          boxShadow="lg" 
          overflow="hidden" 
          color="gray.800"
        >
          {getWindowContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default WindowManager;
