import React from 'react';
import {
  Box,
  Text,
  Textarea,
  Input,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { Mail, Plus, X } from 'lucide-react';

const EmailNode = ({ id, data }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleChange = (field, value) => {
    if (data.onNodeChange) {
      data.onNodeChange(id, {
        ...data,
        [field]: value,
      });
    }
  };

  const handleRecipientAdd = (type) => {
    const email = prompt(`Enter ${type} email address:`);
    if (email && data.onNodeChange) {
      data.onNodeChange(id, {
        ...data,
        [type]: [...(data[type] || []), email],
      });
    }
  };

  const handleRecipientRemove = (type, index) => {
    if (data.onNodeChange) {
      const recipients = [...(data[type] || [])];
      recipients.splice(index, 1);
      data.onNodeChange(id, {
        ...data,
        [type]: recipients,
      });
    }
  };

  const RecipientList = ({ type, label }) => (
    <Box>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" color={textColor}>{label}</Text>
        <IconButton
          icon={<Plus size={14} />}
          size="xs"
          variant="ghost"
          onClick={() => handleRecipientAdd(type)}
          aria-label={`Add ${type}`}
        />
      </HStack>
      <VStack align="stretch" spacing={1}>
        {(data[type] || []).map((email, index) => (
          <HStack key={index} spacing={2}>
            <Text fontSize="sm" flex={1} noOfLines={1}>{email}</Text>
            <IconButton
              icon={<X size={12} />}
              size="xs"
              variant="ghost"
              onClick={() => handleRecipientRemove(type, index)}
              aria-label="Remove recipient"
            />
          </HStack>
        ))}
      </VStack>
    </Box>
  );

  return (
    <VStack spacing={3} align="stretch">
      <Input
        value={data.subject || ''}
        onChange={(e) => handleChange('subject', e.target.value)}
        placeholder="Subject"
        size="sm"
        bg={bgColor}
        borderColor={borderColor}
        _placeholder={{ color: placeholderColor }}
      />

      <Textarea
        value={data.body || ''}
        onChange={(e) => handleChange('body', e.target.value)}
        placeholder="Email body..."
        size="sm"
        rows={3}
        resize="none"
        bg={bgColor}
        borderColor={borderColor}
        _placeholder={{ color: placeholderColor }}
      />

      <Box 
        p={2} 
        bg={bgColor}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={2} align="stretch">
          <RecipientList type="to" label="To:" />
          <RecipientList type="cc" label="CC:" />
          <RecipientList type="bcc" label="BCC:" />
        </VStack>
      </Box>
    </VStack>
  );
};

export default EmailNode;
