# Trigger-Based Automation for CRM with Supabase

This document outlines the design and implementation of trigger-based automations for our CRM system using Supabase as the backend database.

## Table of Contents

1. [Introduction](#introduction)
2. [Automation Triggers](#automation-triggers)
3. [Implementation Options](#implementation-options)
   - [Database Triggers](#database-triggers)
   - [Database Webhooks](#database-webhooks)
   - [Realtime API](#realtime-api)
   - [Edge Functions](#edge-functions)
4. [Architecture Design](#architecture-design)
5. [Sample Implementation](#sample-implementation)
6. [Multi-tenant Considerations](#multi-tenant-considerations)
7. [Integration with Queue Services](#integration-with-queue-services)

## Introduction

Trigger-based automation allows our CRM to automatically perform actions when specific events occur in the system. For a texting-focused CRM, this is especially valuable for:

- Sending welcome SMS when a new contact is added
- Scheduling follow-up messages when a contact status changes
- Sending reminders before appointments
- Notifying team members about important contact updates
- Syncing data with external systems when records change

## Automation Triggers

Our CRM can leverage the following types of event triggers:

### Contact Module Triggers
- Contact created
- Contact updated (any field or specific fields)
- Contact status changed
- Contact added to a group/segment
- Contact notes added/updated
- Contact engagement metric reached (e.g., 5 interactions)

### Appointment Module Triggers
- Appointment created
- Appointment status changed
- Appointment rescheduled
- Appointment reminder thresholds (24h, 1h before)
- Appointment completed

### Message Module Triggers
- Message received
- Message sent
- Message delivery status changed
- Message replied to
- No response after X days

### System-Level Triggers
- User login/logout
- Workspace settings changed
- API rate limit approaching/reached
- Storage quota thresholds

## Implementation Options

Supabase offers several mechanisms for implementing trigger-based automation, each with their own benefits:

### Database Triggers

Postgres triggers allow us to execute SQL functions automatically when table events (INSERT, UPDATE, DELETE) occur.

```sql
-- Example: Log contact changes to an audit table
CREATE OR REPLACE FUNCTION log_contact_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contact_audit_log(
    contact_id, 
    workspace_id,
    changed_by,
    change_type,
    old_values,
    new_values
  ) VALUES (
    NEW.id,
    NEW.workspace_id,
    current_setting('app.current_user_id', TRUE),
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH ROW
EXECUTE FUNCTION log_contact_changes();
```

**Benefits**:
- Low latency (runs directly in the database)
- Atomic with the database transaction
- Reliable and immediate execution
- No external dependencies

**Limitations**:
- Limited to SQL operations
- Not ideal for long-running processes
- Can impact database performance if complex
- Difficult to manage application-level logic

### Database Webhooks

Supabase Database Webhooks allow you to send HTTP requests to external services when database events occur.

```sql
-- Creating a webhook via SQL (can also be done in Supabase Dashboard)
SELECT
  supabase_functions.create_webhook(
    'contact_update_webhook',
    'https://your-automation-service.com/webhooks/contact-update',
    'contacts',
    'UPDATE'
  );
```

**Benefits**:
- Decouples database events from processing logic
- Can trigger external systems and APIs
- Doesn't impact database performance
- Easier to manage complex business logic

**Limitations**:
- Additional latency
- Potential for failed deliveries
- Requires webhook endpoint management
- No built-in retry mechanism

### Realtime API

Supabase Realtime allows frontend clients to subscribe to database changes in real-time.

```javascript
// Subscribe to contact status changes
const contactSubscription = supabase
  .channel('contacts_status_changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'contacts',
      filter: 'status=eq.new',
    },
    (payload) => {
      // Trigger automation based on status change
      processContactStatusChange(payload.new);
    }
  )
  .subscribe();
```

**Benefits**:
- Real-time updates to the UI
- Client-side processing of changes
- Useful for user notifications
- Can be combined with client-side automation logic

**Limitations**:
- Relies on client being connected
- Not suitable for background processing
- Security implications for sensitive data
- Limited by browser/client capabilities

### Edge Functions

Supabase Edge Functions combined with Database Webhooks provide a serverless way to process database events.

```javascript
// Edge Function triggered by a database webhook
Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Extract contact data
    const { record, old_record } = payload;
    
    // Check if status changed
    if (old_record.status !== record.status) {
      // Trigger appropriate automation
      await triggerStatusChangeAutomation(record);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

**Benefits**:
- Serverless execution (no infrastructure to manage)
- Scales automatically with usage
- Can connect to external APIs and services
- Runs close to your database for low latency

**Limitations**:
- Execution time limits
- Cold start latency
- Limited environment access
- Potential costs at scale

## Architecture Design

For our CRM, we recommend a hybrid approach:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Supabase DB    │────▶│  DB Webhook     │────▶│  Queue Service  │
│  (Triggers)     │     │  or Edge Func   │     │  (BullMQ+Redis) │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │◀────│  Realtime API   │◀────│  Worker Process │
│  (Notifications)│     │  (Updates)      │     │  (Actions)      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Database Triggers** for:
   - Audit logging
   - Data integrity/validation
   - Timestamp management
   - Simple status flags

2. **DB Webhooks + Edge Functions** for:
   - Adding jobs to queue service
   - Lightweight processing
   - Integration with external systems
   - Multi-step workflows

3. **Realtime API** for:
   - UI notifications
   - Real-time dashboard updates
   - User alerts
   - Collaborative features

4. **Queue Service** (existing BullMQ implementation) for:
   - SMS/email sending
   - Long-running processes
   - Scheduled tasks
   - Retry logic for failed operations

## Sample Implementation

### 1. Contact Status Change Automation

When a contact's status changes from "Lead" to "Customer," we want to:
- Send a welcome SMS
- Schedule a follow-up call
- Add them to a specific campaign

```sql
-- 1. Create a tracking table for automation
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Multi-tenant constraint
  CONSTRAINT automation_logs_workspace_constraint UNIQUE (workspace_id, entity_id, automation_type)
);

-- Enable RLS
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can only access their workspace automation logs"
ON automation_logs
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 2. Create a trigger function to detect status changes
CREATE OR REPLACE FUNCTION contact_status_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed from 'lead' to 'customer'
  IF OLD.status = 'lead' AND NEW.status = 'customer' THEN
    -- Insert a record to trigger automation
    INSERT INTO automation_logs(
      workspace_id,
      entity_type,
      entity_id,
      automation_type
    ) VALUES (
      NEW.workspace_id,
      'contact',
      NEW.id,
      'lead_to_customer_conversion'
    )
    ON CONFLICT (workspace_id, entity_id, automation_type)
    DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
CREATE TRIGGER contact_status_change
AFTER UPDATE ON contacts
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION contact_status_change_trigger();
```

### 2. Database Webhook Handler (Edge Function)

```javascript
// edge-functions/automation-webhook.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Queue service URL
const queueServiceUrl = Deno.env.get('QUEUE_SERVICE_URL');

Deno.serve(async (req) => {
  try {
    // Get payload from webhook
    const { type, table, record, old_record, schema } = await req.json();
    
    // Only process automation_logs inserts
    if (schema !== 'public' || table !== 'automation_logs' || type !== 'INSERT') {
      return new Response('Ignored', { status: 200 });
    }
    
    const { id, workspace_id, entity_type, entity_id, automation_type } = record;
    
    // Process based on automation type
    if (automation_type === 'lead_to_customer_conversion') {
      // 1. Get contact details
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', entity_id)
        .eq('workspace_id', workspace_id)
        .single();
        
      if (contactError) throw new Error(`Contact fetch error: ${contactError.message}`);
      
      // 2. Send welcome SMS
      await fetch(`${queueServiceUrl}/api/schedule-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: contact.phone,
          message: `Welcome to our service, ${contact.first_name}! We're excited to have you as a customer.`,
          contactId: contact.id,
          workspaceId: workspace_id,
          delay: 0,
          metadata: { automationId: id }
        })
      });
      
      // 3. Schedule follow-up call in 3 days
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 3);
      
      await supabase.from('appointments').insert({
        contact_id: contact.id,
        workspace_id: workspace_id,
        title: 'Welcome Follow-up Call',
        start_time: followUpDate.toISOString(),
        duration: 30, // minutes
        status: 'scheduled',
        created_by: 'system',
        notes: 'Automated follow-up call for new customer'
      });
      
      // 4. Add to customer campaign
      await supabase.from('campaign_members').insert({
        campaign_id: 'your-welcome-campaign-id',
        contact_id: contact.id,
        workspace_id: workspace_id,
        status: 'active'
      });
      
      // 5. Update automation log
      await supabase
        .from('automation_logs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Handle other automation types here
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Unknown automation type' 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
    
  } catch (error) {
    console.error('Automation error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

### 3. React Frontend Component for Automation Management

```jsx
// AutomationBuilder.jsx
import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Box, Button, Select, Input, Stack, Text, Heading } from '@chakra-ui/react';

export default function AutomationBuilder() {
  const supabase = useSupabaseClient();
  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [automations, setAutomations] = useState([]);
  
  // Fetch available triggers and actions on load
  useEffect(() => {
    // Triggers could be fetched from a config table in Supabase
    setTriggers([
      { id: 'contact_created', name: 'Contact Created' },
      { id: 'contact_status_changed', name: 'Contact Status Changed' },
      { id: 'appointment_scheduled', name: 'Appointment Scheduled' },
      // More triggers...
    ]);
    
    setActions([
      { id: 'send_sms', name: 'Send SMS' },
      { id: 'send_email', name: 'Send Email' },
      { id: 'create_task', name: 'Create Task' },
      { id: 'add_to_campaign', name: 'Add to Campaign' },
      // More actions...
    ]);
    
    // Fetch existing automations
    fetchAutomations();
  }, []);
  
  const fetchAutomations = async () => {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching automations:', error);
      return;
    }
    
    setAutomations(data || []);
  };
  
  const createAutomation = async () => {
    // Example: Create a new automation rule
    const { data, error } = await supabase
      .from('automations')
      .insert({
        name: `${selectedTrigger} → ${selectedAction}`,
        trigger_type: selectedTrigger,
        action_type: selectedAction,
        is_active: true,
        trigger_config: {}, // Would contain trigger-specific config
        action_config: {}   // Would contain action-specific config
      });
      
    if (error) {
      console.error('Error creating automation:', error);
      return;
    }
    
    fetchAutomations();
  };
  
  return (
    <Box p={5}>
      <Heading size="md" mb={4}>Automation Builder</Heading>
      
      <Stack spacing={4} mb={6}>
        <Box>
          <Text mb={2}>When this happens:</Text>
          <Select 
            placeholder="Select a trigger"
            value={selectedTrigger}
            onChange={(e) => setSelectedTrigger(e.target.value)}
          >
            {triggers.map(trigger => (
              <option key={trigger.id} value={trigger.id}>
                {trigger.name}
              </option>
            ))}
          </Select>
        </Box>
        
        <Box>
          <Text mb={2}>Do this:</Text>
          <Select 
            placeholder="Select an action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            {actions.map(action => (
              <option key={action.id} value={action.id}>
                {action.name}
              </option>
            ))}
          </Select>
        </Box>
        
        <Button 
          colorScheme="blue" 
          onClick={createAutomation}
          isDisabled={!selectedTrigger || !selectedAction}
        >
          Create Automation
        </Button>
      </Stack>
      
      <Heading size="sm" mb={3}>Your Automations</Heading>
      {automations.length === 0 ? (
        <Text>No automations created yet.</Text>
      ) : (
        <Stack spacing={3}>
          {automations.map(automation => (
            <Box 
              key={automation.id} 
              p={3} 
              border="1px" 
              borderColor="gray.200" 
              borderRadius="md"
            >
              <Text fontWeight="bold">{automation.name}</Text>
              <Text fontSize="sm">
                Status: {automation.is_active ? 'Active' : 'Inactive'}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
```

## Multi-tenant Considerations

Since our CRM uses a multi-tenant architecture, automations need to be properly isolated by workspace:

1. **Database-Level Isolation**:
   - All automation tables must include `workspace_id`
   - Row Level Security policies must be in place
   - Triggers should validate workspace access

2. **Rate Limiting**:
   - Implement per-workspace limits on automation frequency
   - Monitor automation execution to prevent abuse
   - Implement backoff strategies for frequent triggers

3. **Error Handling**:
   - Isolate errors to prevent cross-tenant leakage
   - Log errors with workspace context for debugging
   - Implement notification systems for automation failures

Example workspace isolation in a trigger:

```sql
CREATE OR REPLACE FUNCTION validate_workspace_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the current user has access to this workspace
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE user_id = auth.uid() AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Access denied to workspace: %', NEW.workspace_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to automation tables
CREATE TRIGGER check_workspace_access_automations
BEFORE INSERT OR UPDATE ON automations
FOR EACH ROW
EXECUTE FUNCTION validate_workspace_access();
```

## Integration with Queue Services

Our existing queue services (BullMQ with Redis) can be leveraged for automation processing:

1. **Edge Function to Queue**:
   - Database webhook triggers Edge Function
   - Edge Function adds job to appropriate queue

2. **Batch Processing**:
   - Group similar automation tasks for efficiency
   - Apply rate limiting at the workspace level

3. **Error Handling and Retries**:
   - Failed automations should be retried with backoff
   - Permanent failures should be logged and notified

Example Edge Function to Queue integration:

```javascript
// Add automation job to queue
const response = await fetch(`${queueServiceUrl}/api/schedule-automation`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    automationType: 'contact_status_change',
    entityId: contact.id,
    workspaceId: workspace_id,
    data: {
      oldStatus: old_record.status,
      newStatus: record.status,
      contactDetails: contact
    },
    priority: 'high'
  })
});
```

By combining Supabase's database capabilities with our existing queue services, we can create a powerful, reliable automation system that enhances our CRM's functionality while maintaining the clean UI design principles that align with our Mac OS design philosophy.
