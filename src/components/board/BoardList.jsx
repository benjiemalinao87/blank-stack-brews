import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, Button, Card, CardContent, Typography, Grid, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import GroupIcon from '@mui/icons-material/Group';
import BoardForm from './BoardForm';
import DeleteBoardDialog from './DeleteBoardDialog';

const BoardList = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          board_contacts (
            id,
            contact_id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = () => {
    setSelectedBoard(null);
    setFormOpen(true);
  };

  const handleEditBoard = (board) => {
    setSelectedBoard(board);
    setFormOpen(true);
  };

  const handleDeleteClick = (board) => {
    setBoardToDelete(board);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!boardToDelete) return;
    
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardToDelete.id);

      if (error) throw error;
      fetchBoards();
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBoardToDelete(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedBoard(null);
  };

  const handleFormSave = () => {
    fetchBoards();
  };

  if (loading) {
    return <Box p={3}>Loading boards...</Box>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Boards</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateBoard}
        >
          Create Board
        </Button>
      </Box>

      <Grid container spacing={3}>
        {boards.map((board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {board.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {board.description || 'No description'}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Edit Board">
                      <IconButton size="small" onClick={() => handleEditBoard(board)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Board">
                      <IconButton size="small" onClick={() => handleDeleteClick(board)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box mt={2} display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon fontSize="small" color={board.phone_number ? "primary" : "disabled"} />
                    <Typography variant="body2" ml={1}>
                      {board.phone_number || 'No phone number'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <GroupIcon fontSize="small" />
                    <Typography variant="body2" ml={1}>
                      {board.board_contacts?.length || 0} contacts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <BoardForm
        open={formOpen}
        onClose={handleFormClose}
        board={selectedBoard}
        onSave={handleFormSave}
      />

      <DeleteBoardDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        boardName={boardToDelete?.name}
      />
    </Box>
  );
};

export default BoardList;
