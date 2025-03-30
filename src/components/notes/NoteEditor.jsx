import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Input,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
  HStack,
  Text,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useNotes } from '../../context/NotesContext';
import RichTextEditor from './RichTextEditor';

export const NoteEditor = ({ note }) => {
  const { updateNote, selectedFolder } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
  }, [note]);

  const handleChange = (field, value) => {
    if (!note) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set the field locally
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'content':
        setContent(value);
        break;
      default:
        break;
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      updateNote(note.id, {
        [field]: value,
        folderId: selectedFolder,
      });
    }, 500);

    setSaveTimeout(timeout);
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      setTags(newTags);
      setNewTag('');
      if (note) {
        updateNote(note.id, { tags: newTags });
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    if (note) {
      updateNote(note.id, { tags: newTags });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newTag) {
      handleAddTag();
    }
  };

  if (!note) {
    return (
      <Box 
        h="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        color={placeholderColor}
      >
        <Text>Select a note or create a new one</Text>
      </Box>
    );
  }

  return (
    <Box h="100%" bg={bgColor} display="flex" flexDirection="column">
      {/* Title and Tags */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <Input
          value={title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Note title"
          variant="unstyled"
          fontSize="lg"
          fontWeight="medium"
          mb={2}
        />
        <HStack spacing={2} wrap="wrap">
          {tags.map((tag, index) => (
            <Tag
              key={index}
              size="sm"
              borderRadius="full"
              variant="subtle"
              colorScheme="blue"
            >
              <TagLabel>{tag}</TagLabel>
              <TagCloseButton onClick={() => handleRemoveTag(tag)} />
            </Tag>
          ))}
          <HStack>
            <Input
              size="sm"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              width="100px"
            />
            <IconButton
              icon={<AddIcon />}
              size="sm"
              onClick={handleAddTag}
              aria-label="Add tag"
            />
          </HStack>
        </HStack>
      </Box>

      {/* Rich Text Editor Container */}
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        overflow="hidden"
      >
        <RichTextEditor
          content={content}
          onChange={(value) => handleChange('content', value)}
          placeholder="Start writing..."
        />
      </Box>
    </Box>
  );
};
