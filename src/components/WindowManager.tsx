import React from "react";
import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { LiveChat } from "./livechat/LiveChat";
import { Contact } from "./windows/Contact";
import { Automation } from "./windows/Automation";
import { Tools } from "./windows/Tools";
import { Settings } from "./windows/Settings";
interface WindowManagerProps {
  activeWindow: string | null;
  onClose: () => void;
}
export const WindowManager: React.FC<WindowManagerProps> = ({
  activeWindow,
  onClose
}) => {
  const getWindowContent = () => {
    switch (activeWindow) {
      case "livechat":
        return <LiveChat onClose={onClose} />;
      case "contact":
        return <Contact onClose={onClose} />;
      case "automation":
        return <Automation onClose={onClose} />;
      case "tools":
        return <Tools onClose={onClose} />;
      case "settings":
        return <Settings onClose={onClose} />;
      default:
        return null;
    }
  };
  if (!activeWindow) return null;
  return <Box position="fixed" top={0} left={0} right={0} bottom={0} pointerEvents="none">
      <motion.div drag dragMomentum={false} initial={{
      x: window.innerWidth / 2 - 400,
      y: window.innerHeight / 2 - 300
    }} style={{
      width: 1000,
      height: 600,
      position: "absolute",
      pointerEvents: "auto"
    }}>
        <Box w="100%" h="100%" bg="rgba(255, 255, 255, 0.95)" backdropFilter="blur(10px)" borderRadius="lg" boxShadow="lg" overflow="hidden" color="gray.800">
          {getWindowContent()}
        </Box>
      </motion.div>
    </Box>;
};