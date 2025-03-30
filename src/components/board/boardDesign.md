# Board Feature Design Document

## Overview
The Board feature is a dynamic, Kanban-style interface for managing customer interactions and workflows. It provides a visual way to track leads, conversations, and customer journeys through customizable columns and cards.

## Use Cases
1. **Speed to Lead Management**
   - Track new leads and response times
   - Visualize lead status and progression
   - Prioritize urgent leads
   - Monitor agent performance

2. **Customer Journey Tracking**
   - Move customers through different stages
   - Track interaction history
   - Manage follow-ups
   - Monitor conversion rates

3. **Team Collaboration**
   - Assign leads to team members
   - Share notes and updates
   - Track team performance
   - Coordinate responses

## Integration with Other Features

### 1. Livechat Integration
- Real-time updates when new chat messages arrive
- Automatic card creation for new conversations
- Direct access to chat history from cards
- Status synchronization between chat and board

### 2. Contact Integration
- Contact details displayed on cards
- Quick access to contact history
- Contact status updates reflected in board
- Direct contact management from cards

### 3. Pipeline Integration
- Pipeline stages mapped to board columns
- Deal tracking and progression
- Revenue visualization
- Sales cycle monitoring

### 4. Calendar Integration
- Meeting scheduling from cards
- Follow-up reminders
- Task deadlines
- Event synchronization

### 5. Phone Integration
- Click-to-call from cards
- Call history tracking
- Voicemail management
- Call scheduling

## Database Schema

```sql
-- Core Tables
CREATE TABLE boards (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id),
    name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE board_columns (
    id UUID PRIMARY KEY,
    board_id UUID REFERENCES boards(id),
    title VARCHAR(255),
    position INTEGER,
    icon VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE board_cards (
    id UUID PRIMARY KEY,
    column_id UUID REFERENCES board_columns(id),
    contact_id UUID REFERENCES contacts(id),
    assigned_to UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    position INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationship Tables
CREATE TABLE card_activities (
    id UUID PRIMARY KEY,
    card_id UUID REFERENCES board_cards(id),
    user_id UUID REFERENCES users(id),
    activity_type VARCHAR(50),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_labels (
    id UUID PRIMARY KEY,
    card_id UUID REFERENCES board_cards(id),
    name VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_board_cards_column_position ON board_cards(column_id, position);
CREATE INDEX idx_board_cards_contact ON board_cards(contact_id);
CREATE INDEX idx_board_cards_assigned ON board_cards(assigned_to);
CREATE INDEX idx_card_activities_card ON card_activities(card_id);
```

## Scalability Plan

### 1. Database Optimization
- Implement cursor-based pagination
- Use materialized views for analytics
- Partition tables by workspace and date
- Implement caching with Redis
- Regular database maintenance and optimization

### 2. Frontend Performance
- Virtual scrolling for large boards
- Lazy loading of card details
- Client-side caching with React Query
- Optimistic updates for real-time feel
- Efficient state management with context

### 3. Backend Architecture
- Horizontal scaling with load balancers
- Microservices for specific functionalities
- Message queues for async operations
- CDN for static assets
- WebSocket optimization for real-time updates

### 4. Data Management
- Archival strategy for old data
- Regular cleanup of unused resources
- Data compression for large datasets
- Efficient search indexing
- Backup and recovery procedures

## Production Readiness Checklist

### 1. Performance
- [ ] Load testing with millions of cards
- [ ] Response time optimization
- [ ] Memory usage optimization
- [ ] Network optimization
- [ ] Database query optimization

### 2. Security
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting

### 3. Monitoring
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] User activity logging
- [ ] System health checks
- [ ] Alert system

### 4. Documentation
- [ ] API documentation
- [ ] User guides
- [ ] Admin documentation
- [ ] Deployment guides
- [ ] Troubleshooting guides

## Progress Report

### Completed Features
- [x] Basic board layout
- [x] Column management
- [x] Card creation and editing
- [x] Search functionality
- [x] Contact card integration
- [x] Drag-and-drop functionality
- [x] Fixed RLS policy issues for proper workspace_id handling
- [x] Implemented firstname/lastname field validation
- [x] Added graceful error handling for missing database tables
- [x] Enhanced ContactDetailView with conditional UI rendering

