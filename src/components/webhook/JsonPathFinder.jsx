import React, { useState } from 'react';
import {
  Box,
  Text,
  HStack,
  IconButton,
  Code,
  useColorMode,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { VscCircle, VscCircleFilled, VscTrash } from 'react-icons/vsc';

const CONTACT_FIELDS = [
  // Required fields
  { id: 'phone_number', label: 'Phone Number', required: true },
  { id: 'firstname', label: 'First Name', required: true },
  { id: 'lastname', label: 'Last Name', required: true },
  
  // Optional fields
  { id: 'name', label: 'Full Name', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'lead_source', label: 'Lead Source', required: false },
  { id: 'market', label: 'Market', required: false },
  { id: 'product', label: 'Product', required: false },
  { id: 'lead_status', label: 'Lead Status', required: false },
  
  // Address fields
  { id: 'st_address', label: 'Street Address', required: false },
  { id: 'city', label: 'City', required: false },
  { id: 'state', label: 'State', required: false },
  { id: 'zip', label: 'ZIP Code', required: false }
];

const JsonPathFinder = ({ sampleData, mappings, onMapField }) => {
  const { colorMode } = useColorMode();
  const [hoveredField, setHoveredField] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);

  const handleFieldClick = (path) => {
    setSelectedPath(path === selectedPath ? null : path);
  };

  const handleMapField = (fieldId, path) => {
    if (!fieldId) {
      // If fieldId is empty, we're unmapping
      const fieldToUnmap = Object.entries(mappings).find(([_, mapping]) => {
        if (typeof mapping === 'string') return mapping === path;
        return mapping.path === `$.${path}`;
      })?.[0];
      if (fieldToUnmap) {
        onMapField(fieldToUnmap, ''); // Pass empty path to unmap
      }
    } else {
      onMapField(fieldId, path);
    }
    setSelectedPath(null);
  };

  const renderJsonValue = (key, value, path = '') => {
    const currentPath = path ? `${path}.${key}` : key;
    const mappedTo = Object.entries(mappings).find(([_, mapping]) => {
      if (typeof mapping === 'string') return mapping === currentPath;
      return mapping.path === `$.${currentPath}`;
    })?.[0];
    const isHovered = hoveredField === currentPath;
    const isSelected = selectedPath === currentPath;

    return (
      <Popover
        key={currentPath}
        isOpen={isSelected}
        onClose={() => setSelectedPath(null)}
        placement="right"
        closeOnBlur={true}
        strategy="fixed"
        gutter={8}
      >
        <PopoverTrigger>
          <Box 
            display="flex" 
            alignItems="center"
            py={1}
            px={2}
            position="relative"
            borderRadius="md"
            transition="all 0.2s"
            bg={mappedTo ? (colorMode === 'dark' ? 'green.900' : 'green.50') : 'transparent'}
            _hover={{ 
              bg: mappedTo 
                ? (colorMode === 'dark' ? 'green.800' : 'green.100')
                : (colorMode === 'dark' ? 'gray.700' : 'gray.50') 
            }}
            onMouseEnter={() => setHoveredField(currentPath)}
            onMouseLeave={() => setHoveredField(null)}
            cursor="pointer"
            onClick={() => handleFieldClick(currentPath)}
          >
            <Text 
              color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}
              fontFamily="mono"
              fontSize="sm"
              flex={1}
            >
              <Text as="span" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                "{key}":
              </Text>{' '}
              <Code 
                ml={1} 
                colorScheme={mappedTo ? 'green' : 'gray'}
                fontSize="sm"
              >
                "{value}"
              </Code>
            </Text>

            {mappedTo && (
              <HStack spacing={2} ml={3}>
                <Text 
                  fontSize="xs" 
                  color={colorMode === 'dark' ? 'green.200' : 'green.600'}
                >
                  → {CONTACT_FIELDS.find(f => f.id === mappedTo)?.label}
                </Text>
                <IconButton
                  icon={<VscTrash />}
                  variant="ghost"
                  size="xs"
                  colorScheme="red"
                  opacity={0.6}
                  _hover={{ opacity: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMapField('', currentPath);
                  }}
                  aria-label="Remove mapping"
                />
              </HStack>
            )}
          </Box>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            w="220px"
            bg={colorMode === 'dark' ? 'gray.800' : 'white'}
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            boxShadow="xl"
            _focus={{ outline: 'none' }}
            borderRadius="lg"
            overflow="hidden"
            transition="all 0.2s"
            transform="scale(0.98)"
            _hover={{ transform: 'scale(1)' }}
          >
            <PopoverBody p={1}>
              <VStack align="stretch" spacing={0.5}>
                {CONTACT_FIELDS.map(field => (
                  <HStack
                    key={field.id}
                    px={3}
                    py={2}
                    borderRadius="md"
                    cursor="pointer"
                    opacity={mappedTo === field.id ? 0.7 : 1}
                    bg={mappedTo === field.id ? (colorMode === 'dark' ? 'green.900' : 'green.50') : 'transparent'}
                    transition="all 0.2s"
                    _hover={{
                      bg: mappedTo === field.id ? 
                        (colorMode === 'dark' ? 'green.800' : 'green.100') : 
                        (colorMode === 'dark' ? 'gray.700' : 'gray.100'),
                      transform: 'translateX(2px)'
                    }}
                    onClick={() => handleMapField(field.id, currentPath)}
                  >
                    <Text 
                      fontSize="sm"
                      fontWeight={field.required ? "medium" : "normal"}
                      color={colorMode === 'dark' ? 'gray.100' : 'gray.800'}
                    >
                      {field.label}
                      {field.required && (
                        <Text as="span" color="red.400" ml={1} fontSize="xs">*</Text>
                      )}
                    </Text>
                    {mappedTo === field.id && (
                      <Badge 
                        size="sm" 
                        colorScheme="green" 
                        ml="auto"
                        fontSize="xs"
                        px={2}
                        variant="subtle"
                      >
                        Mapped
                      </Badge>
                    )}
                  </HStack>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    );
  };

  const renderJson = (data, path = '') => {
    if (!data || typeof data !== 'object') return null;

    return Object.entries(data).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return renderJson(value, path ? `${path}.${key}` : key);
      }
      return renderJsonValue(key, value, path);
    });
  };

  if (!sampleData || Object.keys(sampleData).length === 0) {
    return (
      <Box p={4} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
        <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Please provide a valid JSON payload to configure field mappings.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      borderRadius="md"
      borderWidth="1px"
      borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      h="400px"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: colorMode === 'dark' ? 'gray.800' : 'gray.100',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: colorMode === 'dark' ? 'gray.600' : 'gray.300',
          borderRadius: '4px',
          '&:hover': {
            background: colorMode === 'dark' ? 'gray.500' : 'gray.400',
          },
        },
      }}
    >
      <Box p={4}>
        {'{'}
        {renderJson(sampleData)}
        {'}'}
      </Box>
    </Box>
  );
};

export default JsonPathFinder;
