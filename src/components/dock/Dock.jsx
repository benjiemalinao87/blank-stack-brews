import React, { useState } from 'react';
import { HStack, Box, IconButton, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { MessageCircle, Users, GitBranch, Calendar, Phone, Wrench, Settings, Trophy, BarChart2, Layout, Share2, ChevronUp, ChevronDown, Megaphone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileIcon from '../profile/ProfileIcon';
import { FiBook } from 'react-icons/fi';
import NotesWindow from '../notes/NotesWindow';
import { useDock } from '../../contexts/DockContext';

const DockIcon = ({ icon: Icon, label, onClick, isActive, isHighlighted }) => {
  const [isHovered, setIsHovered] = useState(false);
  const bgColor = useColorModeValue('whiteAlpha.900', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('blue.50', 'blue.900');

  return (
    <Tooltip label={label} placement="top" hasArrow>
      <Box>
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: 'inline-block' }}
        >
          <IconButton
            icon={<Icon size={24} />}
            aria-label={label}
            variant="ghost"
            size="lg"
            rounded="xl"
            bg={isActive ? bgColor : isHighlighted ? highlightColor : 'transparent'}
            border={isActive ? '1px solid' : 'none'}
            borderColor={borderColor}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            _hover={{
              bg: bgColor,
              transform: 'translateY(-5px)',
              transition: 'all 0.2s',
            }}
            sx={{
              '&:hover + .dock-icon': {
                transform: 'scale(1.1)',
              },
            }}
          />
        </motion.div>
      </Box>
    </Tooltip>
  );
};

export const Dock = ({ onItemClick, activeItem = [] }) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const { isMinimized, toggleMinimized } = useDock();
  const bgColor = useColorModeValue('whiteAlpha.800', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              position="fixed"
              bottom="4"
              left="50%"
              transform="translateX(-50%)"
              bg={bgColor}
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              p={2}
              boxShadow="lg"
              zIndex={1000}
            >
              <HStack spacing={2}>
                <DockIcon
                  icon={MessageCircle}
                  label="Livechat"
                  onClick={() => onItemClick('livechat')}
                  isActive={activeItem.includes('livechat')}
                />
                <DockIcon
                  icon={Layout}
                  label="Board"
                  onClick={() => onItemClick('board')}
                  isActive={activeItem.includes('board')}
                />
                <DockIcon
                  icon={Users}
                  label="Contacts"
                  onClick={() => onItemClick('contacts')}
                  isActive={activeItem.includes('contacts')}
                  isHighlighted={true}
                />
                <DockIcon
                  icon={GitBranch}
                  label="Pipelines"
                  onClick={() => onItemClick('pipelines')}
                  isActive={activeItem.includes('pipelines')}
                />
                <DockIcon
                  icon={Calendar}
                  label="Calendar"
                  onClick={() => onItemClick('calendar')}
                  isActive={activeItem.includes('calendar')}
                />
                <DockIcon
                  icon={Share2}
                  label="Flow Builder"
                  onClick={() => onItemClick('flowbuilder')}
                  isActive={activeItem.includes('flowbuilder')}
                />
                <DockIcon
                  icon={Phone}
                  label="Phone"
                  onClick={() => onItemClick('phone')}
                  isActive={activeItem.includes('phone')}
                />
                <DockIcon
                  icon={Trophy}
                  label="Rewards"
                  onClick={() => onItemClick('rewards')}
                  isActive={activeItem.includes('rewards')}
                />
                <DockIcon
                  icon={FiBook}
                  label="Notes"
                  onClick={() => onItemClick('notes')}
                  isActive={activeItem.includes('notes')}
                />
                <DockIcon
                  icon={BarChart2}
                  label="Analytics"
                  onClick={() => onItemClick('analytics')}
                  isActive={activeItem.includes('analytics')}
                />
                <DockIcon
                  icon={Wrench}
                  label="Tools"
                  onClick={() => onItemClick('tools')}
                  isActive={activeItem.includes('tools')}
                />
                <DockIcon
                  icon={Megaphone}
                  label="Broadcast"
                  onClick={() => onItemClick('broadcast')}
                  isActive={activeItem.includes('broadcast')}
                />
                <DockIcon
                  icon={Mail}
                  label="Campaign Manager"
                  onClick={() => onItemClick('campaign-manager')}
                  isActive={activeItem.includes('campaign-manager')}
                />
                <DockIcon
                  icon={Settings}
                  label="Settings"
                  onClick={() => onItemClick('settings')}
                  isActive={activeItem.includes('settings')}
                />
                <ProfileIcon />
                <Tooltip label={isMinimized ? "Expand Dock" : "Minimize Dock"} placement="top" hasArrow>
                  <IconButton
                    icon={isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    size="sm"
                    variant="ghost"
                    onClick={toggleMinimized}
                    aria-label={isMinimized ? "Expand Dock" : "Minimize Dock"}
                  />
                </Tooltip>
              </HStack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {isNotesOpen && (
        <NotesWindow onClose={() => setIsNotesOpen(false)} />
      )}
    </>
  );
};