### In Progress
- [ ] Real-time updates
- [ ] Advanced filtering
- [ ] Activity logging and tracking
- [ ] Integration with other modules

### Upcoming
- [ ] Advanced analytics
- [ ] Custom automation rules
- [ ] Bulk operations
- [ ] Advanced search
- [ ] Export/Import functionality

## Future Plans

### Phase 1: Core Enhancement
1. Implement drag-and-drop functionality
2. Add card templates
3. Enhance search capabilities
4. Add board analytics
5. Implement activity logging

### Phase 2: Integration
1. Connect with Twilio for messaging
2. Integrate with calendar for scheduling
3. Add pipeline synchronization
4. Implement contact management
5. Add email integration

### Phase 3: Automation
1. Add custom automation rules
2. Implement webhooks
3. Add API endpoints
4. Create workflow templates
5. Add bulk operations

### Phase 4: Analytics & Reporting
1. Add custom reports
2. Implement dashboard
3. Add export capabilities
4. Create performance metrics
5. Add predictive analytics

## Real-time Updates Implementation Plan

### Overview
Real-time updates will allow multiple users to see changes to the board immediately without having to refresh the page. This is particularly valuable in a collaborative environment where multiple team members might be working with the same board simultaneously.

### How It Works
1. **WebSocket Connection**: When a user opens the board, a WebSocket connection is established between their browser and the server.
2. **Event Broadcasting**: When any user makes a change (like moving a contact between columns), the server broadcasts this event to all connected clients.
3. **State Updates**: Each client receives the event and updates their local state accordingly, reflecting the change in their UI immediately.

### Implementation Details

#### 1. Server-Side Setup
- Set up Socket.IO on the backend server (leverage existing infrastructure)
- Create event handlers for board-related events:
  - `contact_moved`: When a contact is moved between columns
  - `contact_added`: When a new contact is added to the board
  - `contact_removed`: When a contact is removed from the board
  - `column_added`: When a new column is added
  - `column_updated`: When a column is edited
  - `column_removed`: When a column is deleted
- Implement rooms/channels for specific boards so updates only go to relevant users

#### 2. Frontend Integration
- Connect to the WebSocket server from the SpeedToLeadBoard component
- Subscribe to board-specific events
- Update the local state when events are received
- Emit events when local changes are made

### Scalability Considerations

#### Socket.IO Clustering
- Socket.IO supports clustering for horizontal scaling
- Can use Redis adapter to synchronize events across multiple server instances
- This allows adding more server nodes as load increases

#### Namespaces and Rooms
- Using board-specific rooms keeps traffic isolated
- Only relevant users receive updates, reducing unnecessary network traffic
- More efficient than broadcasting all events to all users

#### Connection Management
- Implement proper connection/disconnection handling
- Add heartbeat mechanisms to detect stale connections
- Use reconnection strategies for network interruptions

#### Event Throttling
- Implement debouncing for rapid-fire events (like dragging)
- Consider batching updates when appropriate
- Add rate limiting to prevent abuse

### Production Readiness

#### Error Handling
- Implement comprehensive error handling for socket events
- Add fallback to REST API when WebSockets fail
- Include proper logging for debugging issues

#### Security
- Authenticate WebSocket connections
- Validate all incoming events
- Implement proper authorization for board access

#### Performance
- Minimize payload size for events
- Optimize serialization/deserialization
- Consider using binary protocols for large data

#### Monitoring
- Add metrics for connection counts, event throughput
- Monitor server resources (memory, CPU)
- Set up alerts for abnormal patterns

### Benefits
1. **Improved Collaboration**: Multiple team members can work on the same board without conflicts
2. **Better User Experience**: Changes appear instantly without page refreshes
3. **Reduced Server Load**: Fewer API calls for checking updates
4. **Real-time Awareness**: Users can see who else is active and what they're doing

## Unread Message Notification Feature

### Overview
To enhance user experience and streamline workflow, we will implement a notification system that visually indicates when a board has new unread messages. This feature will help users quickly identify which boards require immediate attention without having to open each board individually.

### Implementation Details

1. **Sidebar Notification Indicator**
   - Add a blue notification indicator next to the board name in the sidebar
   - Display the count of unread messages in a badge
   - Update the counter in real-time when new messages arrive

