import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  IconButton,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from '@chakra-ui/react';
import { Briefcase, DollarSign } from 'lucide-react';

const OPPORTUNITY_STAGES = [
  'New Lead',
  'Initial Contact',
  'Quote Sent',
  'Negotiation',
  'Contract Sent',
  'Closed Won',
  'Closed Lost'
];

const SERVICES = [
  'Kitchen Renovation',
  'Bathroom Remodel',
  'Room Addition',
  'Whole House Renovation',
  'Exterior Renovation',
  'Roofing',
  'Windows & Doors',
  'Flooring',
  'HVAC Installation',
  'Electrical Work',
  'Plumbing',
  'Other'
];

export const OpportunityCreator = ({ contact, onCreateOpportunity }) => {
  const [title, setTitle] = useState('');
  const [service, setService] = useState(SERVICES[0]);
  const [stage, setStage] = useState(OPPORTUNITY_STAGES[0]);
  const [value, setValue] = useState(0);
  const [notes, setNotes] = useState('');
  const toast = useToast();

  const handleCreate = () => {
    if (!title || !service) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const opportunity = {
      id: Date.now().toString(),
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      title,
      service,
      stage,
      value,
      notes,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    onCreateOpportunity(opportunity);
    
    toast({
      title: 'Opportunity Created',
      description: `New opportunity created for ${contact.name}`,
      status: 'success',
      duration: 3000,
    });
  };

  return (
    <Box>
      <Popover placement="bottom-start">
        <PopoverTrigger>
          <IconButton
            icon={<Briefcase size={20} />}
            aria-label="Create Opportunity"
            variant="ghost"
            _hover={{ bg: 'blue.50' }}
          />
        </PopoverTrigger>
        <PopoverContent width="300px">
          <PopoverBody p={4}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="Enter opportunity title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Service</FormLabel>
                <Select value={service} onChange={(e) => setService(e.target.value)}>
                  {SERVICES.map((svc) => (
                    <option key={svc} value={svc}>
                      {svc}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Stage</FormLabel>
                <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                  {OPPORTUNITY_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Value ($)</FormLabel>
                <NumberInput
                  value={value}
                  onChange={(valueString) => setValue(parseFloat(valueString))}
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  placeholder="Add any additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                width="100%"
                onClick={handleCreate}
                leftIcon={<DollarSign size={20} />}
              >
                Create Opportunity
              </Button>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};
