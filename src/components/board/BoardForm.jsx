import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { supabase } from '../../lib/supabaseClient';
import boardActivityService from '../../services/boardActivityService';

const BoardForm = ({ open, onClose, board = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone_number: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState([]);

  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name || '',
        description: board.description || '',
        phone_number: board.phone_number || '',
        status: board.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        phone_number: '',
        status: 'active'
      });
    }
  }, [board]);

  useEffect(() => {
    fetchAvailablePhoneNumbers();
  }, []);

  const fetchAvailablePhoneNumbers = async () => {
    try {
      // Fetch all Twilio numbers from your system
      const { data: phoneNumbers, error } = await supabase
        .from('twilio_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailablePhoneNumbers(phoneNumbers || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      // If board exists, update it
      if (board) {
        const { data, error } = await supabase
          .from('boards')
          .update({
            name: formData.name,
            description: formData.description,
            phone_number: formData.phone_number,
            status: formData.status,
            updated_at: new Date()
          })
          .eq('id', board.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        
        // Log board rename activity if name changed
        if (board.name !== formData.name) {
          await boardActivityService.logActivity({
            boardId: board.id,
            workspaceId: board.workspace_id,
            activityType: 'board_renamed',
            description: `Board renamed from "${board.name}" to "${formData.name}"`,
            beforeState: { name: board.name },
            afterState: { name: formData.name }
          });
        }
      } else {
        // Create new board
        const { data, error } = await supabase
          .from('boards')
          .insert({
            name: formData.name,
            description: formData.description,
            phone_number: formData.phone_number,
            status: formData.status,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        
        // Log board creation activity
        await boardActivityService.logActivity({
          boardId: result.id,
          workspaceId: result.workspace_id,
          activityType: 'board_created',
          description: `Board "${formData.name}" created`,
          afterState: { name: formData.name, description: formData.description }
        });
      }

      onSave(result);
      onClose();
    } catch (error) {
      console.error('Error saving board:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{board ? 'Edit Board' : 'Create New Board'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              name="name"
              label="Board Name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Phone Number</InputLabel>
              <Select
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                label="Phone Number"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {availablePhoneNumbers.map((number) => (
                  <MenuItem key={number.phone_number} value={number.phone_number}>
                    {number.phone_number} {number.friendly_name && `(${number.friendly_name})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BoardForm;
