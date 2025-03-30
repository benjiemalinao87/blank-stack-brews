import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Input,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import { FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';

const MessageItem = ({ type, content, onUpdate, onRemove }) => {
  const [value, setValue] = useState(content || '');
  
  const handleChange = (newValue) => {
    setValue(newValue);
    onUpdate(newValue);
  };

  return (
    <Box position="relative" mb={3}>
      <IconButton
        icon={<X size={12} />}
        size="xs"
        position="absolute"
        top={-1}
        right={-1}
        rounded="full"
        colorScheme="red"
        onClick={onRemove}
        zIndex={1}
      />
      
      {type === 'text' && (
        <Textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter your message..."
          size="sm"
          rows={3}
          resize="vertical"
        />
      )}
      
      {type === 'image' && (
        <VStack align="stretch" spacing={2}>
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter image URL..."
            size="sm"
          />
          {value && (
            <Box borderWidth={1} borderRadius="md" overflow="hidden">
              <img src={value} alt="Preview" style={{ maxWidth: '100%', height: 'auto' }} />
            </Box>
          )}
        </VStack>
      )}
      
      {type === 'file' && (
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter file URL..."
          size="sm"
        />
      )}
    </Box>
  );
};

const NodeEditor = ({ node, onUpdate }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const buttonBg = useColorModeValue('gray.50', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.600');

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (node?.data?.items) {
      setItems(node.data.items);
    } else {
      setItems([]);
    }
  }, [node]);

  if (!node) return null;

  const handleAddItem = (type) => {
    const newItems = [...items, { type, content: '', id: Date.now() }];
    setItems(newItems);
    onUpdate({
      ...node,
      data: { ...node.data, items: newItems }
    });
  };

  const handleUpdateItem = (index, content) => {
    const newItems = items.map((item, i) => 
      i === index ? { ...item, content } : item
    );
    setItems(newItems);
    onUpdate({
      ...node,
      data: { ...node.data, items: newItems }
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onUpdate({
      ...node,
      data: { ...node.data, items: newItems }
    });
  };

  return (
    <Box
      position="absolute"
      right="0"
      top="0"
      height="100%"
      width="320px"
      bg={bg}
      borderLeft="1px"
      borderColor={borderColor}
      p={4}
      overflowY="auto"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="medium">
          {node.type === 'send-message' ? 'Send Message #1' : node.data?.label || 'Node Editor'}
        </Text>

        <Box bg="blue.50" p={3} borderRadius="md">
          <Text color="blue.600" fontSize="sm">
            Use the buttons below to add message items.
          </Text>
        </Box>

        {items.map((item, index) => (
          <MessageItem
            key={item.id}
            type={item.type}
            content={item.content}
            onUpdate={(content) => handleUpdateItem(index, content)}
            onRemove={() => handleRemoveItem(index)}
          />
        ))}

        <VStack spacing={3} align="stretch">
          <HStack spacing={4} justify="center">
            <Button
              flex={1}
              variant="outline"
              bg={buttonBg}
              _hover={{ bg: buttonHoverBg }}
              height="70px"
              borderStyle="dashed"
              leftIcon={<FileText size={20} />}
              onClick={() => handleAddItem('text')}
            >
              <VStack spacing={0} align="center">
                <Text>+ Text</Text>
              </VStack>
            </Button>
            
            <Button
              flex={1}
              variant="outline"
              bg={buttonBg}
              _hover={{ bg: buttonHoverBg }}
              height="70px"
              borderStyle="dashed"
              leftIcon={<ImageIcon size={20} />}
              onClick={() => handleAddItem('image')}
            >
              <VStack spacing={0} align="center">
                <Text>+ Image</Text>
              </VStack>
            </Button>
          </HStack>

          <Button
            width="100%"
            variant="outline"
            bg={buttonBg}
            _hover={{ bg: buttonHoverBg }}
            height="70px"
            borderStyle="dashed"
            leftIcon={<Paperclip size={20} />}
            onClick={() => handleAddItem('file')}
          >
            <VStack spacing={0} align="center">
              <Text>+ File</Text>
            </VStack>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default NodeEditor;
