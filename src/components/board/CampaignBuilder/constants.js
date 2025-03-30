export const CAMPAIGN_STEPS = [
  { title: 'Select Audience', description: 'Choose your target segment' },
  { title: 'Create Nodes', description: 'Design your campaign flow' },
  { title: 'Review & Launch', description: 'Finalize and activate' },
];

export const SEGMENTS = [
  { id: 'new_contacts', label: 'New Contacts' },
  { id: 'active_leads', label: 'Active Leads' },
  { id: 'cold_leads', label: 'Cold Leads' },
];

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};
