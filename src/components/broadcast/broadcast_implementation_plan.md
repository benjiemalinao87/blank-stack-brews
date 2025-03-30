# Broadcast Feature Implementation Plan

## Current Status

### Database Implementation ✅
- Tables created and verified:
  - `broadcasts`
  - `broadcast_sequences`
  - `broadcast_recipients`
- Performance optimizations in place:
  - GIN index for metadata JSONB
  - Indexes on common query patterns
  - Efficient audience filtering function

### Audience Filtering ✅
- SQL function `get_broadcast_audience_v3` implemented and tested
- Supports:
  - Metadata filtering (custom fields)
  - Lead source filtering
  - Market/product filtering
  - Contact method filtering
- Returns:
  - Estimated recipient count
  - Recipient IDs
  - Phone numbers
  - Email addresses

### Frontend Implementation 🟡
- Audience Selection Component ✅
  - Filter UI with field validation
  - Real-time audience preview
  - Support for all filter types
  - JSON metadata filtering
  - Clear user feedback
  - Loading states and error handling

- Broadcast Composition 🟡
  - Message template editor
  - Variable substitution
  - Preview functionality
  - Character count
  - Media attachment support

- Scheduling Interface 🔴
  - Date/time picker
  - Timezone support
  - Recurring broadcast options
  - Batch size configuration

- Tracking Dashboard 🔴
  - Delivery status
  - Open/click rates
  - Error reporting
  - Analytics visualization

### API Endpoints
- `/api/broadcast/audience` ✅
  - Returns filtered audience data
  - Supports all filter types
  - Rate limited and optimized

- `/api/broadcast/create` 🟡
  - Creates new broadcast
  - Validates recipients
  - Schedules delivery

- `/api/broadcast/status` 🔴
  - Real-time status updates
  - WebSocket integration
  - Error reporting

## Next Steps

### Phase 5: Backend API Migration
1. Backend API Development
   - [ ] Set up Node.js/Express backend service
   - [ ] Create API endpoints:
     - POST /api/broadcast/audience (migrate from direct Supabase)
     - POST /api/broadcast/create (migrate from direct Supabase)
     - GET /api/broadcast/status (migrate from direct Supabase)
   - [ ] Implement rate limiting and request validation
   - [ ] Add monitoring and logging
   - [ ] Set up error tracking

2. Frontend Migration
   - [ ] Create API service layer to abstract data source
   - [ ] Update components to use API service instead of direct Supabase
   - [ ] Implement retry logic and error handling
   - [ ] Add loading states and error boundaries

3. Infrastructure Setup
   - [ ] Set up CI/CD pipeline for backend
   - [ ] Configure monitoring and alerting
   - [ ] Implement horizontal scaling
   - [ ] Set up staging environment

4. Migration Strategy
   - [ ] Feature flags for gradual migration
   - [ ] Dual-write period for validation
   - [ ] Monitoring dashboard for comparison
   - [ ] Rollback plan
   - [ ] Performance baseline metrics

5. Testing & Validation
   - [ ] Load testing new API endpoints
   - [ ] Compare performance metrics
   - [ ] Validate error handling
   - [ ] End-to-end testing
   - [ ] Security testing

Estimated Timeline:
- Backend API Development: 5 days
- Frontend Migration: 3 days
- Infrastructure Setup: 2 days
- Testing & Validation: 3 days
- Gradual Rollout: 2 days
Total: ~15 days

## Lessons Learned
1. Always test SQL functions with large datasets
2. Keep UI components focused and reusable
3. Provide clear feedback for user actions
4. Handle edge cases in filter validation
5. Use proper error boundaries
6. Maintain clear separation of concerns

## Performance Considerations
- Batch processing for large audiences
- Rate limiting for API calls
- Caching for frequent queries
- Efficient database indexes
- Optimized SQL functions

## Security Measures
- Input validation
- Rate limiting
- Access control
- Data encryption
- Audit logging

## Current State Analysis

### UI Review
The current UI implementation aligns well with requirements, featuring:
1. ✅ Broadcast Type Selection (Email/SMS)
2. ✅ Audience Selection with Filters
3. ✅ Real-time Audience Estimation
4. ✅ Message Composition
5. ✅ Scheduling Options
6. ✅ Tracking Interface

### Required Database Tables
We need to verify these tables in Supabase:

1. `broadcasts`
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'broadcasts'
   );
   ```
   Expected columns:
   - id (uuid)
   - workspace_id (uuid)
   - type (enum: 'email', 'sms')
   - status (enum: 'draft', 'scheduled', 'sending', 'completed', 'failed')
   - created_at (timestamp)
   - updated_at (timestamp)

2. `broadcast_sequences`
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'broadcast_sequences'
   );
   ```
   Expected columns:
   - id (uuid)
   - broadcast_id (uuid)
   - day_number (integer)
   - scheduled_time (timestamp)
   - content (text)
   - metadata (jsonb)

