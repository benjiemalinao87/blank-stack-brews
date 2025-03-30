import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Divider,
  IconButton,
  Flex,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  InputGroup,
  InputRightElement,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Paperclip, X, Image as ImageIcon, Plus, Mail, Info } from 'lucide-react';

const EmailTemplateEditor = ({ initialData = {}, onSave, onCancel }) => {
  const [emailData, setEmailData] = useState({
    subject: initialData.subject || '',
    body: initialData.body || '',
    to: initialData.to || [],
    cc: initialData.cc || [],
    bcc: initialData.bcc || [],
    attachments: initialData.attachments || [],
    ...initialData
  });
  
  const [recipientInput, setRecipientInput] = useState({ to: '', cc: '', bcc: '' });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const tagBg = useColorModeValue('blue.50', 'blue.900');
  
  const handleChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  const handleAddRecipient = (type, email) => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      return;
    }
    
    if (!emailData[type].includes(trimmedEmail)) {
      setEmailData(prev => ({
        ...prev,
        [type]: [...prev[type], trimmedEmail]
      }));
    }
    
    setRecipientInput(prev => ({ ...prev, [type]: '' }));
  };
  
  const handleRemoveRecipient = (type, email) => {
    setEmailData(prev => ({
      ...prev,
      [type]: prev[type].filter(e => e !== email)
    }));
  };
  
  const handleKeyDown = (type, e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddRecipient(type, recipientInput[type]);
    }
  };
  
  const handleAddAttachment = (attachment) => {
    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, attachment]
    }));
  };
  
  const handleRemoveAttachment = (index) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = () => {
    onSave(emailData);
  };
  
  const renderRecipientField = (type, label, placeholder) => (
    <FormControl>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <Box>
        <Wrap spacing={1} mb={2}>
          {emailData[type].map((email, index) => (
            <WrapItem key={`${type}-${index}`}>
              <Tag size="sm" bg={tagBg} borderRadius="full">
                <TagLabel>{email}</TagLabel>
                <TagCloseButton onClick={() => handleRemoveRecipient(type, email)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
        <InputGroup size="sm">
          <Input
            placeholder={placeholder}
            value={recipientInput[type]}
            onChange={(e) => setRecipientInput(prev => ({ ...prev, [type]: e.target.value }))}
            onKeyDown={(e) => handleKeyDown(type, e)}
            onBlur={() => handleAddRecipient(type, recipientInput[type])}
          />
          <InputRightElement>
            <Tooltip label="Press Enter or comma to add multiple emails">
              <Box>
                <Info size={14} />
              </Box>
            </Tooltip>
          </InputRightElement>
        </InputGroup>
      </Box>
    </FormControl>
  );
  
  const AttachmentModal = () => {
    const [newAttachment, setNewAttachment] = useState({
      name: '',
      url: '',
      type: 'file'
    });
    
    const handleAttachmentChange = (field, value) => {
      setNewAttachment(prev => ({
        ...prev,
        [field]: value
      }));
    };
    
    const handleAddNewAttachment = () => {
      if (newAttachment.name && newAttachment.url) {
        handleAddAttachment({
          id: `attachment-${Date.now()}`,
          ...newAttachment
        });
        onClose();
        setNewAttachment({ name: '', url: '', type: 'file' });
      }
    };
    
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Attachment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Attachment Name</FormLabel>
                <Input 
                  placeholder="Enter file name" 
                  value={newAttachment.name}
                  onChange={(e) => handleAttachmentChange('name', e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>File URL</FormLabel>
                <Input 
                  placeholder="Enter file URL" 
                  value={newAttachment.url}
                  onChange={(e) => handleAttachmentChange('url', e.target.value)}
                />
              </FormControl>
              
              <HStack spacing={4}>
                <Button 
                  variant={newAttachment.type === 'file' ? 'solid' : 'outline'}
                  leftIcon={<Paperclip size={16} />}
                  onClick={() => handleAttachmentChange('type', 'file')}
                  size="sm"
                >
                  File
                </Button>
                <Button 
                  variant={newAttachment.type === 'image' ? 'solid' : 'outline'}
                  leftIcon={<ImageIcon size={16} />}
                  onClick={() => handleAttachmentChange('type', 'image')}
                  size="sm"
                >
                  Image
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddNewAttachment}>
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Recipients */}
        {renderRecipientField('to', 'To', 'Enter email addresses')}
        {renderRecipientField('cc', 'CC', 'Carbon copy recipients')}
        {renderRecipientField('bcc', 'BCC', 'Blind carbon copy recipients')}
        
        {/* Subject */}
        <FormControl>
          <FormLabel fontSize="sm">Subject</FormLabel>
          <Input 
            placeholder="Enter email subject" 
            value={emailData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            size="sm"
          />
        </FormControl>
        
        {/* Body */}
        <FormControl>
          <FormLabel fontSize="sm">Email Body</FormLabel>
          <Textarea 
            placeholder="Enter email content" 
            value={emailData.body}
            onChange={(e) => handleChange('body', e.target.value)}
            minH="200px"
            size="sm"
          />
        </FormControl>
        
        {/* Attachments */}
        <Box>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Attachments</Text>
            <Button 
              size="xs" 
              leftIcon={<Plus size={14} />} 
              onClick={onOpen}
              variant="outline"
            >
              Add
            </Button>
          </Flex>
          
          {emailData.attachments.length > 0 ? (
            <VStack align="stretch" spacing={2} maxH="150px" overflowY="auto">
              {emailData.attachments.map((attachment, index) => (
                <Flex 
                  key={attachment.id || index}
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={borderColor}
                  justify="space-between"
                  align="center"
                >
                  <HStack>
                    {attachment.type === 'image' ? (
                      <ImageIcon size={14} />
                    ) : (
                      <Paperclip size={14} />
                    )}
                    <Text fontSize="sm" noOfLines={1}>{attachment.name}</Text>
                  </HStack>
                  <IconButton
                    icon={<X size={14} />}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleRemoveAttachment(index)}
                    aria-label="Remove attachment"
                  />
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm" color={placeholderColor} fontStyle="italic">
              No attachments added
            </Text>
          )}
        </Box>
        
        <Divider />
        
        <HStack spacing={2} justify="flex-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isDisabled={!emailData.subject || !emailData.body || emailData.to.length === 0}
          >
            Save Template
          </Button>
        </HStack>
      </VStack>
      
      <AttachmentModal />
    </Box>
  );
};

export default EmailTemplateEditor;
