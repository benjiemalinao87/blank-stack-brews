import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Box,
  HStack,
  IconButton,
  Tooltip,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import {
  BiBold,
  BiItalic,
  BiStrikethrough,
  BiCode,
  BiLink,
  BiHighlight,
  BiListUl,
  BiListOl,
  BiCodeBlock,
  BiParagraph,
} from 'react-icons/bi';

const lowlight = createLowlight(common);

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const buttonStyle = {
    size: 'sm',
    variant: 'ghost',
  };

  return (
    <HStack spacing={1} p={2} overflowX="auto" flexShrink={0}>
      <Tooltip label="Bold (⌘+B)">
        <IconButton
          {...buttonStyle}
          icon={<BiBold />}
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
      </Tooltip>
      <Tooltip label="Italic (⌘+I)">
        <IconButton
          {...buttonStyle}
          icon={<BiItalic />}
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
      </Tooltip>
      <Tooltip label="Strikethrough (⌘+Shift+X)">
        <IconButton
          {...buttonStyle}
          icon={<BiStrikethrough />}
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </Tooltip>
      <Tooltip label="Code (⌘+E)">
        <IconButton
          {...buttonStyle}
          icon={<BiCode />}
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
      </Tooltip>
      <Divider orientation="vertical" h="24px" />
      <Tooltip label="Highlight">
        <IconButton
          {...buttonStyle}
          icon={<BiHighlight />}
          isActive={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        />
      </Tooltip>
      <Tooltip label="Link (⌘+K)">
        <IconButton
          {...buttonStyle}
          icon={<BiLink />}
          isActive={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        />
      </Tooltip>
      <Divider orientation="vertical" h="24px" />
      <Tooltip label="Bullet List (⌘+Shift+8)">
        <IconButton
          {...buttonStyle}
          icon={<BiListUl />}
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </Tooltip>
      <Tooltip label="Numbered List (⌘+Shift+7)">
        <IconButton
          {...buttonStyle}
          icon={<BiListOl />}
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </Tooltip>
      <Divider orientation="vertical" h="24px" />
      <Tooltip label="Code Block (⌘+Alt+C)">
        <IconButton
          {...buttonStyle}
          icon={<BiCodeBlock />}
          isActive={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
      </Tooltip>
      <Tooltip label="Paragraph (⌘+Alt+0)">
        <IconButton
          {...buttonStyle}
          icon={<BiParagraph />}
          isActive={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
      </Tooltip>
    </HStack>
  );
};

const RichTextEditor = ({ content, onChange, placeholder }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      overflow="hidden"
    >
      {/* Sticky Toolbar */}
      <Box 
        position="sticky"
        top={0}
        zIndex={1}
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        flexShrink={0}
      >
        <MenuBar editor={editor} />
        <Divider />
      </Box>

      {/* Scrollable Content */}
      <Box 
        flex="1"
        overflow="auto"
        p={4}
        css={{
          '.ProseMirror': {
            minHeight: '200px',
            outline: 'none',
            '& p.is-editor-empty:first-child::before': {
              content: 'attr(data-placeholder)',
              color: 'gray.400',
              float: 'left',
              pointerEvents: 'none',
              height: 0,
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default RichTextEditor;
