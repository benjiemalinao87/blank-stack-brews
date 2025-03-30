# Broadcast Queue Service Integration Plan

## Overview
Integrate broadcast system with queue-services for reliable message delivery and scheduling.



## Queue Service APIs
Queue Service APIs (https://queue-services-production.up.railway.app)

/api/schedule-sms    - For scheduling SMS messages
/api/schedule-email  - For scheduling email messages

## 1. Database Updates Needed

### Add Queue Status to Broadcasts Table
```sql
-- Add queue-related columns to broadcasts table
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS
    queue_status VARCHAR(50) DEFAULT 'pending',
    queued_at TIMESTAMPTZ,
    last_queue_error TEXT,
    retry_count INTEGER DEFAULT 0;

-- Create enum for queue status
CREATE TYPE queue_status AS ENUM (
    'pending',
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled'
);
```

### Add Queue Tracking Table
```sql
CREATE TABLE IF NOT EXISTS broadcast_queue_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID NOT NULL REFERENCES broadcasts(id),
    sequence_id UUID REFERENCES broadcast_sequences(id),
    recipient_id UUID NOT NULL REFERENCES broadcast_recipients(id),
    message_type VARCHAR(10) NOT NULL, -- 'sms' or 'email'
    queue_message_id UUID NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    last_error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Implementation Phases

### Phase 1: Basic Queue Integration
1. Create QueueService class
   - Initialize with queue service URL
   - Handle authentication
   - Implement basic send methods

2. Implement Queue Handlers
   - SMS queue handler
   - Email queue handler
   - Error handling & logging

3. Add Status Management
   - Queue status updates
   - Delivery tracking
   - Error tracking

### Phase 2: Sequence Management
1. Sequence Scheduling
   - Calculate delivery times
   - Handle timezone differences
   - Manage sequence order

2. Batch Processing
   - Group recipients
   - Optimize queue loads
   - Handle rate limits

### Phase 3: Monitoring & Recovery
1. Queue Monitoring
   - Track queue status
   - Monitor delivery rates
   - Alert on failures

2. Error Recovery
   - Implement retry logic
   - Handle failed deliveries
   - Clean up stuck messages

## 3. Implementation Steps

### Step 1: SMS Integration
```typescript
// QueueService class structure
interface QueueServiceConfig {
    baseUrl: string;
    workspaceId: string;
    retryAttempts?: number;
    batchSize?: number;
}

interface QueueMessage {
    contactId: string;
    messageId: string;
    scheduledTime: string;
    content: string;
    metadata: Record<string, any>;
}

class QueueService {
    constructor(config: QueueServiceConfig);
    
    async queueSMS(message: QueueMessage): Promise<QueueResponse>;
    async queueEmail(message: QueueMessage): Promise<QueueResponse>;
    async checkStatus(messageId: string): Promise<MessageStatus>;
    async retryMessage(messageId: string): Promise<QueueResponse>;
}
```

### Step 2: Database Functions
```sql
-- Function to queue a broadcast
CREATE OR REPLACE FUNCTION queue_broadcast(
    broadcast_id UUID,
    schedule_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS SETOF broadcast_queue_tracking AS $$
BEGIN
    -- Implementation here
END;
$$ LANGUAGE plpgsql;

-- Function to update queue status
CREATE OR REPLACE FUNCTION update_queue_status(
    message_id UUID,
    new_status VARCHAR(50),
    error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Implementation here
END;
$$ LANGUAGE plpgsql;
```

### Step 3: API Endpoints
```typescript
// Endpoint structure for queue management
interface QueueEndpoints {
    '/api/broadcasts/:id/queue': {
        POST: {
            params: { id: string };
            body: { scheduleTime?: string };
            response: QueueResponse;
        };
    };
    '/api/broadcasts/:id/status': {
        GET: {
            params: { id: string };
            response: BroadcastStatus;
        };
    };
}
```

## 4. Testing Strategy

### Unit Tests
1. Queue service methods
2. Status management
3. Error handling
4. Retry logic

### Integration Tests
1. End-to-end message flow
2. Sequence scheduling
3. Status updates
4. Error recovery

### Load Tests
1. Batch processing
2. Rate limiting
3. Concurrent queuing
4. Recovery scenarios

## 5. Monitoring & Logging

### Queue Metrics
1. Queue length
2. Processing time
3. Success/failure rates
4. Retry counts

### Error Tracking
1. Queue errors
2. Delivery failures
3. System errors
4. Rate limit hits

## 6. Deployment Plan

### Stage 1: Basic Integration
1. Deploy database changes
2. Implement basic queuing
3. Add status tracking
4. Basic monitoring

### Stage 2: Advanced Features
1. Sequence handling
2. Batch processing
3. Enhanced monitoring
4. Recovery systems

### Stage 3: Optimization
1. Performance tuning
2. Scale testing
3. Error handling improvements
4. Documentation updates

## Progress

### Completed Features
1. Basic Queue Integration
   - Created broadcastQueueService.js for handling queue service API calls
   - Implemented SMS and Email scheduling endpoints
   - Added immediate and scheduled sending functionality
   - Integrated error handling and loading states

2. UI Integration
   - Updated BroadcastScheduler component with queue service
   - Added loading and error states
   - Improved user feedback during scheduling
   - Connected scheduling UI with queue service

### Next Steps
1. Implement sequence management for multi-day broadcasts
2. Add batch processing for large recipient lists
3. Set up monitoring and error tracking
4. Implement retry logic for failed deliveries

## Next Steps
1. Review and approve database changes
2. Begin SMS integration
3. Set up monitoring
4. Implement basic queue handling

Would you like to proceed with implementation? 