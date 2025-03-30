import React, { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  HStack,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { Save } from 'lucide-react';

/**
 * Dialog for saving a flow with a description of changes
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onSave - Function to save the flow
 * @param {string} props.changeDescription - The description of changes
 * @param {Function} props.setChangeDescription - Function to update the description
 */
const SaveDialog = ({
  isOpen,
  onClose,
  onSave,
  changeDescription,
  setChangeDescription,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <ModalHeader display="flex" alignItems="center">
          <Save size={18} style={{ marginRight: '8px' }} />
          Save Changes
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">Description of Changes</FormLabel>
            <Textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Describe what changed in this version..."
              size="sm"
              rows={4}
              autoFocus
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              This helps you and your team understand what changed in each version.
            </Text>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={2} justifyContent="flex-end">
            <Button size="sm" onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<Save size={14} />}
              onClick={onSave}
            >
              Save
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SaveDialog;
