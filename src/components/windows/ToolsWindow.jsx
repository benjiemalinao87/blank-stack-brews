import React, { useState } from 'react';
import { Box, HStack, VStack, Text, Icon } from '@chakra-ui/react';
import StatusConfig from '../tools/StatusConfig';
import { Settings } from 'lucide-react';

const MenuItem = ({ icon, label, isSelected, onClick }) => (
  <HStack
    p={3}
    cursor="pointer"
    bg={isSelected ? 'gray.100' : 'transparent'}
    _hover={{ bg: 'gray.50' }}
    borderRadius="md"
    onClick={onClick}
    w="full"
    transition="all 0.2s"
  >
    <Icon as={icon} boxSize={5} color={isSelected ? 'blue.500' : 'gray.600'} />
    <Text color={isSelected ? 'blue.500' : 'gray.700'} fontWeight={isSelected ? 'medium' : 'normal'}>
      {label}
    </Text>
  </HStack>
);

export function ToolsWindow() {
  const [selectedTool, setSelectedTool] = useState('pipeline');

  return (
    <HStack align="stretch" spacing={0} h="full">
      {/* Left Sidebar */}
      <Box
        w="250px"
        borderRight="1px"
        borderColor="gray.200"
        p={4}
        bg="white"
      >
        <VStack align="stretch" spacing={2}>
          <MenuItem
            icon={Settings}
            label="Configure Pipeline"
            isSelected={selectedTool === 'pipeline'}
            onClick={() => setSelectedTool('pipeline')}
          />
        </VStack>
      </Box>

      {/* Right Content Area */}
      <Box flex={1} p={4} bg="gray.50">
        {selectedTool === 'pipeline' && <StatusConfig />}
      </Box>
    </HStack>
  );
}
