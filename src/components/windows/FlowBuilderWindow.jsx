import React, { useState } from 'react';
import { DraggableWindow } from '../window/DraggableWindow.jsx';
import FlowManagerWindow from '../flow-builder/FlowManagerWindow.jsx';
import FlowBuilder from '../flow-builder/FlowBuilder.jsx';
import { Box, useToast } from '@chakra-ui/react';
import { supabase } from '../../services/supabase.js';
import { useWorkspace } from '../../contexts/WorkspaceContext.jsx';
import { generateUUID } from '../../utils/uuid.js';
import { ReactFlowProvider } from 'reactflow';

const FlowBuilderWindow = ({ onClose }) => {
  const { currentWorkspace } = useWorkspace();
  const [selectedFlow, setSelectedFlow] = useState(null);
  const toast = useToast();

  const handleSaveFlow = async (flowData) => {
    try {
      // Check if this is a reload action
      if (flowData.action === 'reload' && flowData.id) {
        // Fetch the latest flow data
        const { data: reloadedFlow, error: reloadError } = await supabase
          .from('flows')
          .select('*')
          .eq('id', flowData.id)
          .single();
          
        if (reloadError) throw reloadError;
        
        // Update the selected flow with the reloaded data
        setSelectedFlow({
          ...reloadedFlow,
          nodes: Array.isArray(reloadedFlow.nodes) ? reloadedFlow.nodes : [],
          edges: Array.isArray(reloadedFlow.edges) ? reloadedFlow.edges : []
        });
        
        return { success: true, id: reloadedFlow.id };
      }
      
      // Always preserve the original flow ID when editing an existing flow
      const flowId = selectedFlow?.id || flowData.id || generateUUID();
      
      console.log('Saving flow with data:', {
        id: flowId,
        ...flowData,
        workspace_id: currentWorkspace?.id,
      });

      // Ensure we have a valid workspace_id
      if (!currentWorkspace?.id) {
        throw new Error('No workspace selected. Please select a workspace first.');
      }

      // Ensure folder_id is preserved from the original flow data
      const folder_id = selectedFlow?.folder_id || flowData.folder_id || null;

      // Ensure nodes and edges are properly stringified for database storage
      // This is critical to ensure the data is saved correctly
      const { data: savedFlow, error } = await supabase
        .from('flows')
        .upsert({
          id: flowId, // Use the preserved ID to ensure we update the existing flow
          name: flowData.name,
          workspace_id: currentWorkspace.id,
          folder_id: folder_id, // Use preserved folder_id
          nodes: Array.isArray(flowData.nodes) ? flowData.nodes : [],
          edges: Array.isArray(flowData.edges) ? flowData.edges : [],
          created_at: selectedFlow?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving flow:', error);
        throw error;
      }

      console.log('Flow saved successfully:', savedFlow);

      // Update selectedFlow with saved data to preserve folder_id
      setSelectedFlow(savedFlow);
      
      // Return a properly structured response
      return { success: true, id: savedFlow.id };
    } catch (error) {
      console.error('Error saving flow:', error);
      return { 
        success: false, 
        error: error.message || 'An unknown error occurred while saving the flow'
      };
    }
  };

  // If no flow is selected, show the FlowManager
  if (!selectedFlow) {
    return <FlowManagerWindow 
      onClose={onClose} 
      onFlowSelect={(flow) => {
        console.log('Selected flow:', flow);
        // Parse nodes and edges if they're stored as strings
        const parsedFlow = {
          ...flow,
          nodes: Array.isArray(flow.nodes) ? flow.nodes : [],
          edges: Array.isArray(flow.edges) ? flow.edges : []
        };
        setSelectedFlow(parsedFlow);
      }}
    />;
  }

  // If a flow is selected, show the FlowBuilder
  return (
    <DraggableWindow
      title={selectedFlow.name || "New Flow"}
      onClose={() => setSelectedFlow(null)}
      defaultPosition={{ x: 50, y: 50 }}
      defaultSize={{ width: 1400, height: 900 }}
      minSize={{ width: 1000, height: 700 }}
    >
      <Box height="100%" width="100%" bg="white">
        <ReactFlowProvider>
          <FlowBuilder 
            flow={selectedFlow}
            onClose={() => setSelectedFlow(null)}
            onSave={handleSaveFlow}
          />
        </ReactFlowProvider>
      </Box>
    </DraggableWindow>
  );
};

export default FlowBuilderWindow;
