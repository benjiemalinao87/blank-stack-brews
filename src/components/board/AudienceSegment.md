# Audience Segmentation Feature

## What is it for?

The AudienceSegment component is a powerful tool designed to help users create, manage, and apply dynamic filters to their contact database. It enables the segmentation of contacts based on various criteria such as lead source, CRM source, status, and last contact date. This feature allows for targeted communication, personalized marketing campaigns, and more efficient lead management.

The component consists of two main sections:
1. **Filter Builder**: A dynamic interface for creating complex filter conditions
2. **Saved Segments**: A list view of previously created segments with contact counts

## Possible Use Cases in a Text App and CRM

### 1. Targeted Messaging Campaigns
- **Scenario**: Send personalized text messages to specific customer segments
- **Implementation**: Create segments based on lead source, status, or last contact date
- **Benefit**: Higher engagement rates through relevant, targeted communication

### 2. Lead Nurturing Sequences
- **Scenario**: Develop different nurturing paths for leads at various stages
- **Implementation**: Segment leads by status and engagement level
- **Benefit**: More effective conversion by addressing specific needs at each stage

### 3. Re-engagement Campaigns
- **Scenario**: Reach out to dormant leads or customers
- **Implementation**: Create segments based on "last contact" date filters
- **Benefit**: Recover potentially lost opportunities and increase customer retention

### 4. Performance Analysis
- **Scenario**: Analyze conversion rates across different lead sources
- **Implementation**: Create segments by lead source and compare outcomes
- **Benefit**: Identify high-performing channels and optimize marketing spend

### 5. Compliance Management
- **Scenario**: Ensure regulatory compliance in communications
- **Implementation**: Create segments based on opt-in status or communication preferences
- **Benefit**: Reduce compliance risks by properly managing communication permissions

## How This Complements Our Existing App

The AudienceSegment feature enhances our existing application in several ways:

1. **Integration with Board Feature**: Extends the board functionality by allowing users to create dynamic segments that can be visualized and managed within the board interface.

2. **Enhanced Contact Management**: Complements the existing contact management system by adding sophisticated filtering capabilities beyond basic search.

3. **Improved Messaging Workflow**: Works with the LiveChat and messaging features by enabling targeted communication to specific audience segments.

4. **Data-Driven Decision Making**: Provides better insights into the contact database by allowing users to analyze different segments of their audience.

5. **Automation Foundation**: Creates the foundation for future automation features by defining audience segments that can trigger specific workflows.

6. **Campaign Effectiveness**: Works alongside the CampaignBuilder component to improve campaign targeting and effectiveness.

## Implementation Details

The current implementation includes:

1. **Frontend Components**:
   - `AudienceSegment.js`: Main component for the audience segmentation interface
   - `FilterCondition`: Sub-component for individual filter conditions
   - Integration with `BoardWindow.js` as one of the board views

2. **Key Features**:
   - Dynamic filter creation with field, operator, and value selection
   - Support for multiple filter conditions
   - Segment naming and saving
   - Visual display of saved segments with contact counts
   - Clean, responsive UI with proper light/dark mode support

3. **Current Limitations**:
   - Segments are currently stored in local state only (not persisted to database)
   - Limited set of filterable fields (leadSource, crmSource, status, lastContact)
   - No execution of filters against actual contact data
   - Mock contact counts rather than actual counts

## Required Supabase Schema

To fully support the AudienceSegment feature, the following database schema additions would be needed:

```sql
-- Audience segments table
CREATE TABLE IF NOT EXISTS public.audience_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    last_run_at TIMESTAMPTZ,
    contact_count INTEGER DEFAULT 0
);

-- Segment conditions table
CREATE TABLE IF NOT EXISTS public.segment_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES public.audience_segments(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    operator TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    condition_order INTEGER DEFAULT 0
);

-- Segment-contact association table (for caching results)
CREATE TABLE IF NOT EXISTS public.segment_contacts (
    segment_id UUID REFERENCES public.audience_segments(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (segment_id, contact_id)
);

-- Add RLS policies for workspace-based access control
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_contacts ENABLE ROW LEVEL SECURITY;

-- Create appropriate indexes
CREATE INDEX idx_audience_segments_workspace_id ON audience_segments(workspace_id);
CREATE INDEX idx_segment_conditions_segment_id ON segment_conditions(segment_id);
CREATE INDEX idx_segment_contacts_segment_id ON segment_contacts(segment_id);
CREATE INDEX idx_segment_contacts_contact_id ON segment_contacts(contact_id);
```

