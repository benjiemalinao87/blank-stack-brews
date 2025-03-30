import React from 'react';
import {
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  Box,
  StepTitle,
  StepDescription,
  useColorModeValue,
} from '@chakra-ui/react';

const StepperComponent = ({ activeStep, steps }) => {
  const activeColor = useColorModeValue('purple.500', 'purple.300');
  const completedColor = useColorModeValue('green.500', 'green.300');
  const inactiveColor = useColorModeValue('gray.300', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  
  return (
    <Stepper index={activeStep} mb={8} colorScheme="purple" size="lg">
      {steps.map((step, index) => (
        <Step key={index} 
          style={{ 
            opacity: index <= activeStep ? 1 : 0.7,
            transition: 'all 0.2s'
          }}
        >
          <StepIndicator 
            borderColor={index < activeStep ? completedColor : index === activeStep ? activeColor : inactiveColor}
            bg={index < activeStep ? completedColor : 'transparent'}
          >
            <StepStatus
              complete={<StepIcon color="white" />}
              incomplete={<StepNumber />}
              active={<StepNumber color={activeColor} fontWeight="bold" />}
            />
          </StepIndicator>
          <Box flexShrink="0">
            <StepTitle 
              color={index <= activeStep ? (index === activeStep ? activeColor : textColor) : inactiveColor}
              fontWeight={index === activeStep ? "bold" : "normal"}
            >
              {step.title}
            </StepTitle>
            <StepDescription>{step.description}</StepDescription>
          </Box>
        </Step>
      ))}
    </Stepper>
  );
};

export default StepperComponent;