2. **Message Classification**
   - Track messages that haven't been responded to by any agent or bot
   - Consider a message "unread" until a response is sent
   - Reset the counter when all messages have been addressed

3. **Database Changes**
   - Add a `last_read_timestamp` field to track when a user last viewed messages
   - Create a view or function to calculate unread counts efficiently
   - Ensure proper indexing for performance optimization

4. **Real-time Updates**
   - Use Socket.IO to push notification updates to all connected clients
   - Update the UI without requiring page refresh
   - Implement debouncing to prevent UI flickering with rapid updates

### User Experience Benefits
- Provides immediate visual feedback about which boards need attention
- Reduces time spent checking boards that have no new activity
- Helps prioritize response efforts based on volume of unread messages
- Improves overall response time to customer inquiries
- Makes the platform more intuitive and efficient for multi-board management

### Technical Considerations
- Ensure notification state persists across sessions
- Implement proper read/unread state synchronization across devices
- Optimize for minimal database queries to maintain performance
- Consider workspace-level aggregation for overview dashboards

### Priority
High - This feature will significantly improve usability and response times.

### Estimated Development Time
1 week

### Dependencies
- Socket.IO integration
- Message tracking system
- Board sidebar component

## Filter and Sort Options

### Contact Card Enhancements:
- [x] Add contact avatars or initials with consistent styling
- [x] Include more context like last message or interaction date
- [x] Show contact status indicators (new, active, inactive)

### Drag-and-Drop Functionality:
- [x] Allow users to drag contacts between columns
- [x] Implement visual feedback during drag operations
- [x] Auto-save column changes when contacts are moved

### Column Management:
- [x] Allow users to create custom columns beyond the defaults
- [x] Implement column reordering
- [x] Add column settings (color, icon, etc.)
- [ ] Implement column archiving

### Filtering and Sorting:
- [x] Add filters by contact properties (name, date added, etc.)
- [ ] Implement sorting options within columns
- [x] Add search functionality specific to board contacts

### Functional Improvements:
#### Contact Actions:
- [x] Quick action buttons (call, message, email)
- [ ] Batch operations for multiple contacts
- [ ] Context menu with additional options

#### Activity Tracking:
- [ ] Log when contacts move between columns
- [ ] Track user interactions with contacts
- [ ] Display activity timeline for each contact

#### Automation Rules:
- [ ] Auto-move contacts based on criteria
- [ ] Set up reminders for follow-ups
- [ ] Create notification triggers for specific events

#### Integration Enhancements:
- [ ] Connect with calendar for scheduling
- [x] Link to messaging history
- [ ] Integrate with other CRM features

### Performance Improvements:
#### Data Loading:
- [ ] Implement pagination for columns with many contacts
- [ ] Add lazy loading for contact details
- [ ] Cache board data for faster loading

#### Real-time Updates:
- [ ] Use WebSockets for live updates when contacts change columns
- [ ] Show indicators when other users are viewing/editing the same board
- [ ] Implement optimistic UI updates

## Activities Table Implementation

### Overview
The activities table will provide a comprehensive history of all interactions with contacts, enhancing the contact detail view with a chronological activity feed. This feature will help users track the complete customer journey and ensure no interactions are missed.

### Database Structure
- **Table Name**: `public.activities`
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `contact_id` references `public.contacts(id)`
  - `created_by` references `auth.users(id)`
- **Required Fields**:
  - `description` (TEXT) - Details of the activity
  - `activity_type` (VARCHAR) - Type of activity (call, email, note, etc.)
  - `workspace_id` (TEXT) - For RLS policy enforcement

### Security
- Row Level Security (RLS) policies to ensure workspace data isolation
- Policies for SELECT, INSERT, UPDATE, and DELETE operations
- Access restricted to workspace members only

### Performance Considerations
- Indexes on `contact_id`, `workspace_id`, and `created_at` for query optimization
- Pagination support for handling large activity histories
- Efficient loading with limit and offset

### UI Integration
- Activities tab in ContactDetailView
- Chronological feed of all contact interactions
- Activity type filtering
- Activity creation from contact detail view

