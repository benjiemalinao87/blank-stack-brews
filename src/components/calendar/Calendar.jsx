import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Select,
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const eventTypes = {
  meeting: { color: 'blue', label: 'Meeting' },
  deadline: { color: 'red', label: 'Deadline' },
  followup: { color: 'green', label: 'Follow-up' },
  production: { color: 'purple', label: 'Production' },
  delivery: { color: 'orange', label: 'Delivery' }
};

export const Calendar = () => {
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Client Meeting - ABC Corp',
      start: new Date(),
      type: 'meeting',
      description: 'Discuss Q1 requirements',
      contact: 'John Smith',
      status: 'confirmed'
    },
    // Add more sample events as needed
  ]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting',
    description: '',
    contact: '',
    status: 'pending'
  });

  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setNewEvent(prev => ({ ...prev, start: arg.date }));
    onOpen();
  };

  const handleEventClick = (arg) => {
    const event = events.find(e => e.id === arg.event.id);
    setNewEvent({ ...event });
    onOpen();
  };

  const handleAddEvent = () => {
    const eventToAdd = {
      ...newEvent,
      id: String(Date.now()),
    };

    setEvents(prev => [...prev, eventToAdd]);
    onClose();
    setNewEvent({
      title: '',
      type: 'meeting',
      description: '',
      contact: '',
      status: 'pending'
    });
  };

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    events: events.map(event => ({
      ...event,
      backgroundColor: eventTypes[event.type].color,
    })),
  };

  return (
    <Box p={4} h="100%" bg={useColorModeValue('white', 'gray.800')}>
      <VStack spacing={4} h="100%">
        <HStack w="100%" justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">Sales & Production Calendar</Text>
          <Button colorScheme="blue" onClick={() => handleDateClick({ date: new Date() })}>
            Add Event
          </Button>
        </HStack>

        <Box w="100%" h="calc(100% - 60px)" position="relative">
          <FullCalendar
            {...calendarOptions}
            height="100%"
          />
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {newEvent.id ? 'Edit Event' : 'Add New Event'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {Object.entries(eventTypes).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Contact</FormLabel>
                  <Input
                    value={newEvent.contact}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="Associated contact"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </FormControl>

                <HStack w="100%" justify="flex-end" pt={4}>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button colorScheme="blue" onClick={handleAddEvent}>
                    {newEvent.id ? 'Update' : 'Add'}
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};
