import { ChatUser } from './index';

// Status types
export interface StatusCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusOption {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  color: string | null;
  is_default: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

// Type for creating a new status option
export interface CreateStatusOptionParams {
  category_id: number;
  name: string;
  description?: string;
  color?: string;
  is_default?: boolean;
  display_order?: number;
}

// Type for updating a status option
export interface UpdateStatusOptionParams {
  name?: string;
  description?: string;
  color?: string;
  is_default?: boolean;
  display_order?: number;
}

// Type for reordering status options
export interface ReorderStatusOptionsParams {
  category_id: number;
  ordered_ids: number[];
}

// Enhanced contact type with status fields
export interface ContactWithStatus extends ChatUser {
  lead_status_id: number | null;
  appointment_status_id: number | null;
  appointment_result_id: number | null;
  
  // Populated status data (joined from status_options)
  lead_status?: StatusOption;
  appointment_status?: StatusOption;
  appointment_result?: StatusOption;
}

// Type for updating a contact's status
export interface UpdateContactStatusParams {
  contact_id: string;
  field: 'lead_status_id' | 'appointment_status_id' | 'appointment_result_id';
  status_id: number | null;
}
