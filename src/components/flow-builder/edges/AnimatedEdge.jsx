import React from 'react';
import { BaseEdge, getSmoothStepPath, useReactFlow } from 'reactflow';

/**
 * AnimatedEdge component that creates a visually enhanced edge with animated elements
 * Based on ReactFlow's example: https://reactflow.dev/examples/edges/animating-edges
 */
const AnimatedEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const { getNodes } = useReactFlow();
  const nodes = getNodes();
  
  // Find source and target nodes
  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  
  // Determine edge color based on node types (optional customization)
  const getEdgeColor = () => {
    if (!sourceNode || !targetNode) return '#4299E1'; // default blue
    
    // You can customize colors based on node types if needed
    return '#4299E1'; // Default to blue
  };

  // Get the path for the edge
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = getEdgeColor();
  
  return (
    <>
      {/* Base edge */}
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{
          ...style,
          stroke: color,
          strokeWidth: 2,
        }}
        markerEnd={markerEnd}
      />
      
      {/* Animated circle */}
      <circle r="4" fill={color}>
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
      
      {/* Optional second circle for more dynamic animation */}
      <circle r="3" fill={color} opacity="0.6">
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </>
  );
};

export default AnimatedEdge;
