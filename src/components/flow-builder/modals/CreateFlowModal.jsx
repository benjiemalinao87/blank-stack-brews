import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  Select,
  VStack,
} from '@chakra-ui/react';

const CreateFlowModal = ({ isOpen, onClose, onCreateFlow, folders, selectedFolder }) => {
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState(selectedFolder?.id || '');
  const initialRef = useRef(null);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setFolderId(selectedFolder?.id || '');
    }
  }, [isOpen, selectedFolder]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreateFlow(name.trim(), folderId || null);
    onClose();
  };

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={initialRef}
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg={bg} borderColor={borderColor} borderWidth="1px">
        <ModalHeader>Create New Flow</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Flow Name</FormLabel>
              <Input
                ref={initialRef}
                placeholder="Enter flow name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Folder (Optional)</FormLabel>
              <Select
                placeholder="Select folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isDisabled={!name.trim()}>
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateFlowModal;
