# Broadcast Feature Implementation Guide

## Overview
The Broadcast feature enables users to create and send SMS and email campaigns to their audience. It follows a multi-step process with a clean, intuitive UI inspired by macOS design principles.

## Component Structure
1. **BroadcastManager.js** - Main component orchestrating the workflow
2. **BroadcastTypeSelector.js** - Allows users to choose between SMS and email
3. **AudienceSelector.js** - Configure audience filters and targeting
4. **BroadcastComposer.js** - Create message content with appropriate editing tools
5. **BroadcastPreview.js** - Preview message and send test messages
6. **BroadcastScheduler.js** - Choose between immediate or scheduled delivery
7. **BroadcastTracking.js** - View delivery statistics and performance metrics

## Usage
Import the components from the broadcast directory:
```jsx
import { BroadcastManager } from '../components/broadcast';

// Then use it in your component
<BroadcastManager />
```

## State Management
The BroadcastManager component manages the overall state with this structure:
```javascript
{
  type: 'sms' | 'email', // Broadcast type
  audience: {
    filters: [], // Array of filter conditions
    estimatedRecipients: 0 // Count of recipients based on filters
  },
  content: {
    subject: '', // Required for email
    body: '', // Message content
    scheduledDate: null, // For scheduled broadcasts
    days: [] // For multi-day sequences
  },
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
}
```

## Styling Guide
- Follow macOS design principles: clean interfaces, subtle shadows, rounded corners
- Use the existing color scheme:
  - Primary blue: #5b6af9
  - Success green: #38b2ac
  - Warning orange: #ed8936
  - Error red: #e53e3e
- Maintain consistent spacing and typography across components
- Ensure all components are responsive and work on multiple screen sizes

## Backend Integration (Future)
The UI is prepared for integration with these backend services:
1. Audience filtering API endpoint
2. Message delivery service (SMS/Email)
3. Scheduling system
4. Analytics tracking

## Contribution Guidelines
1. Maintain modularity by keeping components focused on single responsibilities
2. Keep files under 200 lines for better readability
3. Follow existing styling patterns with styled-components
4. Add comprehensive PropTypes for all components
5. Document any significant state management changes

## Testing
For proper testing:
1. Test each step in isolation with different input scenarios
2. Verify mobile responsiveness of all components
3. Test form validation with edge cases
4. Ensure smooth transitions between steps
5. Verify all UI feedback mechanisms work correctly 