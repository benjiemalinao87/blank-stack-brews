import React from 'react';
import { Box } from '@chakra-ui/react';
import { Dock } from './Dock';
import AppLauncher from './AppLauncher';
import { motion, AnimatePresence } from 'framer-motion';
import { useDock } from '../../contexts/DockContext';

const DockContainer = ({ onItemClick, activeItem }) => {
  const { isMinimized, toggleMinimized } = useDock();

  const handleAppLauncherClick = (itemId) => {
    onItemClick(itemId);
  };

  return (
    <>
      {/* App Launcher (visible when dock is minimized) */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              position="fixed"
              top="4"
              left="4"
              zIndex={1000}
            >
              <AppLauncher 
                onItemClick={handleAppLauncherClick} 
                onExpandDock={toggleMinimized}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regular Dock */}
      <Dock 
        onItemClick={onItemClick} 
        activeItem={activeItem} 
      />
    </>
  );
};

export default DockContainer;
