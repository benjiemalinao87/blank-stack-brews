import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseUnified';
import { useWorkspace } from '../contexts/WorkspaceContext';

const NotesContext = createContext();

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();

  // Load notes for the current workspace and folder
  useEffect(() => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    loadNotes();
  }, [currentWorkspace, selectedFolder]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notes')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (selectedFolder) {
        query = query.eq('folder_id', selectedFolder);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading notes:', error);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData) => {
    if (!currentWorkspace) {
      throw new Error('No workspace selected');
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          workspace_id: currentWorkspace.id,
          folder_id: selectedFolder,
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes(prevNotes => [data, ...prevNotes]);
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const updateNote = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prevNotes =>
        prevNotes.map(note => note.id === id ? { ...note, ...data } : note)
      );

      if (selectedNote?.id === id) {
        setSelectedNote(data);
      }

      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const deleteNote = async (id) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const moveNote = async (noteId, newFolderId) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          folder_id: newFolderId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      setNotes(prevNotes =>
        prevNotes.map(note => note.id === noteId ? { ...note, folder_id: newFolderId } : note)
      );

      return data;
    } catch (error) {
      console.error('Error moving note:', error);
      throw error;
    }
  };

  const value = {
    notes,
    selectedNote,
    setSelectedNote,
    selectedFolder,
    setSelectedFolder,
    loading,
    createNote,
    updateNote,
    deleteNote,
    moveNote,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
