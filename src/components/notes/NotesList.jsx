import React from 'react';
import {
  VStack,
  Box,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

export const NotesList = ({ notes = [], selectedNote, onSelectNote }) => {
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <VStack
      spacing={0}
      align="stretch"
      h="100%"
      overflow="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: useColorModeValue('gray.300', 'gray.600'),
          borderRadius: '24px',
        },
      }}
    >
      {notes.map((note) => (
        <Box
          key={note.id}
          p={3}
          cursor="pointer"
          bg={selectedNote?.id === note.id ? selectedBg : 'transparent'}
          _hover={{ bg: selectedNote?.id === note.id ? selectedBg : hoverBg }}
          onClick={() => onSelectNote(note)}
          transition="background 0.2s"
        >
          <Text
            fontSize="sm"
            fontWeight="medium"
            noOfLines={1}
          >
            {note.title || 'Untitled Note'}
          </Text>
          <Text
            fontSize="xs"
            color={mutedColor}
            noOfLines={2}
          >
            {note.content || 'No content'}
          </Text>
          <Text
            fontSize="xs"
            color={mutedColor}
            mt={1}
          >
            {new Date(note.updatedAt).toLocaleDateString()}
          </Text>
        </Box>
      ))}
    </VStack>
  );
};