3. `broadcast_recipients`
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'broadcast_recipients'
   );
   ```
   Expected columns:
   - id (uuid)
   - broadcast_id (uuid)
   - contact_id (uuid)
   - status (enum: 'pending', 'delivered', 'failed')
   - delivery_data (jsonb)
   - sent_at (timestamp)

## Database Implementation Status

### Tables Verified
1. ✅ `broadcasts` table
   - Contains campaign details, type, status, scheduling
   - Has proper constraints for type and status
   - Includes workspace relationship

2. ✅ `broadcast_sequences` table
   - Supports multi-day sequences
   - Links to broadcasts
   - Includes scheduling and content

3. ✅ `broadcast_recipients` table
   - Tracks delivery status
   - Stores contact methods
   - Includes Twilio status tracking

### Audience Filtering Implementation
Successfully implemented and tested `get_broadcast_audience_v3` function that supports:

1. ✅ Metadata Filtering
   ```sql
   -- Example: Active status
   metadata_filter = '{"status": "active"}'::jsonb
   ```

2. ✅ Lead Source Filtering
   ```sql
   -- Verified sources: 'Website', 'SMS', 'Facebook'
   lead_source = 'Website'
   ```

3. ✅ Market/Product Filtering
   ```sql
   -- Verified values
   market = 'CIA'
   product = 'Doors'
   ```

4. ✅ Contact Method Filtering
   - SMS: Requires valid phone_number
   - Email: Requires valid email
   - Both: Either contact method

### Performance Optimizations
1. ✅ Added GIN index for metadata JSONB
2. ✅ Added indexes for common query patterns
3. ✅ Optimized recipient tracking queries

## Implementation Steps

### Phase 1: Database & Backend Setup
1. Verify existing tables and create missing ones
2. Implement database functions:
   - createBroadcast
   - updateBroadcastStatus
   - getBroadcastRecipients
   - updateRecipientStatus

### Phase 2: Queue Service Integration
1. Create queue service endpoints:
   - POST /api/queue/broadcast/schedule
   - POST /api/queue/broadcast/send-immediate
2. Implement retry logic and error handling
3. Add Twilio status webhook handler

### Phase 3: Frontend Components
1. BroadcastTypeSelector
   - Email/SMS toggle
   - Type-specific validation

2. AudienceSelector
   - Dynamic filter generation from contacts table
   - Real-time audience count
   - Filter persistence

3. BroadcastComposer
   - Rich text editor for email
   - Character counter for SMS
   - Variable insertion
   - Multi-day sequence support

4. SchedulingComponent
   - Immediate/scheduled toggle
   - DateTime picker
   - Timezone handling

5. TrackingDashboard
   - Real-time status updates
   - Delivery statistics
   - Export functionality

### Phase 4: Integration & Testing
1. Connect frontend to Supabase
2. Implement WebSocket for real-time updates
3. Add error boundaries
4. Implement comprehensive testing:
   - Unit tests
   - Integration tests
   - E2E tests

## Technical Considerations

### Performance
1. Implement pagination for large recipient lists
2. Cache audience counts
3. Optimize database queries
4. Use WebSocket for real-time updates

### Security
1. Rate limiting
2. Input validation
3. Permission checks
4. Audit logging

### Scalability
1. Batch processing for large broadcasts
2. Queue management
3. Retry mechanisms
4. Error handling

## Validation Checklist

### Database
- [ ] Verify all required tables exist
- [ ] Check column types and constraints
- [ ] Test database functions
- [ ] Verify indexes for performance

### Frontend
- [ ] Test all filter combinations
- [ ] Verify real-time updates
- [ ] Test multi-day sequence creation
- [ ] Validate scheduling functionality

### Integration
- [ ] Test queue service integration
- [ ] Verify Twilio webhook handling
- [ ] Check email service integration
- [ ] Test error scenarios

## Frontend Implementation Tasks

### 1. Audience Selection Component
```typescript
interface AudienceFilter {
  metadata?: Record<string, any>;
  leadSource?: string;
  market?: string;
  product?: string;
}

