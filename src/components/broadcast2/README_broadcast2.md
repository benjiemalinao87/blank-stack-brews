# Broadcast 2.0 Feature

The Broadcast 2.0 feature provides advanced campaign management capabilities, allowing users to create, schedule, and send both immediate and sequenced messaging campaigns.

## Key Components

- **Campaign Dashboard**: Lists all campaigns with filtering and sorting
- **Sequence Builder**: Drag-and-drop interface for creating multi-step campaigns
- **Template Library**: Reusable templates for campaign messages
- **Campaign Analytics**: Performance metrics and reporting

## Campaign Status Lifecycle

Campaigns in the system follow a specific lifecycle, managed both client-side and server-side:

1. **Draft**: Initial status for new campaigns being created
2. **Scheduled**: Campaigns set to be sent at a future date/time
3. **Active**: Campaigns currently in progress with messages being sent
4. **Completed**: Campaigns that have finished sending all messages
5. **Paused**: Campaigns temporarily stopped by the user
6. **Cancelled**: Campaigns permanently stopped by the user

### Status Transitions

The system handles these status transitions automatically:

- **Draft → Scheduled**: When a user schedules a campaign for future delivery
- **Draft → Active**: When a user sends a campaign immediately
- **Scheduled → Completed**: When the scheduled time is in the past and a manual refresh is triggered
- **Active → Completed**: When all messages have been sent and a manual refresh is triggered (for campaigns with no delayed steps)

### Technical Implementation

Status transitions are managed through several mechanisms:

1. **Manual Refresh**: The primary method is user-triggered refresh via the "Refresh Statuses" button in the Campaign Dashboard
2. **RPC Endpoint**: The `trigger_update_campaign_statuses()` function checks and updates statuses based on scheduled times and sent times
3. **Client-side Fallback**: If the server-side function fails, the client can perform status checks and updates
4. **Campaign Loading**: The system also checks statuses when campaigns are loaded in the dashboard

## Backend Requirements

For the full functionality of campaign status management, the system requires:

1. PostgreSQL with properly configured database functions
2. Proper RLS (Row Level Security) policies for the campaigns table
3. Database functions deployed to Supabase

## Common Issues and Troubleshooting

- If campaigns remain in "Draft" status despite being scheduled, use the "Refresh Statuses" button
- If scheduled campaigns don't automatically transition to "Completed", check that the database function is properly installed
- For campaigns with delayed sequence steps, the "Active" status will persist until all steps are completed

## Overview
Broadcast 2.0 is an advanced campaign management system designed to create, manage, and track sophisticated multi-day messaging campaigns. It builds upon the lessons learned from the original broadcast feature, providing more comprehensive functionality with a focus on sequences, templates, and detailed analytics.

## Key Features

### Campaign Management
- Dashboard for viewing and managing all campaigns
- Filtering and sorting capabilities
- Campaign status tracking
- Detailed performance metrics

### Sequence Builder
- Visual drag-and-drop sequence creation
- Multi-day campaign sequencing
- Customizable wait times and send schedules
- Channel selection (SMS/Email) per step
- Message content editing with character counting
- Audience targeting with real-time size estimation

### Template Library
- Reusable message templates for different channels
- Template categorization system
- Variable substitution support
- Preview functionality
- Favorites system

### Analytics Dashboard
- Comprehensive performance metrics
- Campaign-level analytics
- Daily breakdown of performance
- Channel comparison
- Send time optimization

## Component Structure

### Main Components
- `Broadcast2.js` - Main container component with tabbed interface
- `CampaignDashboard.js` - Campaign listing and management
- `SequenceBuilder.js` - Multi-day sequence creation
- `TemplateLibrary.js` - Message template management
- `CampaignAnalytics.js` - Performance tracking and reporting

### Sequence Builder Components
- `CampaignForm.js` - Campaign details form
- `AudienceSelector.js` - Audience filtering and selection
- `VisualSequenceBuilder.js` - Visual sequence editor
- `SequenceStep.js` - Individual sequence step component

## Database Schema
The feature interacts with the following tables:
- `campaigns` - Campaign metadata and settings
- `sequences` - Sequence steps with timing and content
- `campaign_contact_status` - Recipient enrollment and status tracking
- `campaign_executions` - Message delivery tracking
- `message_templates` - Reusable message templates

## Routing
- `/broadcast2` - Main Broadcast 2.0 interface
- `/broadcast2/sequence/new` - Create new sequence campaign
- `/broadcast2/sequence/:id` - Edit existing sequence campaign

## Design Principles
- Mac OS-inspired UI with purple accent color scheme
- Modular component architecture for maintainability
- Responsive design for all screen sizes
- Comprehensive error handling and validation
- Real-time feedback for user actions

## Usage
1. Navigate to Campaign Manager 2.0 from the main application
2. Use the Campaigns tab to view and manage existing campaigns
3. Click "New Campaign" to create a standard or sequence campaign
4. Use the Templates tab to manage reusable message templates
5. View performance metrics in the Analytics tab

## Future Enhancements
- A/B testing functionality
- Campaign template system
- Advanced segmentation capabilities
- Conditional branching for messages
- Real-time campaign status updates

## Performance Considerations
- Batch processing for large audiences
- Optimized database queries with proper indexes
- Caching for frequently accessed data
- Efficient component rendering with React best practices 