import React, { useState, useEffect } from 'react';
import {
  Box,
  Textarea,
  Button,
  Image,
  VStack,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  IconButton,
  HStack,
  Text,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { Image as ImageIcon, X, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

const MessageNode = ({ data, id, isConnectable, selected }) => {
  const [message, setMessage] = useState(data?.message?.text || '');
  const [imageUrl, setImageUrl] = useState(data?.message?.image || '');
  const [showImageInput, setShowImageInput] = useState(!!data?.message?.image);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  
  // Move all color mode hooks to the top level
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const bgColor = useColorModeValue('white', 'gray.700');
  const previewBg = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const previewTitleColor = useColorModeValue('gray.600', 'gray.400');

  // Update the node data when component mounts to ensure data is properly initialized
  useEffect(() => {
    // Only initialize if data exists but message data is missing
    if (data && (!data.message || !data.message.text)) {
      if (data.updateNodeData) {
        data.updateNodeData(id, {
          ...data,
          message: {
            type: 'text',
            text: message,
            image: imageUrl
          }
        });
      }
    }
  }, []);

  // Update component state when data changes (e.g., when loading from saved flow)
  useEffect(() => {
    if (data?.message) {
      setMessage(data.message.text || '');
      setImageUrl(data.message.image || '');
      setShowImageInput(!!data.message.image);
    }
  }, [data?.message]);

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Update the node data in the parent component
    if (data.updateNodeData) {
      data.updateNodeData(id, {
        ...data,
        message: {
          ...data.message,
          type: 'text',
          text: newMessage,
          image: imageUrl
        }
      });
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    
    // Update the node data in the parent component
    if (data.updateNodeData) {
      data.updateNodeData(id, {
        ...data,
        message: {
          ...data.message,
          image: url
        }
      });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result;
        setImageUrl(url);
        
        // Update the node data in the parent component
        if (data.updateNodeData) {
          data.updateNodeData(id, {
            ...data,
            message: {
              ...data.message,
              image: url
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageUrl('');
    setShowImageInput(false);
    setIsImageExpanded(false);
    
    // Update the node data in the parent component
    if (data.updateNodeData) {
      data.updateNodeData(id, {
        ...data,
        message: {
          ...data.message,
          image: ''
        }
      });
    }
  };

  const MessagePreview = () => (
    <Box
      p={3}
      bg={previewBg}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      position="relative"
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="medium" color={previewTitleColor}>
            Message Preview
          </Text>
          <IconButton
            icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            size="xs"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          />
        </HStack>
        
        <Collapse in={isExpanded} animateOpacity>
          <VStack align="stretch" spacing={3}>
            {message && (
              <Text 
                fontSize="sm" 
                whiteSpace="pre-wrap"
                color={textColor}
              >
                {message}
              </Text>
            )}
          </VStack>
        </Collapse>

        {!isExpanded && message && (
          <Text 
            fontSize="sm" 
            noOfLines={2}
            color={textColor}
          >
            {message}
          </Text>
        )}

        {imageUrl && (
          <Box position="relative">
            <Box
              position="relative"
              borderRadius="md"
              overflow="hidden"
              maxH={isImageExpanded ? "none" : "200px"}
              transition="all 0.2s"
            >
              <Image
                src={imageUrl}
                alt="Message attachment"
                w="100%"
                objectFit="cover"
                onClick={() => setIsImageExpanded(!isImageExpanded)}
                cursor="pointer"
                transition="transform 0.2s"
                _hover={{ transform: 'scale(1.02)' }}
              />
              <IconButton
                icon={<X size={16} />}
                size="xs"
                position="absolute"
                top={2}
                right={2}
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                colorScheme="red"
                variant="solid"
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
              <IconButton
                icon={isImageExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                size="xs"
                position="absolute"
                top={2}
                right={10}
                onClick={() => setIsImageExpanded(!isImageExpanded)}
                colorScheme="blue"
                variant="solid"
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );

  return (
    <VStack spacing={3} align="stretch" p={2}>
      <Textarea
        value={message}
        onChange={handleMessageChange}
        placeholder="Enter your message"
        size="sm"
        rows={3}
        resize="vertical"
        borderColor={borderColor}
        _placeholder={{ color: placeholderColor }}
      />

      <VStack spacing={2} align="stretch">
        {!imageUrl && (
          <Button
            leftIcon={<ImageIcon size={16} />}
            size="sm"
            variant="outline"
            onClick={() => setShowImageInput(true)}
            isDisabled={showImageInput}
          >
            Add Image
          </Button>
        )}

        {showImageInput && (
          <VStack 
            spacing={2} 
            align="stretch" 
            bg={bgColor} 
            p={3} 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor={borderColor}
            shadow="sm"
          >
            <FormControl>
              <FormLabel fontSize="sm">Image URL</FormLabel>
              <Input
                size="sm"
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={handleImageUrlChange}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Or upload image</FormLabel>
              <Input
                type="file"
                size="sm"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </FormControl>

            <Button
              size="xs"
              colorScheme="red"
              variant="ghost"
              onClick={() => setShowImageInput(false)}
            >
              Cancel
            </Button>
          </VStack>
        )}
      </VStack>

      {(message || imageUrl) && <MessagePreview />}
    </VStack>
  );
};

export default MessageNode;