This schema would integrate with the existing contacts table, which contains fields like:
- id (UUID)
- phone_number (TEXT)
- workspace_id (TEXT)
- name (TEXT)
- email (TEXT)
- metadata (JSONB) - Could store additional filterable properties

## Expert Feedback on CRM and User Journey

As a CRM and user journey expert, here are key observations and recommendations:

### Strengths
1. **Intuitive Interface**: The filter builder provides a clean, intuitive interface for creating segments without requiring technical knowledge.

2. **Flexibility**: The component allows for multiple conditions, supporting complex segmentation needs.

3. **Visual Feedback**: The saved segments section provides immediate visual feedback on segment size.

4. **Integration Potential**: The design fits well within the broader board and campaign management ecosystem.

### Areas for Improvement

1. **Persistence Layer**: The current implementation lacks database persistence, which is critical for a production CRM system.

2. **Advanced Filtering Options**: 
   - Add support for date ranges and relative dates (e.g., "last 30 days")
   - Include numeric comparisons (greater than, less than)
   - Support for nested conditions with AND/OR logic

3. **Dynamic Field Discovery**: 
   - Automatically discover available fields from contact metadata
   - Support custom fields created by users

4. **Actionability**:
   - Add direct actions that can be taken on segments (message, export, assign)
   - Implement segment sharing between team members

5. **Performance Considerations**:
   - Implement query optimization for large contact databases
   - Add caching mechanisms for frequently used segments
   - Consider background processing for complex segment calculations

6. **Analytics Integration**:
   - Add segment comparison tools
   - Provide conversion metrics across segments
   - Include trend analysis over time

## Roadmap

### Phase 1: Core Functionality (1-2 Weeks)
- Implement database schema for segments and conditions
- Create backend API for segment CRUD operations
- Connect frontend to persist segments to database
- Implement actual filtering against contact database
- Add real contact counting

### Phase 2: Enhanced Filtering (2-3 Weeks)
- Add support for date range filters
- Implement numeric comparison operators
- Add nested conditions with AND/OR logic
- Support for custom fields in filters
- Implement dynamic field discovery from contact metadata

### Phase 3: Actionability (2-3 Weeks)
- Add bulk actions on segments (message, export, assign)
- Implement segment sharing and permissions
- Create scheduled segments that auto-update
- Add segment analytics and comparison tools
- Implement segment notifications (e.g., when segment size changes)

### Phase 4: Advanced Features (3-4 Weeks)
- Implement predictive segmentation using ML
- Add segment recommendations based on engagement patterns
- Create segment templates for common use cases
- Implement segment-based automation triggers
- Add A/B testing capabilities for segment-based campaigns

### Phase 5: Integration and Optimization (2-3 Weeks)
- Optimize performance for large contact databases
- Implement caching for segment results
- Add export/import functionality for segments
- Integrate with third-party marketing tools
- Create comprehensive analytics dashboard for segment performance

## Conclusion

The AudienceSegment component represents a powerful addition to our CRM and messaging platform. By enabling sophisticated contact segmentation, it lays the foundation for more targeted communication, improved lead management, and enhanced campaign effectiveness. With the proposed roadmap, this feature can evolve from a basic filtering tool to a comprehensive audience management system that drives significant business value for users.

The implementation should prioritize database persistence, real filtering against actual contacts, and enhanced filtering capabilities to provide immediate value, while setting the stage for more advanced features in future iterations.

## Server Setup Review and Scaling Considerations

### Current Server Architecture

The current server setup consists of:

1. **Backend Framework**: Express.js running on Node.js
2. **Database**: Supabase (PostgreSQL)
3. **Real-time Communication**: Socket.IO
4. **External Services**: Twilio for messaging
5. **API Structure**: RESTful endpoints organized by feature (board, twilio, webhook, email)

The backend follows a modular architecture with:
- `index.js`: Main server file with Express and Socket.IO setup
- `src/routes/`: Feature-specific API endpoints
- `src/io.js`: Socket.IO configuration
- `src/supabase.js`: Supabase client configuration

### Scaling Considerations for AudienceSegment

Implementing the AudienceSegment feature requires careful consideration of scaling to avoid potential issues:

#### 1. Database Query Optimization

**Potential Issues:**
- Complex segment filters could result in expensive database queries
- Large contact databases could lead to slow query performance
- Frequent segment calculations could overload the database

