import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Tooltip,
  Grid,
  Badge,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Star, Zap } from 'lucide-react';
import { SKILL_TREES } from '../constants';
import { skillNodeUnlockAnimation } from '../utils/animations';
import { SkillTreeNode as ISkillTreeNode } from '../types';

interface NodeConnectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isUnlocked: boolean;
}

const NodeConnection = ({ startX, startY, endX, endY, isUnlocked }: NodeConnectionProps) => {
  const strokeColor = useColorModeValue(
    isUnlocked ? 'blue.500' : 'gray.300',
    isUnlocked ? 'blue.300' : 'gray.600'
  );

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <motion.line
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray={isUnlocked ? "0" : "5,5"}
      />
    </svg>
  );
};

const SkillNode = ({ 
  node, 
  isUnlockable, 
  onUnlock,
  position,
}: { 
  node: ISkillTreeNode;
  isUnlockable: boolean;
  onUnlock: (nodeId: string) => void;
  position: { x: number; y: number };
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <motion.div
      {...(node.isUnlocked ? skillNodeUnlockAnimation : {})}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Tooltip
        label={
          <VStack spacing={2} p={2}>
            <Text fontWeight="bold">{node.name}</Text>
            <Text fontSize="sm">{node.description}</Text>
            <Badge colorScheme="purple">{node.bonus}</Badge>
            <Text fontSize="xs" color="gray.500">
              Required Points: {node.requiredPoints}
            </Text>
          </VStack>
        }
        placement="top"
        hasArrow
      >
        <Box
          w="100px"
          h="100px"
          bg={bgColor}
          borderRadius="full"
          border="2px solid"
          borderColor={node.isUnlocked ? 'blue.500' : borderColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor={isUnlockable ? 'pointer' : 'default'}
          onClick={() => isUnlockable && onUnlock(node.id)}
          position="relative"
          _hover={isUnlockable ? {
            transform: 'scale(1.1)',
            shadow: 'lg',
          } : {}}
          transition="all 0.2s"
        >
          <VStack spacing={1}>
            {node.isUnlocked ? (
              <Zap size={24} color="gold" />
            ) : (
              <Lock size={24} />
            )}
            <Text fontSize="xs" fontWeight="bold" textAlign="center">
              {node.name}
            </Text>
          </VStack>

          {node.isUnlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: 'green.500',
                borderRadius: '50%',
                padding: '4px',
              }}
            >
              <Unlock size={12} color="white" />
            </motion.div>
          )}
        </Box>
      </Tooltip>
    </motion.div>
  );
};

export const SkillTree = () => {
  const [selectedTree, setSelectedTree] = useState(SKILL_TREES[0].id);
  const [availablePoints, setAvailablePoints] = useState(500); // Mock value
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState(SKILL_TREES[0].nodes);

  const currentTree = SKILL_TREES.find(tree => tree.id === selectedTree);

  const handleUnlock = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.isUnlocked || node.requiredPoints > availablePoints) return;

    // Check if all dependencies are unlocked
    const canUnlock = node.dependencies.every(depId => 
      nodes.find(n => n.id === depId)?.isUnlocked
    );

    if (!canUnlock) return;

    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, isUnlocked: true } : n
    ));
    setAvailablePoints(prev => prev - node.requiredPoints);
  };

  const getNodePosition = (level: number, index: number) => {
    const levelSpacing = 150;
    const horizontalSpacing = 200;
    const nodesInLevel = nodes.filter(n => n.level === level).length;
    const levelOffset = (nodesInLevel - 1) * horizontalSpacing / 2;
    
    return {
      x: (containerRef.current?.clientWidth || 0) / 2 - levelOffset + index * horizontalSpacing,
      y: level * levelSpacing + 100
    };
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <HStack justify="space-between">
        <Text fontSize="2xl" fontWeight="bold">Skill Tree</Text>
        <HStack>
          <Star size={16} />
          <Text>{availablePoints} Points Available</Text>
        </HStack>
      </HStack>

      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        {SKILL_TREES.map((tree) => (
          <Button
            key={tree.id}
            onClick={() => setSelectedTree(tree.id)}
            variant={selectedTree === tree.id ? 'solid' : 'outline'}
            colorScheme="blue"
            leftIcon={<Star size={16} />}
          >
            {tree.name}
          </Button>
        ))}
      </Grid>

      <Box
        ref={containerRef}
        position="relative"
        h="600px"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        borderRadius="lg"
        p={4}
        overflow="hidden"
      >
        {/* Draw connections between nodes */}
        {nodes.map(node => 
          node.dependencies.map(depId => {
            const dependencyNode = nodes.find(n => n.id === depId);
            if (!dependencyNode) return null;

            const startPos = getNodePosition(dependencyNode.level, 
              nodes.filter(n => n.level === dependencyNode.level).indexOf(dependencyNode));
            const endPos = getNodePosition(node.level,
              nodes.filter(n => n.level === node.level).indexOf(node));

            return (
              <NodeConnection
                key={`${depId}-${node.id}`}
                startX={startPos.x}
                startY={startPos.y}
                endX={endPos.x}
                endY={endPos.y}
                isUnlocked={node.isUnlocked && dependencyNode.isUnlocked}
              />
            );
          })
        )}

        {/* Render nodes */}
        {nodes.map((node, index) => {
          const position = getNodePosition(node.level,
            nodes.filter(n => n.level === node.level).indexOf(node));

          const isUnlockable = !node.isUnlocked && 
            node.requiredPoints <= availablePoints &&
            node.dependencies.every(depId => 
              nodes.find(n => n.id === depId)?.isUnlocked
            );

          return (
            <SkillNode
              key={node.id}
              node={node}
              isUnlockable={isUnlockable}
              onUnlock={handleUnlock}
              position={position}
            />
          );
        })}
      </Box>
    </VStack>
  );
}; 