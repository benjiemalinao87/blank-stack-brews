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
  HStack,
  useToast,
} from '@chakra-ui/react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

const APPOINTMENT_TYPES = [
  'Initial Consultation',
  'Site Visit',
  'Maintenance',
  'Repair',
  'Installation',
  'Follow-up',
  'Quote Review'
];

export const AppointmentScheduler = ({ contact, onSchedule }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState(APPOINTMENT_TYPES[0]);
  const [notes, setNotes] = useState('');
  const toast = useToast();

  const handleSchedule = () => {
    if (!date || !time) {
      toast({
        title: 'Error',
        description: 'Please select both date and time',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const appointment = {
      id: Date.now().toString(),
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      date,
      time,
      type,
      notes,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    onSchedule(appointment);
    
    toast({
      title: 'Appointment Scheduled',
      description: `Appointment scheduled with ${contact.name} for ${date} at ${time}`,
      status: 'success',
      duration: 3000,
    });
  };

  return (
    <Box>
      <Popover placement="bottom-start">
        <PopoverTrigger>
          <IconButton
            icon={<CalendarIcon size={20} />}
            aria-label="Schedule Appointment"
            variant="ghost"
            _hover={{ bg: 'blue.50' }}
          />
        </PopoverTrigger>
        <PopoverContent width="300px">
          <PopoverBody p={4}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Time</FormLabel>
                <Select value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
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
                onClick={handleSchedule}
                leftIcon={<Clock size={20} />}
              >
                Schedule Appointment
              </Button>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};
