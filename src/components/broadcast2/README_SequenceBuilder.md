# Sequence Builder Component

## Overview
The Sequence Builder is a core component of the Campaign Manager 2.0 system, allowing users to create and manage sophisticated multi-day message sequences. It provides a visual, drag-and-drop interface for designing message flows with configurable timing, content, and delivery channels.

## Key Features
- Visual sequence builder with drag-and-drop reordering
- Multi-day campaign sequencing with customizable wait times
- Channel selection (SMS/Email) per step
- Audience targeting with real-time size estimation
- Campaign details management
- Step-by-step workflow with tabbed interface

## Component Structure
- **SequenceBuilder.js**: Main container component
- **CampaignForm.js**: Campaign details form
- **AudienceSelector.js**: Audience filtering and selection
- **VisualSequenceBuilder.js**: Visual sequence editor
- **SequenceStep.js**: Individual sequence step component

## Database Tables
The sequence builder interacts with the following database tables:
- `campaigns`: Stores campaign metadata and audience criteria
- `sequences`: Stores sequence steps with timing and content

## Usage
To create a new campaign sequence:
1. Fill in campaign details (name, description, type)
2. Select target audience with filters
3. Build the message sequence by adding and configuring steps
4. Save the campaign

## Implementation Details

### Campaign Form
The campaign form collects essential campaign metadata:
- Name (required)
- Type (sequence, broadcast, etc.)
- Description
- Status (draft, active, etc.)

### Audience Selection
The audience selector allows filtering contacts by:
- Lead source
- Market
- Contact method (SMS/email)
- Real-time audience size estimation

### Visual Sequence Builder
The visual builder provides:
- Step creation, editing, duplication, and deletion
- Drag-and-drop reordering
- Channel selection (SMS/Email)
- Wait duration configuration
- Message content editing
- Character counting for SMS

## Future Enhancements
- A/B testing support
- Advanced branching logic
- Conditional steps based on recipient actions
- Message template library integration
- Performance analytics and reporting

## Technical Notes
- Uses Chakra UI for components and styling
- Implements drag-and-drop without external libraries
- Color mode aware with dark/light theme support
- Responsive design for all screen sizes
- Uses Supabase for data storage and retrieval 