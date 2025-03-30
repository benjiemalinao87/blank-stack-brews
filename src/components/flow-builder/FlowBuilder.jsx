import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useStoreApi,
  useReactFlow,
  ReactFlowProvider,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  useColorModeValue,
  useToast,
  useDisclosure,
  Spacer
} from '@chakra-ui/react';
import { Save, Plus, Trash2, Clock, History } from 'lucide-react';
import { nodeComponents, nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import FlowContextMenu from './FlowContextMenu';
import NodeContextMenu from './NodeContextMenu';
import FlowTimelineSidebar from './FlowTimelineSidebar';
import SaveDialog from './SaveDialog';
import { generateUUID } from '../../utils/uuid';
import { saveFlowRevision } from '../../services/flowRevisionService';
import { supabase } from '../../lib/supabaseUnified';

// Minimum distance for proximity connection (in pixels)
const MIN_DISTANCE = 150;

const defaultConnectionSettings = {
  type: 'animated',
  animated: true,
  style: { stroke: '#4299E1', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#4299E1',
    width: 20,
    height: 20,
  },
};

// Style for temporary connection lines during dragging
const tempConnectionSettings = {
  ...defaultConnectionSettings,
  style: { 
    ...defaultConnectionSettings.style,
    stroke: '#4299E1', 
    strokeWidth: 2,
    strokeDasharray: '5,5' 
  },
  animated: true,
};

const FlowBuilderContent = ({ flow, onSave }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(flow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow?.edges || []);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [flowContextMenu, setFlowContextMenu] = useState(null);
  const [saving, setSaving] = useState(false);
  const [flowName, setFlowName] = useState(flow?.name || '');
  const [changeDescription, setChangeDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { isOpen: isTimelineOpen, onOpen: onTimelineOpen, onClose: onTimelineClose } = useDisclosure();
  const toast = useToast();
  const { getNode } = useReactFlow();
  const store = useStoreApi();

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const controlsBg = useColorModeValue('white', 'gray.800');
  const toolbarBg = useColorModeValue('white', 'gray.800');

  // Function to update node data - defined early to avoid reference issues
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...newData,
              updateNodeData, // Use shorthand property
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onConnect = useCallback(
    (params) => {
      // Prevent self-connections
      if (params.source === params.target) {
        return;
      }

      // Add the new edge with a unique ID
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: 'animated',
        animated: true,
        style: { stroke: '#4299E1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4299E1',
          width: 20,
          height: 20,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Function to find the closest node within proximity
  const getClosestEdge = useCallback((node) => {
    const { nodeInternals } = store.getState();
    const storeNodes = Array.from(nodeInternals.values());
    
    // Find the closest node
    const closestNode = storeNodes.reduce(
      (res, n) => {
        if (n.id !== node.id) {
          const dx = n.position.x - node.position.x;
          const dy = n.position.y - node.position.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < res.distance && d < MIN_DISTANCE) {
            res.distance = d;
            res.node = n;
          }
        }

        return res;
      },
      {
        distance: Number.MAX_VALUE,
        node: null,
      }
    );

    if (!closestNode.node) {
      return null;
    }

    // Determine which node should be source and which should be target
    // In this implementation, we'll make the left-most node the source
    const closeNodeIsSource =
      closestNode.node.position.x < node.position.x;

    return {
      id: closeNodeIsSource
        ? `${closestNode.node.id}-${node.id}`
        : `${node.id}-${closestNode.node.id}`,
      source: closeNodeIsSource ? closestNode.node.id : node.id,
      target: closeNodeIsSource ? node.id : closestNode.node.id,
      // Apply temporary connection style
      ...tempConnectionSettings,
      className: 'temp',
    };
  }, [store]);

  // Handle node dragging for proximity connection preview
  const onNodeDrag = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        // Remove any existing temporary edges
        const nextEdges = es.filter((e) => e.className !== 'temp');

        // Add a new temporary edge if we found a close node
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target,
          )
        ) {
          nextEdges.push(closeEdge);
        }

        return nextEdges;
      });
    },
    [getClosestEdge, setEdges]
  );

  // Handle node drag stop to create permanent connections
  const onNodeDragStop = useCallback(
    (_, node) => {
      const closeEdge = getClosestEdge(node);

      setEdges((es) => {
        // Remove any temporary edges
        const nextEdges = es.filter((e) => e.className !== 'temp');

        // Add a permanent edge if we found a close node
        if (
          closeEdge &&
          !nextEdges.find(
            (ne) =>
              ne.source === closeEdge.source && ne.target === closeEdge.target,
          )
        ) {
          // Create a permanent edge with default settings
          const permanentEdge = {
            id: closeEdge.id,
            source: closeEdge.source,
            target: closeEdge.target,
            ...defaultConnectionSettings,
          };
          
          nextEdges.push(permanentEdge);
        }

        return nextEdges;
      });
    },
    [getClosestEdge, setEdges]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      setFlowContextMenu({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    [reactFlowWrapper]
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      setContextMenu({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        nodeId: node.id,
        isNodeMenu: true,
      });
    },
    [reactFlowWrapper]
  );

  const onNodeClick = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    setContextMenu(null);
  }, []);

  const onAddNode = useCallback(
    (type) => {
      if (flowContextMenu) {
        // Create a new node with proper initialization
        const newNode = {
          id: generateUUID(),
          type,
          position: {
            x: flowContextMenu.x,
            y: flowContextMenu.y,
          },
          data: {
            label: nodeTypes[type]?.label || type,
            // Initialize based on node type
            ...(type === 'send-message' && {
              message: {
                type: 'text',
                text: '',
              },
              content: '',
            }),
            ...(type === 'send-email' && {
              subject: '',
              body: '',
              to: [],
              cc: [],
              bcc: [],
            }),
            // Add updateNodeData function to allow nodes to update their data
            updateNodeData,
          },
        };

        setNodes((nds) => nds.concat(newNode));
        setSelectedNode(newNode);
        setFlowContextMenu(null);
      }
    },
    [flowContextMenu, setNodes, nodeTypes, updateNodeData]
  );

  const onDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
      setContextMenu(null);
    },
    [setNodes, setEdges]
  );

  const handleDuplicateNode = useCallback(() => {
    if (contextMenu && contextMenu.nodeId) {
      const nodeId = contextMenu.nodeId;
      const nodeToClone = nodes.find(node => node.id === nodeId);
      
      if (nodeToClone) {
        // Create a deep copy of the node
        const newNode = {
          ...JSON.parse(JSON.stringify(nodeToClone)),
          id: generateUUID(),
          position: {
            x: nodeToClone.position.x + 100, // Offset the position
            y: nodeToClone.position.y + 100,
          },
          data: {
            ...JSON.parse(JSON.stringify(nodeToClone.data)),
            updateNodeData, // Add the updateNodeData function to the new node
          },
          selected: false,
        };
        
        // Add the new node to the flow
        setNodes(nds => [...nds, newNode]);
        
        // Show a toast notification
        toast({
          title: 'Node duplicated',
          description: 'A copy of the node has been created',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    }
  }, [contextMenu, nodes, setNodes, toast, updateNodeData]);

  const handleDeleteNode = useCallback(() => {
    if (contextMenu && contextMenu.nodeId) {
      const nodeId = contextMenu.nodeId;
      
      // Remove the node
      setNodes(nds => nds.filter(node => node.id !== nodeId));
      
      // Remove any connected edges
      setEdges(eds => eds.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
      
      // Show a toast notification
      toast({
        title: 'Node deleted',
        description: 'The node has been removed',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  }, [contextMenu, setNodes, setEdges, toast]);

  const handleSave = () => {
    if (!reactFlowInstance) {
      toast({
        title: 'Error saving flow',
        description: 'Flow instance not initialized. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Open the save dialog to collect change description
    setShowSaveDialog(true);
  };

  const handleSaveCancel = () => {
    setShowSaveDialog(false);
  };

  const handleSaveConfirm = async () => {
    try {
      setSaving(true);
      setShowSaveDialog(false);
      
      const flowData = {
        id: flow?.id,
        name: flowName,
        folder_id: flow?.folder_id,
        workspace_id: flow?.workspace_id || 'default',
        nodes,
        edges,
      };

      console.log("Saving flow with data:", {
        id: flowData.id,
        name: flowData.name,
        workspace_id: flowData.workspace_id,
        nodeCount: flowData.nodes.length,
        edgeCount: flowData.edges.length
      });

      const result = await onSave(flowData);
      
      console.log("Save result:", result);
      
      if (result && result.success) {
        // Only save revision after successful flow save
        const savedFlowId = result.id || flowData.id;
        if (!savedFlowId) {
          console.error("No flow ID returned from save operation");
          throw new Error("Failed to get flow ID after save");
        }

        try {
          // Get current user email from Supabase
          const { data: { user } } = await supabase.auth.getUser();
          const userEmail = user?.email || 'unknown user';
          
          await saveFlowRevision(
            { ...flowData, id: savedFlowId },
            changeDescription || "Manual save by user",
            userEmail
          );
          
          console.log("Flow revision saved successfully");
          
          // Reset change description after successful save
          setChangeDescription('');
          
          toast({
            title: 'Flow saved',
            description: 'Your flow has been saved successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (revisionError) {
          console.error("Error saving flow revision:", revisionError);
          // Show warning but don't treat as error since main save succeeded
          toast({
            title: 'Flow saved with warning',
            description: 'Flow saved but revision history update failed',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        throw new Error(result?.error || 'Failed to save flow');
      }
    } catch (err) {
      console.error("Error in handleSave:", err);
      toast({
        title: 'Error saving flow',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTimeline = () => {
    onTimelineOpen();
  };

  // Initialize flow data when flow changes
  useEffect(() => {
    if (flow) {
      setFlowName(flow.name || '');
      
      // Ensure nodes and edges are properly parsed from the database
      const parsedNodes = Array.isArray(flow.nodes) ? flow.nodes : [];
      const parsedEdges = Array.isArray(flow.edges) ? flow.edges : [];
      
      // Add updateNodeData function to each node
      const nodesWithUpdateFunction = parsedNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          updateNodeData
        }
      }));
      
      console.log('Setting nodes and edges:', {
        nodes: nodesWithUpdateFunction,
        edges: parsedEdges
      });
      
      setNodes(nodesWithUpdateFunction);
      setEdges(parsedEdges);
    }
  }, [flow, setNodes, setEdges, updateNodeData]);

  return (
    <Box 
      position="relative" 
      height="100vh"
      width="100%"
      bg={bgColor}
      ref={reactFlowWrapper}
    >
      {/* Header */}
      <Flex 
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="48px"
        px={4}
        align="center"
        borderBottomWidth="1px"
        borderColor={borderColor}
        bg={headerBg}
        zIndex={1}
      >
        <HStack spacing={2} ml={4}>
          <Box position="relative" id="save-flow-button-container">
            <Button
              leftIcon={<Save size={16} />}
              colorScheme="blue"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              loadingText="Saving..."
              id="save-flow-button"
            >
              Save Flow
            </Button>
          </Box>
          <IconButton
            icon={<History size={16} />}
            aria-label="Flow History"
            size="sm"
            onClick={handleOpenTimeline}
            variant="ghost"
          />
        </HStack>
      </Flex>

      {/* Flow Canvas */}
      <Box 
        position="absolute"
        top="48px"
        left={0}
        right={0}
        bottom={0}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDrag}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={(event, edge) => setSelectedEdge(edge)}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onInit={setReactFlowInstance}
          nodeTypes={nodeComponents}
          edgeTypes={edgeTypes}
          fitView
        >
          <Controls 
            position="bottom-right"
            style={{ 
              background: controlsBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              padding: '4px'
            }}
          />
          <Background 
            variant="dots"
            gap={16}
            size={1}
            color={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
          />
          <MiniMap 
            style={{ 
              background: controlsBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px'
            }}
          />
        </ReactFlow>
      </Box>

      {/* Context Menus */}
      {contextMenu && (
        <NodeContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onDuplicateNode={handleDuplicateNode}
          onDeleteNode={handleDeleteNode}
          node={contextMenu.nodeId ? nodes.find(node => node.id === contextMenu.nodeId) : null}
        />
      )}
      
      {flowContextMenu && (
        <FlowContextMenu
          position={flowContextMenu}
          onClose={() => setFlowContextMenu(null)}
          onAddNode={onAddNode}
        />
      )}
      
      {/* Flow Timeline Sidebar */}
      {flow?.id && (
        <FlowTimelineSidebar 
          flow={flow}
          isOpen={isTimelineOpen}
          onClose={onTimelineClose}
          onRestore={() => {
            // Reload the flow after restore
            if (onSave && flow?.id) {
              onSave({ id: flow.id, action: 'reload' });
            }
          }}
        />
      )}
      
      {/* Save Dialog */}
      <SaveDialog
        isOpen={showSaveDialog}
        onClose={handleSaveCancel}
        onSave={handleSaveConfirm}
        changeDescription={changeDescription}
        setChangeDescription={setChangeDescription}
      />
    </Box>
  );
};

// Wrap the FlowBuilder with ReactFlowProvider to fix the zustand provider error
const FlowBuilder = (props) => {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent {...props} />
    </ReactFlowProvider>
  );
};

export default FlowBuilder;
