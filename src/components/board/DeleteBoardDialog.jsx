import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const DeleteBoardDialog = ({ open, onClose, onConfirm, boardName }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Board</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
          <WarningIcon color="error" sx={{ fontSize: 48 }} />
          <Typography>
            Are you sure you want to delete this board? This action cannot be undone.
          </Typography>
          <Typography color="error" variant="body2">
            Once you delete a board, there is no going back. Please be certain.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteBoardDialog;
