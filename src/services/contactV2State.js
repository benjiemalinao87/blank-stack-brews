import { create } from 'zustand';
import { supabase } from '../lib/supabaseUnified';
import { normalizePhone } from '../utils/phoneUtils.js';
import { addNameToContacts } from '../utils/contactUtils.js';
import logger from '../utils/logger.js';
import { validateWorkspaceAccess } from '../middleware/workspaceValidation.js';
import { ErrorTypes } from './errorHandling.jsx';
import { debounce } from 'lodash';

// Contact cache implementation for V2
const contactV2Cache = {
  pages: new Map(),
  cursors: new Set(),
  add(cursor, contacts) {
    this.pages.set(cursor, contacts);
    this.cursors.add(cursor);
  },
  get(cursor) {
    return this.pages.get(cursor);
  },
  clear() {
    this.pages.clear();
    this.cursors.clear();
  },
  has(cursor) {
    return this.pages.has(cursor);
  }
};

// Initialize Supabase real-time subscription
let subscription = null;

const setupSubscription = (workspaceId, updateCallback) => {
  // Clean up existing subscription if any
  if (subscription) {
    subscription.unsubscribe();
  }

  // Subscribe to contact changes in the workspace
  subscription = supabase
    .channel('contacts_v2_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contacts',
        filter: `workspace_id=eq.${workspaceId}`
      },
      (payload) => {
        updateCallback(payload);
      }
    )
    .subscribe();

  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
};

/**
 * ContactV2 state management
 * Implements cursor-based pagination and caching for better performance
 * Maintains the new UI design while using real data
 */
