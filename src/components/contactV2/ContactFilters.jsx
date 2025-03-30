import React, { useState, useEffect } from "react";
import {
  Box,
  Select,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import useContactV2Store from "../../services/contactV2State";
import { supabase } from "../../lib/supabaseClient.js";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const ContactFilters = () => {
  const { filters, setFilters } = useContactV2Store();
  const [statusOptions, setStatusOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();
  
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    const fetchStatusOptions = async () => {
      if (!currentWorkspace?.id) return;

      try {
        // First get the Lead Status category
        const { data: categories } = await supabase
          .from('status_categories')
          .select('id')
          .eq('workspace_id', currentWorkspace.id)
          .eq('name', 'Lead Status')
          .single();

        if (!categories) return;

        // Then get all status options for this category
        const { data: statuses } = await supabase
          .from('status_options')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .eq('category_id', categories.id)
          .order('display_order', { ascending: true });

        setStatusOptions(statuses || []);
      } catch (error) {
        console.error('Error fetching status options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatusOptions();
  }, [currentWorkspace?.id]);
  
  const handleStatusChange = (e) => {
    const statusId = e.target.value;
    setFilters({
      ...filters,
      leadStatusId: statusId === "all" ? null : statusId
    });
  };

  if (isLoading) {
    return (
      <Box mb={3} width="200px">
        <Spinner size="sm" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box mb={3} width="200px">
      <Select
        size="sm"
        value={filters.leadStatusId || "all"}
        onChange={handleStatusChange}
        bg={bgColor}
        borderColor={borderColor}
        borderRadius="md"
        _hover={{ borderColor: "blue.500" }}
        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
      >
        <option value="all">All Leads</option>
        {statusOptions.map(status => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default ContactFilters;
