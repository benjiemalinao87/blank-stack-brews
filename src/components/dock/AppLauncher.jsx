import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  HStack,
  useColorModeValue,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { Search, Grid, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nodeTypes } from '../flow-builder/nodes';
import { MessageCircle, Users, GitBranch, Calendar, Phone, Wrench, Settings, Trophy, BarChart2, Layout, Share2, Megaphone, Mail } from 'lucide-react';
import { FiBook } from 'react-icons/fi';

// Map of app icons
const appIcons = {
  'livechat': MessageCircle,
  'board': Layout,
  'contacts': Users,
  'pipelines': GitBranch,
  'calendar': Calendar,
  'flowbuilder': Share2,
  'phone': Phone,
  'rewards': Trophy,
  'notes': FiBook,
  'analytics': BarChart2,
  'tools': Wrench,
  'settings': Settings,
  'broadcast': Megaphone,
  'campaign-manager': Mail,
};

// App data with labels and icons
const apps = [
  { id: 'livechat', label: 'LiveChat', icon: MessageCircle },
  { id: 'board', label: 'Board', icon: Layout },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'pipelines', label: 'Pipelines', icon: GitBranch },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'flowbuilder', label: 'Flow Builder', icon: Share2 },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'campaign-manager', label: 'Campaign Manager', icon: Mail },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
  { id: 'notes', label: 'Notes', icon: FiBook },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AppLauncher = ({ onItemClick, onExpandDock }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const launcherRef = useRef(null);
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const iconBg = useColorModeValue('blue.50', 'blue.900');
  
  // Filter apps based on search query
  const filteredApps = apps.filter(app => 
    app.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (launcherRef.current && !launcherRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleAppClick = (appId) => {
    onItemClick(appId);
    setIsOpen(false);
  };
  
  return (
    <Box ref={launcherRef} position="relative">
      <IconButton
        aria-label="App Launcher"
        icon={<Grid size={20} />}
        onClick={toggleDropdown}
        bg={bg}
        borderRadius="md"
        boxShadow="md"
        size="md"
        _hover={{ bg: hoverBg }}
      />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '50px',
              left: 0,
              zIndex: 1000,
              width: '300px',
            }}
          >
            <Box
              bg={bg}
              borderRadius="md"
              boxShadow="lg"
              border="1px solid"
              borderColor={borderColor}
              overflow="hidden"
            >
              <Box p={3} borderBottom="1px solid" borderColor={borderColor}>
                <HStack justify="space-between" mb={2}>
                  <Heading size="md">App Launcher</Heading>
                  <IconButton
                    icon={<X size={16} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                  />
                </HStack>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Search size={18} color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search apps and items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="md"
                  />
                </InputGroup>
              </Box>
              
              <Box p={3} maxH="400px" overflowY="auto">
                <Text fontWeight="bold" mb={2}>Apps</Text>
                <VStack align="stretch" spacing={1}>
                  {filteredApps.map((app) => (
                    <HStack
                      key={app.id}
                      p={2}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleAppClick(app.id)}
                    >
                      <Box
                        p={2}
                        borderRadius="md"
                        bg={iconBg}
                        color="blue.500"
                      >
                        <app.icon size={18} />
                      </Box>
                      <Text>{app.label}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              
              <Divider />
              <Box p={2}>
                <Text
                  textAlign="center"
                  fontSize="sm"
                  color="blue.500"
                  cursor="pointer"
                  onClick={onExpandDock}
                  _hover={{ textDecoration: 'underline' }}
                >
                  Expand Dock
                </Text>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default AppLauncher;
