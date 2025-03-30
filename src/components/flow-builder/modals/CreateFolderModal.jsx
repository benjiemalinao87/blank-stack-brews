import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useColorModeValue,
} from '@chakra-ui/react';

const CreateFolderModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialName = '',
  isEditing = false 
}) => {
  const [name, setName] = useState(initialName);
  const initialRef = useRef(null);
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      initialFocusRef={initialRef}
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg={bg} borderColor={borderColor} borderWidth="1px">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{isEditing ? 'Edit Folder' : 'Create New Folder'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Folder Name</FormLabel>
              <Input
                ref={initialRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
                size="lg"
                borderRadius="lg"
              />
              <FormHelperText>
                {isEditing ? 'Update folder name' : 'Create a folder to organize your flows'}
              </FormHelperText>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit"
              isDisabled={!name.trim()}
            >
              {isEditing ? 'Save Changes' : 'Create Folder'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateFolderModal;