interface AudienceStats {
  estimatedRecipients: number;
  recipientPhones?: string[];
  recipientEmails?: string[];
}
```

### 2. Real-time Audience Preview
- Implement debounced API calls to get_broadcast_audience_v3
- Show estimated recipient count
- Display contact method breakdown (SMS/Email)

### 3. Broadcast Composition
- Rich text editor for email
- Character counter for SMS
- Variable insertion support
- Multi-day sequence builder

### 4. Scheduling Interface
- Immediate sending option
- Future scheduling with timezone support
- Sequence scheduling with intervals

### 5. Tracking Dashboard
- Real-time delivery status
- Success/Failure metrics
- Detailed recipient status

## API Endpoints Needed

1. Audience Filtering
```typescript
POST /api/broadcasts/estimate-audience
Body: {
  workspaceId: string;
  filters: AudienceFilter;
  broadcastType: 'sms' | 'email';
}
```

2. Broadcast Creation
```typescript
POST /api/broadcasts
Body: {
  workspaceId: string;
  type: 'sms' | 'email';
  audience: AudienceFilter;
  content: string | EmailContent;
  schedule?: Date;
  sequences?: BroadcastSequence[];
}
```

3. Status Updates
```typescript
GET /api/broadcasts/:id/status
Response: {
  totalRecipients: number;
  delivered: number;
  failed: number;
  pending: number;
}
```

## Next Steps

1. Frontend Development
   - [ ] Implement AudienceSelector component
   - [ ] Build BroadcastComposer
   - [ ] Create SchedulingInterface
   - [ ] Develop TrackingDashboard

2. Backend Integration
   - [ ] Create API endpoints
   - [ ] Implement queue service integration
   - [ ] Set up WebSocket for real-time updates

3. Testing
   - [ ] Unit tests for components
   - [ ] Integration tests for API
   - [ ] End-to-end testing
   - [ ] Performance testing

4. Documentation
   - [ ] API documentation
   - [ ] Component usage guide
   - [ ] Database schema documentation
   - [ ] Deployment guide

5. Run SQL verification queries
6. Review existing table structures
7. Document any gaps between current and required schema
8. Create implementation tickets
9. Set up monitoring and logging
10. Plan phased rollout 



## Unstructured 

We have two sets of APIs:
Our Backend APIs (https://cc.automate8.com):

/api/broadcast/audience  - For getting filtered contacts
/api/broadcast/create   - For creating broadcast records
/api/broadcast/status   - For checking broadcast status


Queue Service APIs (https://queue-services-production.up.railway.app):

/api/schedule-sms    - For scheduling SMS messages
/api/schedule-email  - For scheduling email messages

These APIs handle the actual message delivery.
The flow should be:
User creates broadcast → /api/broadcast/create
System gets audience → /api/broadcast/audience
When ready to send:
For SMS: Call queue service → /api/schedule-sms
For Email: Call queue service → /api/schedule-email
Track status → /api/broadcast/status


/api/broadcast/audience
We already have get_broadcast_audience_v3 SQL function in Supabase
UI can directly call this via Supabase client
Audience filtering is handled at database level
/api/broadcast/create
We can directly insert into broadcasts table via Supabase
All validations can be handled by database constraints
UI already has Supabase connection
/api/broadcast/status
We have active_broadcasts view in Supabase
Can use Supabase real-time subscriptions for status updates
Status tracking tables already set up

The flow should be:
UI → Supabase (create broadcast & get audience)
UI → Queue Service (schedule messages)
Queue Service → Twilio/Email Service (send messages)
UI → Supabase real-time (track status)
So you're correct - we should focus on:
Using existing Supabase tables/functions
Queue service integration for actual message delivery
Real-time status tracking via Supabase subscriptions


Approach 1: Direct Supabase
UI → Supabase → Queue Service → Twilio/Email

Pros:
Simpler implementation
Fewer moving parts
Real-time capabilities built-in
Lower latency for small loads
Cons:
Limited control over rate limiting
Harder to implement complex retry logic
Database load increases with scale
Limited batch processing capabilities
Complex operations block database connections
Harder to implement advanced queueing features

Approach 2: Backend API
UI → Backend API → Supabase → Queue Service → Twilio/Email

Pros:
Better control over rate limiting
Can implement sophisticated retry logic
Can batch process large broadcasts
Can cache frequent operations
Can implement complex business logic
Better error handling and recovery
Can scale horizontally
Can implement circuit breakers
Better monitoring and logging
Can handle complex validation rules
Cons:
More complex architecture
Additional infrastructure needed
Higher initial development effort
More maintenance required

For scalability, the Backend API approach would be better because:
Large broadcasts (1000s of recipients) need batch processing
Need sophisticated retry and error handling
Need to prevent database overload
Need detailed logging and monitoring
Need to handle complex edge cases
Can implement caching strategies
Can handle rate limits from Twilio/Email providers
Better control over resource usage