const useContactV2Store = create((set, get) => {
  // Initialize with default state
  const initialState = {
    contacts: [],
    filters: {
      status: 'All',
      conversationStatus: 'All',
      source: 'All',
      tags: [],
      market: '',
      leadSource: '',
      appointmentStatus: '',
      opportunityStatus: '',
      createdDateStart: '',
      createdDateEnd: '',
      modifyDateStart: '',
      modifyDateEnd: '',
      metadata: {},
      leadStatusId: ''
    },
    isLoading: false,
    error: null,
    hasNextPage: true,
    totalContacts: 0,
    nextCursor: null,
    searchQuery: '',
    workspaceId: null,
    selectedContacts: [],
    isUpdating: false
  };

  // Handle real-time updates
  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const state = get();

    switch (eventType) {
      case 'UPDATE':
        set({
          contacts: state.contacts.map(contact =>
            contact.id === newRecord.id ? { ...contact, ...newRecord } : contact
          )
        });
        break;
      case 'INSERT':
        set({
          contacts: [...state.contacts, newRecord],
          totalContacts: state.totalContacts + 1
        });
        break;
      case 'DELETE':
        set({
          contacts: state.contacts.filter(contact => contact.id !== oldRecord.id),
          totalContacts: state.totalContacts - 1
        });
        break;
    }
  };

  return {
    ...initialState,
    
    // Initialize real-time subscription
    initializeRealtime: async () => {
      // Clean up existing subscription if any
      if (subscription) {
        subscription.unsubscribe();
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          logger.error('No active session');
          return () => {}; // Return empty cleanup function
        }

        const { data: workspace } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', session.user.id)
          .single();

        if (!workspace) {
          logger.error('No workspace found');
          return () => {}; // Return empty cleanup function
        }

        set({ workspaceId: workspace.workspace_id });
        const cleanup = setupSubscription(workspace.workspace_id, handleRealtimeUpdate);
        
        // Ensure we return a function
        return typeof cleanup === 'function' ? cleanup : () => {};
      } catch (error) {
        logger.error('Error setting up real-time subscription:', error);
        return () => {}; // Return empty cleanup function
      }
    },

    // Load contacts with search and filters
    loadContacts: async (cursor = null, limit = 50) => {
      const state = get();
      const { searchQuery, filters, workspaceId } = state;
      
      if (!workspaceId) {
        logger.error('No workspace ID provided for contacts load');
        set({ 
          error: 'No workspace selected', 
          isLoading: false,
          contacts: [], // Ensure contacts are empty when no workspace is selected
          totalContacts: 0
        });
        return [];
      }
      
      try {
        // Validate workspace access
        const { hasAccess } = await validateWorkspaceAccess(workspaceId, {
          onError: (error, errorType, errorOptions) => {
            set({ error: error.message });
            console.error(`${errorOptions.context}:`, error);
          }
        });

        if (!hasAccess) {
          set({ error: 'Unauthorized workspace access' });
          return;
        }

        // Check if we have cached results for this cursor
        if (cursor && contactV2Cache.has(cursor)) {
          const cachedContacts = contactV2Cache.get(cursor);
          set({ 
            contacts: cursor === null ? cachedContacts : [...state.contacts, ...cachedContacts],
            isLoading: false
          });
          return cachedContacts;
        }
        
        // Start loading
        set({ isLoading: true, error: null });
        
        // Build query with filters
        let query = supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .eq('workspace_id', workspaceId);
        
        // Apply search filter if provided
        if (searchQuery) {
          // Improved search to include firstname and lastname
          query = query.or(`phone_number.ilike.%${searchQuery}%,firstname.ilike.%${searchQuery}%,lastname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
        
        // Apply status filter
        if (filters.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }
        
        // Apply conversation status filter
        if (filters.conversationStatus && filters.conversationStatus !== 'All') {
          query = query.eq('conversation_status', filters.conversationStatus);
        }
        
        // Apply source filter
        if (filters.source && filters.source !== 'All') {
          query = query.eq('source', filters.source);
        }
        
        // Apply tags filter
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }
        
        // Apply market filter
        if (filters.market) {
          query = query.eq('market', filters.market);
        }
        
        // Apply lead source filter
        if (filters.leadSource) {
          query = query.eq('lead_source', filters.leadSource);
        }
        
        // Apply appointment status filter
        if (filters.appointmentStatus) {
          query = query.eq('appointment_status', filters.appointmentStatus);
        }
        
        // Apply opportunity status filter
        if (filters.opportunityStatus) {
          query = query.eq('opportunity_status', filters.opportunityStatus);
        }
        
        // Apply lead status filter
        if (filters.leadStatusId) {
          query = query.eq('lead_status_id', filters.leadStatusId);
        }
        
        // Apply created date range filter
        if (filters.createdDateStart) {
          query = query.gte('created_at', filters.createdDateStart);
          
          if (filters.createdDateEnd) {
            // Add one day to end date for inclusive range
            const endDate = new Date(filters.createdDateEnd);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('created_at', endDate.toISOString().split('T')[0]);
          }
        }
        
        // Apply modified date range filter
        if (filters.modifyDateStart) {
          query = query.gte('updated_at', filters.modifyDateStart);
          
          if (filters.modifyDateEnd) {
            // Add one day to end date for inclusive range
            const endDate = new Date(filters.modifyDateEnd);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('updated_at', endDate.toISOString().split('T')[0]);
          }
        }
        
        // Apply metadata filters if any
        if (filters.metadata && Object.keys(filters.metadata).length > 0) {
          Object.entries(filters.metadata).forEach(([key, value]) => {
            if (value) {
              // Create a JSONB path query for metadata
              const metadataFilter = {};
              metadataFilter[key] = value;
              query = query.contains('metadata', metadataFilter);
            }
          });
        }

        // Apply pagination
        if (cursor) {
          query = query.lt('id', cursor);
        }

        // Order and limit
        const { data, error, count } = await query
          .order('id', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Handle empty results gracefully
        if (!data || data.length === 0) {
          set({
            contacts: cursor ? get().contacts : [], // Keep existing contacts if loading more, otherwise empty
            isLoading: false,
            hasNextPage: false,
            nextCursor: null,
            totalContacts: count || 0,
            error: null // Clear any previous errors
          });
          return [];
        }

        // Process contacts
        const processedContacts = data.map(contact => {
          // Parse tags if they're stored as a JSON string
          let parsedTags = [];
          try {
            if (contact.tags) {
              // If it's a string, try to parse it
              if (typeof contact.tags === 'string') {
                parsedTags = JSON.parse(contact.tags);
              } 
              // If it's already an array, use it directly
              else if (Array.isArray(contact.tags)) {
                parsedTags = contact.tags;
              }
            }
          } catch (e) {
            console.error('Error parsing tags:', e);
            parsedTags = [];
          }

          // Format tags for UI
          const formattedTags = parsedTags.map(tag => {
            // If tag is a string, convert to object
            if (typeof tag === 'string') {
              return {
                label: tag,
                color: getTagColor(tag)
              };
            }
            // If tag is already an object with name/label
            return {
              label: tag.name || tag.label || 'Unknown',
              color: tag.color || getTagColor(tag.name || tag.label || 'Unknown')
            };
          });

          return {
            ...contact,
            tags: formattedTags
          };
        });

        // Update state
        const lastItem = data[data.length - 1];
        const nextCursor = lastItem ? lastItem.id : null;
        const hasNextPage = data.length === limit;

        set({
          contacts: cursor ? [...get().contacts, ...processedContacts] : processedContacts,
          isLoading: false,
          hasNextPage,
          nextCursor,
          totalContacts: count || 0,
          workspaceId: workspaceId,
          error: null // Clear any previous errors
        });

        // Cache the results
        if (cursor) {
          contactV2Cache.add(cursor, processedContacts);
        }

        return processedContacts;
      } catch (error) {
        logger.error('Error loading contacts:', error);
        set({ 
          isLoading: false, 
          error: error.message,
          // Don't clear contacts on error if we're paginating
          contacts: cursor ? get().contacts : [],
          totalContacts: cursor ? get().totalContacts : 0
        });
        return [];
      }
    },

    // Load more contacts (for infinite scroll)
    loadMoreContacts: async () => {
      const { nextCursor, hasNextPage } = get();
      if (hasNextPage && nextCursor) {
        return get().loadContacts(nextCursor);
      }
      return [];
    },

    // Set search query
    searchContacts: (query) => {
      set({ searchQuery: query });
    },
    
    // Debounced search function for better performance
    setSearchQuery: debounce(async (query) => {
      set({ searchQuery: query });
      
      // Reload contacts with the new search query
      const state = get();
      await state.loadContacts(null, 50);
    }, 800), // 800ms debounce

    // Set filters
    setFilters: (newFilters) => {
      const currentFilters = get().filters;
      const updatedFilters = { ...currentFilters, ...newFilters };
      
      set({ 
        filters: updatedFilters,
        // Reset pagination when filters change
        nextCursor: null,
        hasNextPage: true
      });
      
      // Load contacts with new filters
      get().loadContacts();
    },

    // Toggle contact selection
    toggleSelectContact: (contactId) => {
      const { selectedContacts } = get();
      if (selectedContacts.includes(contactId)) {
        set({ selectedContacts: selectedContacts.filter(id => id !== contactId) });
      } else {
        set({ selectedContacts: [...selectedContacts, contactId] });
      }
    },

    // Toggle select all contacts
    toggleSelectAll: () => {
      const { contacts, selectedContacts } = get();
      if (selectedContacts.length === contacts.length) {
        set({ selectedContacts: [] });
      } else {
        set({ selectedContacts: contacts.map(contact => contact.id) });
      }
    },

    // Clear selected contacts
    clearSelectedContacts: () => {
      set({ selectedContacts: [] });
    },

    // Add new contact
    addContact: async (contactData) => {
      const { workspaceId } = get();
      
      try {
        // Validate workspace access
        const { hasAccess } = await validateWorkspaceAccess(workspaceId, {
          onError: (error, errorType, errorOptions) => {
            set({ error: error.message });
            console.error(`${errorOptions.context}:`, error);
          }
        });

        if (!hasAccess) {
          throw new Error('Unauthorized workspace access');
        }

        // Get current workspace ID from contactData
        const workspace_id = contactData.workspace_id;
        if (!workspace_id) {
          throw new Error('No workspace ID provided');
        }
        
        // Normalize phone number if provided
        const phone_number = contactData.phone_number ? normalizePhone(contactData.phone_number) : null;
        if (!phone_number) {
          throw new Error('Phone number is required');
        }
        
        // Validate required fields
        if (!contactData.firstname?.trim()) {
          throw new Error('First name is required');
        }
        
        if (!contactData.lastname?.trim()) {
          throw new Error('Last name is required');
        }
        
        // Check if contact already exists with this phone number
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone_number', phone_number)
          .eq('workspace_id', workspace_id);
          
        if (existingContacts && existingContacts.length > 0) {
          throw new Error('A contact with this phone number already exists');
        }
        
        // Prepare contact data
        const newContact = {
          ...contactData,
          phone_number,
          firstname: contactData.firstname.trim(),
          lastname: contactData.lastname.trim(),
          name: `${contactData.firstname.trim()} ${contactData.lastname.trim()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            company: contactData.company || null,
            status: contactData.status || 'active',
          },
          notes: contactData.notes || null,
          tags: JSON.stringify(contactData.tags || []), // Ensure tags is a JSON string
          opt_in_through: contactData.opt_in_through || 'manual'
        };

        // Insert new contact
        const { data, error } = await supabase
          .from('contacts')
          .insert(newContact)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          throw new Error(error.message);
        }

        // Update local state
        set({
          contacts: [data, ...get().contacts],
          totalContacts: get().totalContacts + 1,
          isLoading: false
        });

        return data;
      } catch (error) {
        logger.error('Error adding contact:', error);
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    // Delete contact
    deleteContact: async (contactId) => {
      const { workspaceId } = get();
      
      try {
        // Validate workspace access
        const { hasAccess } = await validateWorkspaceAccess(workspaceId, {
          onError: (error, errorType, errorOptions) => {
            set({ error: error.message });
            console.error(`${errorOptions.context}:`, error);
          }
        });

        if (!hasAccess) {
          throw new Error('Unauthorized workspace access');
        }

        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId)
          .eq('workspace_id', workspaceId);

        if (error) throw error;

        // Update local state
        set({
          contacts: get().contacts.filter(contact => contact.id !== contactId),
          totalContacts: get().totalContacts - 1,
          selectedContacts: get().selectedContacts.filter(id => id !== contactId),
          isLoading: false
        });

        return true;
      } catch (error) {
        logger.error('Error deleting contact:', error);
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    // Update contact
    updateContact: async (id, updates) => {
      const { workspaceId } = get();
      
      try {
        // Validate workspace access
        const { hasAccess } = await validateWorkspaceAccess(workspaceId, {
          onError: (error, errorType, errorOptions) => {
            set({ error: error.message });
            console.error(`${errorOptions.context}:`, error);
          }
        });

        if (!hasAccess) {
          throw new Error('Unauthorized workspace access');
        }

        // Normalize phone if included in updates
        if (updates.phone_number) {
          updates.phone_number = normalizePhone(updates.phone_number);
        }

        const { data, error } = await supabase
          .from('contacts')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('workspace_id', workspaceId)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        set({
          contacts: get().contacts.map(contact =>
            contact.id === id ? { ...contact, ...data } : contact
          ),
          isLoading: false
        });

        return data;
      } catch (error) {
        logger.error('Error updating contact:', error);
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },

    // Update contact tags
    updateContactTags: async (contactId, tags) => {
      const { workspaceId } = get();
      
      try {
        // Validate workspace access
        const { hasAccess } = await validateWorkspaceAccess(workspaceId, {
          onError: (error, errorType, errorOptions) => {
            set({ error: error.message });
            console.error(`${errorOptions.context}:`, error);
          }
        });

        if (!hasAccess) {
          throw new Error('Unauthorized workspace access');
        }

        // Get current workspace ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');
        
        // Ensure tags is an array
        const tagsArray = Array.isArray(tags) ? tags : [];
        
        // Update the contact in Supabase
        const { data, error } = await supabase
          .from('contacts')
          .update({ 
            tags: tagsArray,
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId)
          .eq('workspace_id', workspaceId)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update the contact in the state
        set(state => {
          const updatedContacts = state.contacts.map(contact => {
            if (contact.id === contactId) {
              // Format tags for UI
              const formattedTags = tagsArray.map(tag => {
                // If tag is a string, convert to object
                if (typeof tag === 'string') {
                  return {
                    label: tag,
                    color: getTagColor(tag)
                  };
                }
                // If tag is already an object with name/label
                return {
                  label: tag.name || tag.label || 'Unknown',
                  color: tag.color || getTagColor(tag.name || tag.label || 'Unknown')
                };
              });
              
              return {
                ...contact,
                tags: formattedTags
              };
            }
            return contact;
          });
          
          return { 
            contacts: updatedContacts,
            isUpdating: false
          };
        });
        
        return data;
      } catch (error) {
        logger.error('Error updating contact tags:', error);
        set({ isUpdating: false, error: error.message });
        throw error;
      }
    },

    // Clear unread count for a contact
    clearUnreadCount: async (contactId) => {
      try {
        const { error } = await supabase
          .from('contacts')
          .update({ unread_count: 0 })
          .eq('id', contactId);

        if (error) throw error;

        // Update local state
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId
              ? { ...contact, unread_count: 0 }
              : contact
          )
        }));
      } catch (error) {
        console.error('Error clearing unread count:', error);
      }
    },

    // Increment unread count for a contact
    incrementUnreadCount: async (contactId) => {
      try {
        const { error } = await supabase.rpc('increment_contact_unread_count', {
          contact_id: contactId
        });

        if (error) throw error;

        // Update local state
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId
              ? { ...contact, unread_count: (contact.unread_count || 0) + 1 }
              : contact
          )
        }));
      } catch (error) {
        console.error('Error incrementing unread count:', error);
      }
    },
  };
});

// Helper function to get consistent color for tags
const getTagColor = (tagName) => {
  const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'cyan'];
  // Use a hash function to get a consistent index
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default useContactV2Store;
