import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  Textarea,
  Divider,
  Icon,
  Select,
  HStack,
} from '@chakra-ui/react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from 'react-icons/fa';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const fonts = [
    { value: 'system-ui', label: 'System' },
    { value: 'arial', label: 'Arial' },
    { value: 'helvetica', label: 'Helvetica' },
    { value: 'times-new-roman', label: 'Times New Roman' },
  ];

  const sizes = [
    { value: '12', label: '12' },
    { value: '14', label: '14' },
    { value: '16', label: '16' },
    { value: '18', label: '18' },
    { value: '20', label: '20' },
  ];

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Box borderWidth="1px" borderRadius="md" p={2}>
      <Flex mb={2} gap={2} flexWrap="wrap">
        <HStack spacing={2}>
          <IconButton
            icon={<Icon as={FaBold} />}
            size="sm"
            variant="ghost"
            aria-label="Bold"
          />
          <IconButton
            icon={<Icon as={FaItalic} />}
            size="sm"
            variant="ghost"
            aria-label="Italic"
          />
          <IconButton
            icon={<Icon as={FaUnderline} />}
            size="sm"
            variant="ghost"
            aria-label="Underline"
          />
        </HStack>

        <Divider orientation="vertical" />

        <HStack spacing={2}>
          <IconButton
            icon={<Icon as={FaListUl} />}
            size="sm"
            variant="ghost"
            aria-label="Bullet list"
          />
          <IconButton
            icon={<Icon as={FaListOl} />}
            size="sm"
            variant="ghost"
            aria-label="Numbered list"
          />
        </HStack>

        <Divider orientation="vertical" />

        <HStack spacing={2}>
          <IconButton
            icon={<Icon as={FaAlignLeft} />}
            size="sm"
            variant="ghost"
            aria-label="Align left"
          />
          <IconButton
            icon={<Icon as={FaAlignCenter} />}
            size="sm"
            variant="ghost"
            aria-label="Align center"
          />
          <IconButton
            icon={<Icon as={FaAlignRight} />}
            size="sm"
            variant="ghost"
            aria-label="Align right"
          />
        </HStack>

        <Divider orientation="vertical" />

        <Select size="sm" width="120px" defaultValue={fonts[0].value}>
          {fonts.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </Select>

        <Select size="sm" width="70px" defaultValue={sizes[1].value}>
          {sizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </Select>
      </Flex>

      <Textarea
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        rows={4}
        variant="unstyled"
        sx={{
          '&:focus': {
            outline: 'none',
            boxShadow: 'none',
          },
        }}
      />
    </Box>
  );
};

export default RichTextEditor;