**Proactive Solutions:**
- **Indexed Fields**: Ensure all fields used for filtering have proper indexes
- **Query Optimization**: Use query planning and optimization techniques
  ```sql
  -- Example: Create indexes for commonly filtered fields
  CREATE INDEX idx_contacts_lead_source ON contacts((metadata->>'leadSource'));
  CREATE INDEX idx_contacts_status ON contacts((metadata->>'status'));
  CREATE INDEX idx_contacts_last_contact ON contacts((metadata->>'lastContact'));
  ```
- **Materialized Views**: For complex, frequently-used segments
  ```sql
  -- Example: Create materialized view for a common segment
  CREATE MATERIALIZED VIEW high_priority_leads AS
  SELECT * FROM contacts 
  WHERE metadata->>'leadSource' = 'Website' AND metadata->>'status' = 'New'
  WITH DATA;
  ```
- **Pagination**: Implement cursor-based pagination for all segment results

#### 2. Caching Strategy

**Potential Issues:**
- Repeated calculation of the same segments wastes resources
- Real-time segment counts could cause excessive database load

**Proactive Solutions:**
- **Result Caching**: Cache segment results with appropriate TTL (Time To Live)
  ```javascript
  // Example: Redis-based caching implementation
  const getSegmentContacts = async (segmentId, page = 1) => {
    const cacheKey = `segment:${segmentId}:page:${page}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    
    // Fetch from database if not cached
    const result = await fetchSegmentContactsFromDB(segmentId, page);
    
    // Cache result with 5-minute TTL
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);
    
    return result;
  };
  ```
- **Count Estimation**: For large segments, use count estimation instead of exact counts
- **Background Processing**: Calculate segment membership in background jobs

#### 3. API Rate Limiting

**Potential Issues:**
- Excessive API calls could overload the server
- Malicious users could abuse segment API endpoints

**Proactive Solutions:**
- **Rate Limiting Middleware**: Implement per-user and per-endpoint rate limits
  ```javascript
  // Example: Express rate limiting middleware
  const rateLimit = require('express-rate-limit');
  
  const segmentApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many segment requests, please try again later'
  });
  
  // Apply to segment endpoints
  app.use('/api/segments', segmentApiLimiter);
  ```
- **Tiered Access**: Implement usage tiers based on workspace subscription level
- **Monitoring**: Set up alerts for unusual API usage patterns

#### 4. Horizontal Scaling

**Potential Issues:**
- Single server instance becomes a bottleneck
- Server crashes could cause service interruption

**Proactive Solutions:**
- **Load Balancing**: Implement load balancing across multiple server instances
  ```
  # Example: Nginx load balancer configuration
  upstream backend_servers {
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
  }
  
  server {
    listen 80;
    
    location /api/ {
      proxy_pass http://backend_servers;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
  ```
- **Socket.IO Clustering**: Use Redis adapter for Socket.IO to support multiple nodes
  ```javascript
  // Example: Socket.IO with Redis adapter
  const { createAdapter } = require('@socket.io/redis-adapter');
  const { createClient } = require('redis');
  
  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();
  
  io.adapter(createAdapter(pubClient, subClient));
  ```
- **Stateless Design**: Ensure all endpoints are stateless to support scaling

#### 5. Asynchronous Processing

**Potential Issues:**
- Long-running segment calculations block API responses
- Simultaneous segment calculations overload the server

**Proactive Solutions:**
- **Job Queue**: Implement a job queue for segment calculations
  ```javascript
  // Example: Bull queue for segment processing
  const Queue = require('bull');
  
  const segmentQueue = new Queue('segment-processing', 'redis://localhost:6379');
  
  // Add job to queue
  app.post('/api/segments/:id/calculate', async (req, res) => {
    const { id } = req.params;
    await segmentQueue.add({ segmentId: id });
    res.json({ message: 'Segment calculation queued' });
  });
  
  // Process jobs
  segmentQueue.process(async (job) => {
    const { segmentId } = job.data;
    await calculateSegmentMembers(segmentId);
  });
  ```
- **Webhooks**: Notify clients when segment calculations complete
- **Progress Tracking**: Implement progress tracking for long-running calculations

### Implementation Recommendations

1. **Start with Optimized Schema**: Implement the database schema with proper indexes from the beginning
2. **Implement Pagination Early**: Design all APIs with pagination support from day one
3. **Monitor Performance**: Set up monitoring for query performance and server load
4. **Gradual Feature Rollout**: Start with basic filtering and add advanced features incrementally
5. **Load Testing**: Perform load testing with realistic data volumes before production release

By implementing these proactive scaling measures, the AudienceSegment feature can handle growth in both user base and data volume without degrading performance or requiring significant architectural changes later.

## Scaling Considerations Q&A

### Q: Is our current endpoint design stateless?
**A:** Our current Express.js endpoints are partially stateless. Most API endpoints in the routes directory (board.js, webhookRoutes.js, etc.) follow RESTful principles and don't maintain session state between requests. However, there are some areas that could be improved:

1. **Socket.IO Implementation**: The current Socket.IO setup maintains connection state. For true statelessness in a multi-server environment, we should implement the Redis adapter for Socket.IO to share state across instances.

2. **Authentication Handling**: The current implementation uses Supabase JWT tokens, which is good for statelessness. However, we should ensure all authentication state is contained in the tokens and not stored server-side.

3. **Recommendation**: To ensure complete statelessness, we should:
   - Move any remaining server-side state to the database or Redis
   - Ensure all request context (workspace_id, user_id) comes from the client or tokens
   - Make all endpoints idempotent (same request produces same result regardless of previous requests)

### Q: Is load balancing possible with Express hosted on Railway?
**A:** Yes, load balancing is possible with Express on Railway through several approaches:

1. **Railway's Built-in Scaling**: Railway supports horizontal scaling by increasing the number of instances of your service. You can configure this in the Railway dashboard under the "Scaling" section.

2. **Custom Domain with Load Balancer**: 
   - Set up multiple Railway services running the same Express application
   - Configure a load balancer (like Cloudflare, AWS ALB, or Nginx) in front of these services
   - Point your custom domain to the load balancer

3. **Implementation Considerations**:
   - Ensure database connections are properly pooled and closed
   - Use Redis for session storage if sessions are needed
   - Implement health check endpoints for the load balancer
   - Configure proper instance scaling based on CPU/memory metrics

4. **Railway-Specific Setup**:
```
# Example Railway configuration (railway.json)
{
  "services": {
    "api": {
      "instances": 3,
      "healthcheck": "/health",
      "autoscaling": {
        "min": 2,
        "max": 5,
        "target_cpu": 80
      }
    }
  }
}
```

### Q: What is a job queue used for and what external services can complement our setup?
**A:** A job queue is used for handling time-consuming or resource-intensive tasks asynchronously, preventing them from blocking the main application thread. For audience segmentation, this is particularly important when:

1. **Use Cases**:
   - Processing complex segment calculations that might time out in a regular HTTP request
   - Scheduling recurring segment updates (e.g., refreshing segment membership nightly)
   - Handling bulk operations on segments (e.g., sending messages to all members of a large segment)
   - Generating reports or exports from segment data

2. **Compatible External Services**:
   - **Bull/BullMQ**: Redis-based queue that integrates well with Node.js and supports job priorities, retries, and scheduling
   - **AWS SQS**: Managed message queue service with high durability and scalability
   - **Google Cloud Tasks**: Fully managed queue for asynchronous task execution
   - **RabbitMQ**: Advanced message broker supporting multiple messaging patterns
   - **Temporal.io**: Workflow orchestration platform for complex, long-running processes

3. **Recommendation for Our Stack**:
   - **Bull with Redis**: Most lightweight option that integrates easily with our Express.js backend
   ```javascript
   // Example implementation with Bull
   const Queue = require('bull');
   const Redis = require('ioredis');
   
   // Create Redis client with connection pooling
   const redisClient = new Redis(process.env.REDIS_URL, {
     maxRetriesPerRequest: 3,
     enableReadyCheck: true
   });
   
   // Create segment processing queue
   const segmentQueue = new Queue('segment-processing', {
     redis: redisClient,
     defaultJobOptions: {
       attempts: 3,
       backoff: {
         type: 'exponential',
         delay: 1000
       }
     }
   });
   
   // Add job processing logic
   segmentQueue.process(async (job) => {
     const { segmentId, action } = job.data;
     
     // Update job progress
     job.progress(10);
     
     // Perform segment calculation
     await calculateSegmentMembers(segmentId);
     
     job.progress(100);
     return { success: true };
   });
   ```

### Q: Is our current setup using an optimized schema with proper indexes?
**A:** Yes, our current database schema already implements many best practices for optimization:

1. **Existing Optimizations**:
   - Primary keys on all tables
   - Foreign key constraints for referential integrity
   - Indexes on frequently queried columns (workspace_id, contact_id, etc.)
   - Composite indexes for common join patterns
   - GIN indexes for JSONB fields to optimize JSON queries

2. **Examples from Current Schema**:
   ```sql
   -- From contacts_schema.sql
   CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
   CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
   CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
   
   -- From messages_schema.sql
   CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
   CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON messages(workspace_id);
   CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
   ```

3. **Additional Recommendations for Audience Segments**:
   - Create indexes on fields commonly used in segment filters
   - Add partial indexes for common filter conditions
   - Consider adding expression indexes for complex conditions
   - Implement proper index maintenance (VACUUM ANALYZE)
   ```sql
   -- Example indexes for segment filtering
   CREATE INDEX idx_contacts_lead_source ON contacts((metadata->>'leadSource'));
   CREATE INDEX idx_contacts_status ON contacts((metadata->>'status'));
   CREATE INDEX idx_contacts_last_contact ON contacts((metadata->>'lastContact'));
   
   -- Partial index example
   CREATE INDEX idx_contacts_high_priority ON contacts(id) 
   WHERE metadata->>'priority' = 'high';
   ```

### Q: Do we support pagination in our APIs?
**A:** Partial pagination support exists in our current APIs, but it's not consistently implemented across all endpoints:

1. **Current Implementation**:
   - Some endpoints use limit/offset pagination:
     ```javascript
     // From webhookRoutes.js
     const limit = parseInt(req.query.limit) || 50;
     const offset = parseInt(req.query.offset) || 0;
     // ...
     .range(offset, offset + limit - 1);
     ```
   - Other endpoints use hardcoded limits:
     ```javascript
     // From twilio.js
     .list({ limit: 20 });
     ```

2. **Recommendations for Consistent Pagination**:
   - Implement cursor-based pagination for all list endpoints (more efficient than offset)
   - Add standard pagination parameters (limit, cursor) to all endpoints
   - Return pagination metadata (next_cursor, has_more) in all responses
   - Document pagination in API documentation
   ```javascript
   // Example cursor-based pagination implementation
   router.get('/segments', async (req, res) => {
     const limit = parseInt(req.query.limit) || 20;
     const cursor = req.query.cursor; // This would be the ID of the last item from previous page
     
     let query = supabase
       .from('audience_segments')
       .select('*')
       .eq('workspace_id', req.headers['x-workspace-id'])
       .order('created_at', { ascending: false })
       .limit(limit + 1); // Fetch one extra to determine if there are more items
     
     if (cursor) {
       // Find items created after the cursor
       const { data: cursorItem } = await supabase
         .from('audience_segments')
         .select('created_at')
         .eq('id', cursor)
         .single();
         
       if (cursorItem) {
         query = query.lt('created_at', cursorItem.created_at);
       }
     }
     
     const { data, error } = await query;
     
     if (error) {
       return res.status(500).json({ error: error.message });
     }
     
     const hasMore = data.length > limit;
     const items = hasMore ? data.slice(0, limit) : data;
     const nextCursor = hasMore ? items[items.length - 1].id : null;
     
     return res.json({
       items,
       pagination: {
         has_more: hasMore,
         next_cursor: nextCursor
       }
     });
   });
   ```

### Q: How can we set up monitoring for query performance and server load?
**A:** We can implement comprehensive monitoring using a combination of tools that integrate well with our Express.js and Supabase stack:

1. **Application Performance Monitoring (APM)**:
   - **New Relic**: Comprehensive APM with Node.js support
   - **Datadog**: Full-stack observability platform
   - **Sentry**: Error tracking with performance monitoring
   - **Elastic APM**: Open-source APM solution

2. **Database Monitoring**:
   - **pgMustard**: PostgreSQL query analysis
   - **pganalyze**: Specialized PostgreSQL monitoring
   - **Supabase Observability**: Built-in monitoring in Supabase dashboard

3. **Implementation Example with Datadog**:
   ```javascript
   // In your Express app entry point (index.js)
   const tracer = require('dd-trace').init({
     service: 'audience-segment-api',
     env: process.env.NODE_ENV
   });
   
   const express = require('express');
   const app = express();
   
   // Add middleware to track all requests
   app.use((req, res, next) => {
     // Add custom tag to identify segment-related requests
     if (req.path.includes('/segments')) {
       tracer.scope().active().setTag('endpoint.type', 'segment');
     }
     next();
   });
   
   // Instrument database queries
   const { query } = require('./src/supabase');
   const instrumentedQuery = async (text, params) => {
     const span = tracer.startSpan('postgres.query');
     span.setTag('resource.name', text.split(' ')[0]); // First word of query (SELECT, INSERT, etc.)
     
     try {
       const result = await query(text, params);
       return result;
     } catch (error) {
       span.setTag('error', error);
       throw error;
     } finally {
       span.finish();
     }
   };
   ```

4. **Railway-Compatible Monitoring Setup**:
   - Railway supports integration with Datadog, New Relic, and other monitoring tools
   - Add monitoring environment variables to your Railway service
   - Set up log forwarding to your monitoring service
   - Configure alerting for critical metrics (high CPU, memory usage, error rates)

5. **Key Metrics to Monitor**:
   - API response times by endpoint
   - Database query execution times
   - Error rates and types
   - Memory and CPU usage
   - Active connections (Socket.IO, database)
   - Queue lengths and processing times
   - Cache hit/miss ratios

By implementing these monitoring solutions, we can proactively identify performance bottlenecks, optimize slow queries, and ensure the AudienceSegment feature scales effectively as usage grows.

## Fixes and Improvements

### Supabase Auth Method Update (2024-03-19)

#### Issue
TypeError when trying to get current user: `supabase.auth.user is not a function`

#### Root Cause
Using deprecated Supabase auth method `auth.user()` instead of the current `auth.getUser()`

#### Implemented Solution
```javascript
// Old approach (deprecated)
const userId = supabase.auth.user()?.id;

// New approach
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError) throw new Error('Failed to get current user');
const userId = user.id;
```

#### Best Practices Learned
1. Always check Supabase documentation for current API methods
2. Add proper error handling for auth operations
3. Validate user session before performing authenticated operations
4. Get user data once and reuse throughout the function
5. Add explicit error messages for auth-related failures

### RLS Policy Setup Fix (2024-03-19)

#### Issue
Error: "new row violates row-level security policy for table 'audience_segments'"

#### Root Cause
Missing RLS (Row Level Security) policies in Supabase for the audience_segments table and incorrect table name reference (workspace_users instead of workspace_members)

#### Required SQL Policies
```sql
-- Enable RLS
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;

-- Policy for inserting segments (users can only insert into their workspace)
CREATE POLICY "Users can create segments in their workspace" ON audience_segments
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT ws.id FROM workspaces ws
    WHERE ws.id = workspace_id
    AND ws.id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy for viewing segments (users can only view segments in their workspace)
CREATE POLICY "Users can view segments in their workspace" ON audience_segments
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- Policy for updating segments (users can only update segments in their workspace)
CREATE POLICY "Users can update segments in their workspace" ON audience_segments
FOR UPDATE USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- Policy for deleting segments (users can only delete segments in their workspace)
CREATE POLICY "Users can delete segments in their workspace" ON audience_segments
FOR DELETE USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- Similar policies for segment_conditions table
ALTER TABLE segment_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create segment conditions in their workspace" ON segment_conditions
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view segment conditions in their workspace" ON segment_conditions
FOR SELECT USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update segment conditions in their workspace" ON segment_conditions
FOR UPDATE USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete segment conditions in their workspace" ON segment_conditions
FOR DELETE USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

#### Best Practices Learned
1. Always verify table names in the actual database schema
2. Test RLS policies with actual data
3. Keep policies consistent across related tables
4. Document table relationships and dependencies
5. Use the same policy patterns across related tables

### Schema Mismatch Fix (2024-03-19)

#### Issue
Error: "Could not find the 'updated_by' column of 'audience_segments' in the schema cache"

#### Root Cause
Code was trying to insert into a column (`updated_by`) that doesn't exist in the database schema

#### Implemented Solution
Removed the `updated_by` field from insert operations to match the actual database schema
```javascript
// Updated segment creation code
const { data: segment } = await supabase
  .from('audience_segments')
  .insert([{
    name: segmentName,
    workspace_id: currentWorkspace.id,
    description: description,
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }])
  .select()
  .single();
```

#### Best Practices Learned
1. Always verify database schema before implementing features
2. Keep schema documentation up to date
3. Use database migrations for schema changes
4. Test insert operations with actual schema
5. Consider using TypeScript for better type safety with database operations