import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text
} from '@chakra-ui/react';

/**
 * Campaign Modal Component
 * 
 * This is a placeholder for now as we're using the SequenceBuilder for campaign creation.
 * In the future, this could be used for quick campaign editing or other operations.
 */
const CampaignModal = ({ isOpen, onClose, mode, campaign, workspaceId, onSuccess }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === 'create' ? 'Create Campaign' : 'Edit Campaign'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Campaign creation and editing is now handled through the Sequence Builder.
            This modal is kept for backward compatibility.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CampaignModal; 