import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  Text,
  IconButton,
  useColorModeValue,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  MessageSquare,
  MessagesSquare,
  Mail,
  Bot,
  Filter,
  Shuffle,
  Clock,
  Zap,
  X,
} from 'lucide-react';
import EmailNode from './EmailNode';
import MessageNode from './MessageNode';

const nodeTypes = {
  'send-message': {
    icon: MessageSquare,
    color: '#00D856',
    label: 'SMS',
  },
  'send-messenger': {
    icon: MessagesSquare,
    color: '#0084FF',
    label: 'Messenger',
  },
  'send-email': {
    icon: Mail,
    color: '#D53F8C',
    label: 'Email',
  },
  'ai-step': {
    icon: Bot,
    color: '#6B46C1',
    label: 'AI Step',
  },
  'action': {
    icon: Zap,
    color: '#ECC94B',
    label: 'Actions',
  },
  'condition': {
    icon: Filter,
    color: '#38B2AC',
    label: 'Condition',
  },
  'randomizer': {
    icon: Shuffle,
    color: '#D53F8C',
    label: 'Randomizer',
  },
  'delay': {
    icon: Clock,
    color: '#DD6B20',
    label: 'Smart Delay',
  },
};

// Map of node types to their custom content components
const customNodeContents = {
  'send-message': MessageNode,
  'send-email': EmailNode,
  // Add other custom node content components here
};

const DefaultNodeContent = ({ data, nodeConfig }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');
  return (
    <Box p={2}>
      <Text color={textColor} fontSize="sm">
        {data.label || nodeConfig?.label || 'Node'}
      </Text>
    </Box>
  );
};

const CustomNode = ({ id, type, data, children }) => {
  const nodeConfig = nodeTypes[type];
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!nodeConfig) return null;

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      position="relative"
      minW="200px"
      maxW="300px"
      _hover={{
        borderColor: 'blue.400',
        boxShadow: 'sm',
      }}
    >
      <HStack spacing={2} mb={3}>
        <Box
          bg={nodeConfig.color}
          p={2}
          borderRadius="md"
        >
          <nodeConfig.icon size={18} color="white" />
        </Box>
        <Text fontWeight="medium">{nodeConfig.label}</Text>
      </HStack>

      {children}

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: nodeConfig.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: nodeConfig.color }}
      />
    </Box>
  );
};

// Create a mapping of all node types to their respective components
const nodeComponents = {};
Object.keys(nodeTypes).forEach(type => {
  nodeComponents[type] = (props) => (
    <CustomNode {...props} type={type}>
      {customNodeContents[type] ? (
        React.createElement(customNodeContents[type], props)
      ) : (
        <DefaultNodeContent {...props} nodeConfig={nodeTypes[type]} />
      )}
    </CustomNode>
  );
});

export { nodeComponents, nodeTypes };
