import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Text,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { Tag as TagIcon, Plus } from 'lucide-react';

const PREDEFINED_COLORS = [
  'blue.500',
  'green.500',
  'red.500',
  'purple.500',
  'orange.500',
  'pink.500',
  'teal.500',
  'yellow.500',
];

export const LabelManager = ({ selectedLabels = [], onLabelsChange }) => {
  const [newLabel, setNewLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);
  const toast = useToast();

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;

    const label = {
      id: Date.now().toString(),
      text: newLabel.trim(),
      color: selectedColor,
    };

    onLabelsChange([...selectedLabels, label]);
    setNewLabel('');
    
    toast({
      title: 'Label Added',
      description: `Label "${label.text}" has been created`,
      status: 'success',
      duration: 2000,
    });
  };

  const handleRemoveLabel = (labelId) => {
    onLabelsChange(selectedLabels.filter(label => label.id !== labelId));
  };

  return (
    <Box>
      <Popover placement="bottom-start">
        <PopoverTrigger>
          <IconButton
            icon={<TagIcon size={20} />}
            aria-label="Add Label"
            variant="ghost"
            _hover={{ bg: 'blue.50' }}
          />
        </PopoverTrigger>
        <PopoverContent width="300px">
          <PopoverBody p={4}>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Input
                  placeholder="Enter label name"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  size="sm"
                />
                <IconButton
                  icon={<Plus size={20} />}
                  onClick={handleAddLabel}
                  colorScheme="blue"
                  size="sm"
                  aria-label="Add Label"
                />
              </HStack>
              
              <Box>
                <Text fontSize="sm" mb={2}>Colors:</Text>
                <HStack spacing={2}>
                  {PREDEFINED_COLORS.map((color) => (
                    <Box
                      key={color}
                      w="20px"
                      h="20px"
                      borderRadius="md"
                      bg={color}
                      cursor="pointer"
                      onClick={() => setSelectedColor(color)}
                      border={selectedColor === color ? '2px solid' : 'none'}
                      borderColor="blue.200"
                    />
                  ))}
                </HStack>
              </Box>

              {selectedLabels.length > 0 && (
                <Box>
                  <Text fontSize="sm" mb={2}>Selected Labels:</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedLabels.map((label) => (
                      <Tag
                        key={label.id}
                        size="sm"
                        borderRadius="full"
                        variant="solid"
                        bg={label.color}
                      >
                        <TagLabel>{label.text}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveLabel(label.id)} />
                      </Tag>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};