### Implementation Status
- [x] SQL migration file created
- [ ] Database table deployment
- [ ] Backend API endpoints
- [ ] Frontend UI components
- [ ] Integration with existing features

### Future Roadmap: Activity Log Admin View

#### Overview
A dedicated admin interface for viewing and managing all activities across the system, providing insights into user actions, contact interactions, and system events.

#### Key Features
1. **Global Activity Dashboard**
   - View all activities across all contacts and users
   - Filter by activity type, date range, user, and contact
   - Sort by recency, activity type, or importance
   - Export activity data for reporting

2. **Activity Analytics**
   - Track most active users and contacts
   - Measure response times and engagement metrics
   - Identify patterns in user behavior
   - Generate activity heatmaps by time of day/week

3. **Activity Management**
   - Edit or delete inappropriate activities
   - Add admin notes to activities
   - Flag activities for follow-up
   - Bulk actions for multiple activities

4. **Implementation Approaches**
   - **Option 1**: Standalone AdminActivityLog component
     - Dedicated admin-only interface
     - Comprehensive filtering and management tools
     - Advanced analytics and reporting

   - **Option 2**: Enhanced Board View Integration
     - Activity Log tab in main application
     - User-specific views based on permissions
     - Contextual actions based on activity type
     - Integration with existing board workflows

   - **Option 3**: Supabase Integration
     - Leverage Supabase Table Editor for management
     - Custom views and stored procedures
     - Direct database access for admins
     - Minimal additional frontend development

#### Implementation Priority
- Medium priority after core activity tracking is implemented
- Estimated development time: 2-3 weeks
- Dependencies: Activities table, user permissions system

## Contact Management Implementation Plan

### Overview
Contact management features will allow users to create, view, edit, and manage contacts directly within the board interface. This will streamline workflows by eliminating the need to switch between different parts of the application.

### Key Features

#### 1. Contact Creation
- Add "New Contact" button to each column
- Implement a form for creating new contacts with essential fields:
  - Name
  - Phone number
  - Email
  - Notes
  - Tags/labels
- Allow setting the initial column for the contact
- Validate input fields (e.g., phone number format)

#### 2. Contact Editing
- Enable inline editing of contact details from the board
- Provide a more comprehensive edit form for detailed changes
- Implement validation and error handling
- Add ability to move contacts between columns (already implemented with drag-and-drop)

#### 3. Contact Detail View
- Create a detailed view showing all contact information
- Display communication history (messages, calls)
- Show activity timeline
- Provide quick action buttons (message, call, etc.)

#### 4. Batch Operations
- Implement multi-select functionality for contacts
- Allow batch actions:
  - Move multiple contacts to a column
  - Assign multiple contacts to a user
  - Add/remove tags
  - Export selected contacts

### Implementation Details

#### UI Components
1. **ContactForm**: Reusable component for creating and editing contacts
2. **ContactDetailView**: Modal or slide-in panel for viewing contact details
3. **BatchActionBar**: Appears when multiple contacts are selected

#### Database Operations
- Leverage existing Supabase tables and relationships
- Ensure proper validation before database operations
- Implement optimistic UI updates for better user experience
- Add proper error handling and recovery

#### Integration Points
- Connect with existing contact management functionality
- Ensure changes in the board are reflected in other parts of the application
- Maintain consistent data structure and validation rules

### User Experience Considerations
- Provide clear feedback for all actions
- Implement loading states for async operations
- Add confirmation dialogs for destructive actions
- Ensure accessibility compliance
- Maintain consistent design language

### Success Metrics
- Reduction in time spent managing contacts
- Increased usage of the board feature
- Positive user feedback
- Reduction in context switching between application sections

## Implementation Phases

### Phase 1: Basic Contact Creation
- Implement "New Contact" button in columns
- Create basic contact form
- Add validation and error handling
- Connect to database

### Phase 2: Contact Editing and Detail View
- Implement contact detail view
- Add inline editing capabilities
- Create comprehensive edit form

### Phase 3: Batch Operations
- Add multi-select functionality
- Implement batch action bar
- Create batch operation handlers

## Search and Filter Enhancements
- [x] Add filters by contact properties (name, date added, etc.)
- [x] Implement search functionality
- [ ] Add advanced filtering options