import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
  Heading
} from '@chakra-ui/react';
import { AddIcon, TimeIcon } from '@chakra-ui/icons';
import { FaComment } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import SequenceStep from './SequenceStep';

/**
 * Visual Sequence Builder Component
 * 
 * Provides a visual interface for creating and editing message sequences.
 * Supports dragging and dropping steps to reorder them.
 */
const VisualSequenceBuilder = ({ sequenceSteps, setSequenceSteps }) => {
  // Ensure we always have an array, even if prop is undefined
  const steps = sequenceSteps || [];
  const setSteps = setSequenceSteps;
  
  const [draggedStep, setDraggedStep] = useState(null);
  
  // Color mode values - all at the top level
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const emptyBg = useColorModeValue('#f8fafc', 'gray.700');
  const headerBg = useColorModeValue('#f0f4f8', 'gray.750');
  const accentColor = useColorModeValue('purple.500', 'purple.300');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.3)');
  const stepCountBg = useColorModeValue('blue.50', 'blue.900');
  const stepCountColor = useColorModeValue('blue.700', 'blue.200');
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const boxBgColor = useColorModeValue('white', 'gray.800');
  
  // Handle adding a new step
  const handleAddStep = () => {
    const newStep = {
      id: uuidv4(),
      step_order: steps.length,
      channel: 'sms',
      wait_duration: steps.length > 0 ? 1 : 0, // First step is day 0, others default to 1 day
      wait_until_start: '09:00',
      wait_until_end: '18:00',
      content: '',
      metadata: {}
    };
    
    setSteps([...steps, newStep]);
  };
  
  // Handle updating a step
  const handleUpdateStep = (updatedStep) => {
    setSteps(steps.map(step => 
      step.id === updatedStep.id ? updatedStep : step
    ));
  };
  
  // Handle deleting a step
  const handleDeleteStep = (stepId) => {
    setSteps(prevSteps => {
      // Ensure prevSteps is an array
      const stepsToModify = prevSteps || [];
      const newSteps = stepsToModify.filter(step => step.id !== stepId);
      
      // Re-number the steps
      return newSteps.map((step, index) => ({
        ...step,
        step_order: index
      }));
    });
  };
  
  // Handle duplicating a step
  const handleDuplicateStep = (stepToDuplicate) => {
    const newStep = {
      ...stepToDuplicate,
      id: uuidv4(),
      step_order: steps.length,
    };
    
    setSteps([...steps, newStep]);
  };
  
  // Drag and drop handlers
  const handleDragStart = (e, step) => {
    setDraggedStep(step);
  };
  
  const handleDragOver = (e, targetStep) => {
    e.preventDefault();
    
    if (!draggedStep || draggedStep.id === targetStep.id) {
      return;
    }
    
    // Reorder the steps
    const newSteps = [...steps];
    const draggedIndex = newSteps.findIndex(s => s.id === draggedStep.id);
    const targetIndex = newSteps.findIndex(s => s.id === targetStep.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newSteps.splice(draggedIndex, 1);
      newSteps.splice(targetIndex, 0, draggedStep);
      
      // Update step_order
      newSteps.forEach((step, index) => {
        step.step_order = index;
      });
      
      setSteps(newSteps);
    }
  };
  
  const handleDragEnd = () => {
    setDraggedStep(null);
  };

  // Render each step with its appropriate styles
  const renderSteps = () => {
    return steps
      .sort((a, b) => a.step_order - b.step_order)
      .map((step, index) => (
        <Box
          key={step.id}
          draggable
          onDragStart={(e) => handleDragStart(e, step)}
          onDragOver={(e) => handleDragOver(e, step)}
          onDragEnd={handleDragEnd}
          bg={boxBgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="12px"
          boxShadow={draggedStep?.id === step.id 
            ? "0 8px 16px rgba(0, 0, 0, 0.15)" 
            : `0 1px 3px ${shadowColor}`}
          transition="all 0.2s"
          _hover={{
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
            borderColor: hoverBorderColor
          }}
          transform={draggedStep?.id === step.id ? "scale(1.02)" : "none"}
        >
          <SequenceStep
            step={step}
            index={index}
            onDelete={handleDeleteStep}
            onDuplicate={handleDuplicateStep}
            onChange={handleUpdateStep}
            isDragging={draggedStep?.id === step.id}
          />
        </Box>
      ));
  };
  
  return (
    <Box 
      p={6}
      borderRadius="16px"
      bg={bgColor}
      boxShadow={`0 1px 3px ${shadowColor}`}
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6}
        pb={4}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
      >
        <HStack spacing={3}>
          <Box 
            px={3} 
            py={1.5} 
            bg={stepCountBg} 
            color={stepCountColor} 
            borderRadius="full"
            fontWeight="medium"
            fontSize="15px"
          >
            {steps.length} {steps.length === 1 ? 'step' : 'steps'} in sequence
          </Box>
          
          <Text fontSize="16px" fontWeight="medium" color={textColor}>
            {steps.length === 0 
              ? 'Start building your sequence by adding message steps' 
              : 'Drag steps to reorder your sequence'}
          </Text>
        </HStack>
      </Flex>
      
      {steps.length === 0 ? (
        <Box 
          borderWidth="2px" 
          borderStyle="dashed" 
          borderColor={borderColor} 
          borderRadius="12px"
          p={8}
          bg={emptyBg}
          textAlign="center"
        >
          <VStack spacing={6}>
            <Icon as={FaComment} w={12} h={12} color={accentColor} opacity={0.6} />
            
            <VStack spacing={2}>
              <Heading as="h3" size="md" fontWeight="semibold" color={textColor}>
                Your sequence is empty
              </Heading>
              <Text color="gray.600" fontSize="16px" maxW="450px" lineHeight="1.6">
                Add your first message step to start building your campaign. 
                Each step can be scheduled on a specific day and time.
              </Text>
            </VStack>
            
            <Button
              leftIcon={<AddIcon />}
              colorScheme="purple"
              size="lg"
              onClick={handleAddStep}
              borderRadius="8px"
              fontWeight="medium"
              px={6}
              py={6}
              height="auto"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
              _hover={{ 
                transform: 'translateY(-1px)',
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)" 
              }}
              transition="all 0.2s"
            >
              Add First Step
            </Button>
          </VStack>
        </Box>
      ) : (
        <VStack align="stretch" spacing={5}>
          {renderSteps()}
        </VStack>
      )}
      
      {steps.length > 0 && (
        <Flex justify="center" mt={8}>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="purple"
            variant="outline"
            onClick={handleAddStep}
            borderRadius="8px"
            fontWeight="medium"
            px={5}
            py={2}
            height="auto"
          >
            Add Another Step
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default VisualSequenceBuilder; 