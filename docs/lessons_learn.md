# Technical Insights and Lessons Learned

## Webhook Components Dark Mode Implementation

### Implementation Insights
1. **Component-Level Color Mode Variables**: Defining color mode variables at the component level using `useColorModeValue` provides a clean and maintainable approach to implementing dark mode support:
   ```jsx
   const bgColor = useColorModeValue("white", "gray.900");
   const textColor = useColorModeValue("gray.800", "gray.100");
   const borderColor = useColorModeValue("gray.200", "gray.700");
   ```

2. **Semantic Color Naming**: Using semantic names for color variables (e.g., `headerBgColor`, `mutedTextColor`) rather than purpose-specific names makes the code more maintainable and easier to understand.

3. **Consistent Color Palette**: Establishing a consistent color palette across components ensures a cohesive user experience:
   - Background hierarchy: `gray.900` (main), `gray.800` (secondary), `gray.700` (tertiary)
   - Text hierarchy: `gray.100` (primary), `gray.400` (secondary)
   - Border colors: `gray.700` for subtle separation
   - Input backgrounds: `gray.700` for form controls

4. **Status Color Adaptation**: Adapting status colors (success, error, warning) for dark mode requires careful adjustment to maintain readability while reducing eye strain:
   ```jsx
   const getStatusColor = (status) => {
     const colorMap = {
       success: {
         bg: useColorModeValue("green.50", "green.900"),
         color: useColorModeValue("green.700", "green.200")
       },
       error: {
         bg: useColorModeValue("red.50", "red.900"),
         color: useColorModeValue("red.700", "red.200")
       }
     };
     return colorMap[status];
   };
   ```

### Technical Solutions
1. **JSON Display Enhancement**: For JSON code blocks, using appropriate background and text colors ensures readability in both light and dark modes:
   ```jsx
   <Code 
     p={3} 
     borderRadius="md" 
     display="block" 
     whiteSpace="pre" 
     overflowX="auto"
     bg={codeBgColor}
     color={textColor}
   >
     {JSON.stringify(data, null, 2)}
   </Code>
   ```

2. **Table Component Styling**: Implementing dark mode for tables requires attention to multiple elements:
   - Header background: `gray.800` in dark mode
   - Row hover states: `gray.700` in dark mode
   - Cell text colors: Primary and muted variants
   - Border colors: Subtle borders with `gray.700`

3. **Form Control Adaptation**: Ensuring form controls are properly styled in dark mode:
   ```jsx
   <Input 
     name="email" 
     value={formData.email} 
     onChange={handleFormChange} 
     placeholder="john@example.com"
     bg={inputBgColor}
     borderColor={borderColor}
     color={textColor}
   />
   ```

4. **Modal Component Theming**: For modal dialogs, applying consistent theming to all parts:
   ```jsx
   <ModalContent bg={modalBgColor}>
     <ModalHeader bg={modalHeaderBgColor} color={textColor}>
       {title}
     </ModalHeader>
     <ModalCloseButton color={mutedTextColor} />
     <ModalBody>
       {/* Content */}
     </ModalBody>
     <ModalFooter bg={modalHeaderBgColor}>
       {/* Buttons */}
     </ModalFooter>
   </ModalContent>
   ```

### Mac OS Design Philosophy Integration
The dark mode implementation follows Mac OS design principles with:
- Subtle color transitions between UI elements
- Reduced contrast in dark mode to minimize eye strain
- Consistent visual hierarchy across both modes
- Proper spacing and padding maintained in both modes
- Semantic use of color to indicate interactive elements

### Best Practices Identified
1. **Component-First Approach**: Implementing dark mode at the component level rather than with global CSS ensures more precise control and better maintainability.

2. **Contrast Ratio Consideration**: Ensuring sufficient contrast between text and background in both modes improves accessibility:
   - Light mode: Darker text on light backgrounds
   - Dark mode: Lighter text on dark backgrounds, but not pure white to reduce eye strain

3. **Consistent Hover States**: Maintaining consistent hover state styling across components enhances usability:
   ```jsx
   _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
   ```

4. **Empty State Design**: Designing empty states that work well in both light and dark modes:
   ```jsx
   <Flex 
     direction="column" 
     align="center" 
     justify="center" 
     h="300px" 
     bg={codeBgColor} 
     borderRadius="md"
     color={mutedTextColor}
   >
     <InfoIcon boxSize={10} mb={4} />
     <Text fontSize="lg" fontWeight="medium">
       No simulation results yet
     </Text>
   </Flex>
   ```

## Mac OS Design Patterns for Field Mapping UI (March 9, 2025)

1. Popover Design:
- Use right-side placement to avoid covering content
- Add subtle scaling animations (0.98 to 1.0)
- Include hover transform effects for interactivity
- Keep consistent spacing and padding
- Follow Mac OS-style rounded corners

2. Visual Feedback:
- Smooth transitions (0.2s) for all interactive elements
- Hover states with subtle background changes
- Clear indication of mapped vs unmapped fields
- Subtle transform effects on hover (translateX)
- Semi-transparent states for disabled items

3. Typography and Spacing:
- Use system-like font sizes (sm for content, xs for metadata)
- Medium weight for required fields
- Consistent padding (px={3}, py={2})
- Small asterisk for required fields
- Proper vertical rhythm with VStack spacing

4. Color and Contrast:
- Dark mode support with proper color mapping
- Subtle borders and shadows
- Green highlights for mapped fields
- Proper opacity levels for different states
- Consistent hover state colors

## Mac OS Design Pattern Implementation (March 9, 2025)

1. Modal Layout:
- Use generous spacing (gap={8}) between sections for better readability
- Set appropriate modal sizes (size="6xl") for complex forms
- Maintain consistent padding and margins
- Follow Mac OS form element heights (40px standard)

2. Form Elements:
- Use consistent border radius (6px) for inputs and selects
- Maintain uniform height across form elements
- Apply subtle borders with useColorModeValue
- Size buttons appropriately for touch targets

3. Grid Layout:
- Use asymmetric grids (7:5 ratio) for main/secondary content
- Apply proper spacing between grid items
- Keep related elements grouped together
- Maintain visual hierarchy with consistent spacing

4. Visual Feedback:
- Use subtle hover states for interactive elements
- Apply consistent focus states across components
- Maintain clear visual hierarchy
- Follow Mac OS color schemes for status indicators

## Webhook Field Mapping and Contact Handling

### Implementation Insights
1. **Robust Contact Handling**: Using a check-then-insert/update approach instead of upsert operations provides more reliable contact management:
   ```javascript
   // Check if contact exists first
   const { data: existingContact } = await supabase
     .from('contacts')
     .select('id')
     .eq('phone_number', contactData.phone_number)
     .eq('workspace_id', workspace_id)
     .maybeSingle();
   
   // Then either update or insert based on result
   if (existingContact) {
     // Update existing contact
   } else {
     // Insert new contact
   }
   ```

2. **Field Mapping Fallbacks**: Implementing fallbacks for common field names improves webhook reliability:
   ```javascript
   // Handle common phone field names if no mapping exists
   if (!contactData.phone_number && payload.phone) {
     contactData.phone_number = payload.phone;
   }
   ```

3. **Comprehensive Logging**: Adding detailed logging at each step of webhook processing helps identify issues quickly:
   ```javascript
   console.log('Field mappings result:', { 
     mappings: fieldMappings, 
     count: fieldMappings ? fieldMappings.length : 0,
     error: mappingsError 
   });
   ```

### Technical Solutions
1. **Database Constraints**: Understanding database constraints is crucial when using operations like upsert:
   - Without a unique constraint on `(phone_number, workspace_id)`, upsert operations will fail
   - Using separate insert/update operations avoids this limitation
   - Consider adding unique constraints only after verifying no duplicate data exists

2. **Webhook Payload Handling**: Implementing flexible payload handling improves integration with various systems:
   - Support multiple field name conventions (e.g., `phone`, `phoneNumber`, `phone_number`)
   - Validate required fields before processing
   - Provide clear error messages for missing fields

3. **Error Handling Strategy**: Implementing a comprehensive error handling strategy:
   - Log both the error and the context (payload, IDs)
   - Return appropriate HTTP status codes
   - Store error details in webhook_logs table for later analysis

### Best Practices Identified
1. **Testing with Real-World Data**: Testing webhooks with realistic payloads from the beginning helps identify integration issues early.

2. **Incremental Implementation**: Adding webhook functionality incrementally ensures each component works correctly:
   - First implement basic webhook registration
   - Then add field mapping capabilities
   - Finally implement contact creation/updating

3. **Documentation**: Maintaining clear documentation of webhook endpoints, expected payloads, and field mappings helps with troubleshooting and onboarding new users.

## Webhook Debugging Lessons Learned

### Debugging Insights
1. **Systematic Debugging Approach**: Implementing a systematic approach to debugging webhooks involves:
   - Checking the webhook logs for errors
   - Verifying the payload and field mappings
   - Testing with different payloads and scenarios

2. **Error Handling Strategy**: Implementing a comprehensive error handling strategy:
   - Log both the error and the context (payload, IDs)
   - Return appropriate HTTP status codes
   - Store error details in webhook_logs table for later analysis

3. **Payload Validation**: Validating the webhook payload before processing:
   - Check for required fields
   - Verify field formats (e.g., phone number, email)
   - Handle missing or invalid fields gracefully

4. **Field Mapping Fallbacks**: Implementing fallbacks for common field names improves webhook reliability:
   ```javascript
   // Handle common phone field names if no mapping exists
   if (!contactData.phone_number && payload.phone) {
     contactData.phone_number = payload.phone;
   }
   ```

### Technical Solutions
1. **Webhook Logging**: Implementing comprehensive logging for webhooks:
   - Log incoming payloads
   - Log field mapping results
   - Log errors and exceptions

2. **Error Notification**: Implementing error notification mechanisms:
   - Send error notifications to developers or administrators
   - Display error messages to users

3. **Payload Testing**: Implementing payload testing mechanisms:
   - Test with different payloads and scenarios
   - Verify payload validation and field mapping

### Best Practices Identified
1. **Testing with Real-World Data**: Testing webhooks with realistic payloads from the beginning helps identify integration issues early.

2. **Incremental Implementation**: Adding webhook functionality incrementally ensures each component works correctly:
   - First implement basic webhook registration
   - Then add field mapping capabilities
   - Finally implement contact creation/updating

3. **Documentation**: Maintaining clear documentation of webhook endpoints, expected payloads, and field mappings helps with troubleshooting and onboarding new users.

## Webhook Field Mapping Improvements (March 9, 2025)

1. State Management:
- Always provide default values for props that might be undefined
- Convert between array and object formats at boundaries
- Initialize state after props are available using useEffect
- Handle null/undefined cases explicitly

2. Data Structure Design:
- Keep internal state in array format for easier manipulation
- Convert to object format when sending to backend
- Prevent duplicate field mappings using disabled options
- Maintain at least one mapping row at all times

3. User Experience:
- Show clear validation for required fields
- Provide immediate feedback on field selection
- Use consistent field naming across components
- Follow Mac OS design patterns for form elements

4. Error Prevention:
- Add null checks before Object.entries operations
- Validate required fields before saving
- Handle edge cases in data transformation
- Maintain data integrity during format conversion

## Railway.app Backend Integration (March 9, 2025)

1. Environment Configuration:
- Use environment variables for backend URL configuration
- Set fallback URL for development: `https://deepseek-test-livechat-production.up.railway.app`
- Keep URL generation consistent across frontend components
- Document URL structure in project documentation

2. URL Generation:
- Generate webhook URLs client-side using webhook ID
- Format: `${BACKEND_URL}/webhooks/${webhook.id}`
- No need for additional API calls to get URLs
- Update URLs immediately after webhook creation

3. Best Practices:
- Keep base URL configurable for different environments
- Use consistent URL format across all webhook operations
- Handle URL display and copying in the UI
- Consider URL security and access control

## Webhook URL Generation (March 9, 2025)

1. URL Structure:
- Use consistent URL format: `https://cc.automate8.com/webhooks/{webhook_id}`
- Generate URLs immediately after webhook creation
- Store webhook IDs securely as they are part of the public URL
- Keep base URL configurable for different environments

2. Frontend Integration:
- Generate URLs client-side to reduce server load
- Update UI immediately after webhook creation
- Add copy functionality for easy URL sharing
- Display URLs in a readable format with proper truncation

3. Best Practices:
- Keep URL generation logic consistent across the application
- Handle URL display gracefully when loading or on error
- Ensure URLs are properly encoded
- Consider URL length limitations in UI design

## Webhook Creation Lessons (March 9, 2025)

1. Column Naming Conventions:
- Use descriptive names that clearly indicate the data purpose (e.g., created_by_email vs created_by)
- Follow Supabase's recommendation of using lowercase with underscores
- Be consistent with column types (text for emails, uuid for IDs)
- Document column purposes in schema design

2. Error Handling:
- Schema errors like "column not found" indicate a mismatch between code and database
- Always verify column names in Supabase dashboard before implementation
- Keep database schema documentation up to date
- Test webhook creation with proper error messages

3. User Authentication:
- Store user email for better readability and debugging
- Ensure workspace_id and user email are properly associated
- Maintain clear audit trail of webhook creation

## Webhook Creation Field Requirements (March 9, 2025)

1. Required Fields:
- Always include `source` field when creating webhooks (cannot be null)
- Use meaningful source values to track webhook origins (e.g., 'custom' for manually created)
- Other required fields: name, workspace_id, status
- Optional but recommended: created_by_email for audit trail

2. Database Constraints:
- Not-null constraints help maintain data integrity
- Always check table schema for required fields before implementing create operations
- Handle constraint violations with clear error messages
- Document required fields in API documentation

3. Default Values:
- Set sensible defaults for required fields
- Use consistent default values across the application
- Document default values in code comments and documentation

## Key Lessons from Webhook Implementation

## Database and Schema Design
1. Be consistent with column naming across the system
2. Document table schemas and required columns
3. Use timestamp with timezone for all temporal fields
4. Keep field names consistent between frontend and backend

## Webhook Logging
1. Column names matter:
   - Use `timestamp` instead of `created_at` to match database schema
   - Be explicit about column names in queries
   - Validate schema before implementing UI components
2. Error Handling:
   - Add detailed error messages in toasts
   - Log both webhook payload and results
   - Include workspace context in error messages
3. UI Considerations:
   - Show loading states during data fetching
   - Provide clear feedback for empty states
   - Format timestamps consistently

## Key Lessons from Webhook UI Redesign

## macOS Design Philosophy
1. Sidebar Navigation:
   - Fixed sidebar with clear visual hierarchy
   - Active state indicators with chevrons
   - Consistent spacing and padding
   - Subtle hover states and transitions

2. Content Organization:
   - Main content area with cards grid
   - Dedicated workspace for selected actions
   - Clean separation of concerns
   - Progressive disclosure of information

3. Visual Feedback:
   - Status badges with semantic colors
   - Loading states with spinners
   - Error states with clear messaging
   - Success confirmations with toasts

4. Component Structure:
   - Separate components for better maintainability
   - Shared color mode values
   - Consistent styling patterns
   - Reusable UI elements

## Environment Variable Management (March 9, 2025)

1. Environment Variable Usage:
- Use REACT_APP_BACKEND_URL for base URL configuration
- Never hardcode fallback values for critical configuration
- Add error logging for missing environment variables
- Document required environment variables in project setup

2. Frontend Integration:
- Access environment variables via process.env
- Add validation for required environment variables
- Log clear error messages for missing variables
- Keep configuration separate from business logic

3. Best Practices:
- Document all required environment variables
- Add validation at startup
- Use descriptive variable names
- Follow React environment variable naming (REACT_APP_ prefix)

## Environment Variable Access in React (March 9, 2025)

1. Direct Environment Variable Access:
- Environment variables can be accessed directly via process.env
- No need for REACT_APP_ prefix for non-React specific variables
- Keep consistent naming across backend and frontend
- Document environment variables in .env.example

2. URL Generation:
- Use environment variables for base URLs
- Keep URL format consistent: `${BACKEND_URL}/webhooks/${id}`
- Include workspace ID in request headers
- Validate environment variables before use

3. Best Practices:
- Use descriptive variable names
- Document required variables in .env.example
- Add validation checks at component level
- Show clear error messages for missing variables

## React Environment Variables (March 9, 2025)

1. React Environment Variable Naming:
- Must prefix with REACT_APP_ to be accessible in React frontend
- Example: REACT_APP_BACKEND_URL instead of BACKEND_URL
- This is a Create React App requirement for security
- Variables without prefix will be undefined in frontend

2. Environment Variable Best Practices:
- Document all variables in .env.example
- Keep consistent naming across frontend
- Add validation checks in components
- Show clear error messages for missing variables

3. URL Configuration:
- Use REACT_APP_BACKEND_URL for base URL
- Keep URL generation consistent
- Include required headers in notes
- Validate environment variables early

## Webhook Debugging Lessons Learned

### Debugging Insights
1. **Systematic Debugging Approach**: Implementing a systematic approach to debugging webhooks involves:
   - Checking the webhook logs for errors
   - Verifying the payload and field mappings
   - Testing with different payloads and scenarios

2. **Error Handling Strategy**: Implementing a comprehensive error handling strategy:
   - Log both the error and the context (payload, IDs)
   - Return appropriate HTTP status codes
   - Store error details in webhook_logs table for later analysis

3. **Payload Validation**: Validating the webhook payload before processing:
   - Check for required fields
   - Verify field formats (e.g., phone number, email)
   - Handle missing or invalid fields gracefully

4. **Field Mapping Fallbacks**: Implementing fallbacks for common field names improves webhook reliability:
   ```javascript
   // Handle common phone field names if no mapping exists
   if (!contactData.phone_number && payload.phone) {
     contactData.phone_number = payload.phone;
   }
   ```

### Technical Solutions
1. **Webhook Logging**: Implementing comprehensive logging for webhooks:
   - Log incoming payloads
   - Log field mapping results
   - Log errors and exceptions

2. **Error Notification**: Implementing error notification mechanisms:
   - Send error notifications to developers or administrators
   - Display error messages to users

3. **Payload Testing**: Implementing payload testing mechanisms:
   - Test with different payloads and scenarios
   - Verify payload validation and field mapping

### Best Practices Identified
1. **Testing with Real-World Data**: Testing webhooks with realistic payloads from the beginning helps identify integration issues early.

2. **Incremental Implementation**: Adding webhook functionality incrementally ensures each component works correctly:
   - First implement basic webhook registration
   - Then add field mapping capabilities
   - Finally implement contact creation/updating

3. **Documentation**: Maintaining clear documentation of webhook endpoints, expected payloads, and field mappings helps with troubleshooting and onboarding new users.

## Webhook Field Mapping UI Improvements

1. UI/UX Design:
- Keep field mapping interface simple and intuitive
- Place mapping controls (buttons) directly next to the data
- Use visual indicators (circles) that clearly show what can be mapped
- Follow Mac OS design patterns for consistency
- Show clear feedback when fields are mapped

2. Sample Payload Management:
- Allow loading previous payloads from webhook logs
- Maintain proper error handling for JSON parsing
- Show clear feedback for loading states
- Keep the JSON editor code-like with monospace font

3. Security Considerations:
- Enable Row Level Security (RLS) on webhook_logs table
- Ensure users can only access logs from their workspace
- Include workspace_id in queries to maintain security
- Handle errors gracefully with user-friendly messages

4. State Management:
- Track loading states separately for different operations
- Keep mappings state synchronized with the backend
- Validate JSON input without disrupting user input
- Preserve existing mappings when loading new payloads

## JSON Field Mapping UI Design (March 9, 2025)

1. Interactive Field Mapping:
- Display JSON data in a clean, readable format
- Show field paths and values side by side
- Enable direct mapping through clickable values
- Provide visual feedback for mapped fields

2. Mac OS Design Integration:
- Use monospaced fonts for JSON display
- Apply subtle hover states for interactive elements
- Maintain consistent spacing and padding
- Follow Mac OS color schemes and transitions

3. User Experience Improvements:
- Add copy functionality for JSON paths
- Show mapping status with badges and icons
- Provide clear validation feedback
- Keep the interface clean and focused

4. Component Organization:
- Separate JSON preview from mapping controls
- Use consistent button and input styles
- Maintain clear visual hierarchy
- Integrate testing functionality seamlessly

## React Component Import Best Practices

1. Icon Management:
- Import all icons from a single source when possible
- Group related icons together in imports
- Consider icon bundle size when importing
- Follow consistent naming conventions (e.g., Vsc prefix for VS Code icons)

2. Error Prevention:
- Always verify imported components are used
- Keep imports organized and grouped by source
- Remove unused imports to prevent bloat
- Test component after adding new imports

## Key Lessons from Webhook Implementation

## Database and Schema Design
1. Be consistent with column naming across the system
2. Document table schemas and required columns
3. Use timestamp with timezone for all temporal fields
4. Keep field names consistent between frontend and backend

## Webhook Logging
1. Column names matter:
   - Use `timestamp` instead of `created_at` to match database schema
   - Be explicit about column names in queries
   - Validate schema before implementing UI components
2. Error Handling:
   - Add detailed error messages in toasts
   - Log both webhook payload and results
   - Include workspace context in error messages
3. UI Considerations:
   - Show loading states during data fetching
   - Provide clear feedback for empty states
   - Format timestamps consistently

## Key Lessons from Webhook UI Redesign

## macOS Design Philosophy
1. Sidebar Navigation:
   - Fixed sidebar with clear visual hierarchy
   - Active state indicators with chevrons
   - Consistent spacing and padding
   - Subtle hover states and transitions

2. Content Organization:
   - Main content area with cards grid
   - Dedicated workspace for selected actions
   - Clean separation of concerns
   - Progressive disclosure of information

3. Visual Feedback:
   - Status badges with semantic colors
   - Loading states with spinners
   - Error states with clear messaging
   - Success confirmations with toasts

4. Component Structure:
   - Separate components for better maintainability
   - Shared color mode values
   - Consistent styling patterns
   - Reusable UI elements

## Two-Column Layout Design for Webhook Configuration (March 9, 2025)

1. Layout Strategy:
- Split complex interfaces into logical columns
- Keep related content together (JSON payload | Field mappings)
- Match heights between columns for visual balance
- Use consistent spacing and padding (gap={6})
- Maintain scrollable content within fixed heights

2. Interactive Mapping:
- Make JSON fields directly clickable for mapping
- Show mapping status inline with the data
- Provide clear visual feedback on hover
- Include quick actions (remove mapping) where relevant
- Keep interaction patterns consistent

3. Visual Hierarchy:
- Use subtle backgrounds to indicate state
- Apply consistent hover effects
- Show relationships with arrows and colors
- Maintain clear section headers
- Follow Mac OS visual patterns

4. Performance Considerations:
- Handle large JSON payloads efficiently
- Optimize scroll performance
- Prevent unnecessary re-renders
- Keep UI responsive during mapping
- Cache mapped field information

## Color Mode Management in React Components (March 10, 2025)

1. Consistent Color Mode Usage:
- Import both `useColorMode` and `useColorModeValue` from Chakra UI
- Use `useColorMode` for dynamic color values in CSS-in-JS
- Use `useColorModeValue` for static color values
- Keep color mode hooks at component level

2. Component Organization:
- Declare color mode hooks at the start of components
- Group related color values together
- Use consistent naming for color variables
- Follow Mac OS color patterns for light/dark modes

3. Performance Optimization:
- Avoid unnecessary color mode calculations
- Cache color values when possible
- Use CSS variables for frequently used colors
- Minimize color mode-related rerenders

4. Best Practices:
- Always import required hooks and components
- Use consistent color mode patterns across components
- Follow Mac OS design guidelines for color transitions
- Test components in both light and dark modes

## UI Design Lessons - March 10, 2025

### Minimalist Header Design
- Removing redundant information (like contact count) from headers improves focus
- Using Spacer component helps achieve balanced layouts
- Ghost variants for secondary actions maintain visual hierarchy
- Consistent button sizes and icon dimensions enhance professionalism

### Pagination Best Practices
- Show total count in footer instead of header for better information hierarchy
- Use ghost variant for Load More button to maintain minimal design
- Only show Load More when there's more data to load (hasNextPage)
- Include loading state feedback for better UX

### Component Integration
- Reusing existing components (QuickMessage) reduces code duplication
- Consistent menu structure across old and new components
- Proper z-index management with Portal for overlays
- Maintaining state locally for active features (calls, messages)

These lessons align with Mac OS design principles of clarity, efficiency, and consistency.

## Messaging System Integration - March 10, 2025

### Service Organization
- Keep messaging services separate and focused:
  - `twilio.js` for Twilio-specific operations
  - `messageService.js` for general message management
  - `socket.js` for real-time updates
- Each service should have a clear, single responsibility
- Document API endpoints and expected formats

### Error Handling Best Practices
- Invalid JSON errors often indicate:
  - Mismatched API expectations
  - Wrong service function being used
  - Missing or incorrect parameters
- Always validate phone numbers before sending
- Provide clear, user-friendly error messages
- Use toast notifications for feedback

### Component Integration
- Follow separation of concerns:
  - Components handle UI and user interaction
  - Services handle business logic and API calls
  - Utils handle data formatting and validation
- Keep service interfaces consistent
- Document dependencies and requirements

These improvements align with Mac OS design principles of reliability and user feedback while maintaining clean code organization.

## Contact Management Handler Organization (March 11, 2025)

### Implementation Insights
1. **Handler Organization**: Grouping handlers by functionality improves code maintainability and readability:
   ```javascript
   // Selection handlers
   const handleSelectAll = (e) => { /* ... */ };
   const handleSelectContact = (e, contactId) => { /* ... */ };

   // Action handlers
   const handleAddToBoard = (contact) => { /* ... */ };
   const handleUpdateStatus = async (contactId, newStatus) => { /* ... */ };

   // Bulk action handlers
   const handleBulkDelete = async () => { /* ... */ };
   const handleBulkUpdateStatus = async (newStatus) => { /* ... */ };
   ```

2. **Event Handling**: Proper event handling for selection prevents unwanted side effects:
   ```javascript
   const handleSelectContact = (e, contactId) => {
     e.stopPropagation();  // Prevent row click event
     const newSelectedContacts = e.target.checked 
       ? [...selectedContacts, contactId]
       : selectedContacts.filter(id => id !== contactId);
     setSelectedContacts(newSelectedContacts);
   };
   ```

3. **Toast Notifications**: Consistent toast notifications following Mac OS design principles:
   ```javascript
   toast({
     title: `${selectedContacts.length} contacts updated`,
     description: `Contacts marked as ${newStatus}`,
     status: newStatus === 'dnc' ? 'warning' : 'success',
     duration: 3000,
     isClosable: true,
     position: 'top-right',
   });
   ```

### Technical Solutions
1. **Single Source of Truth**: Maintaining a single implementation for each action type:
   - One handler for both individual and bulk board actions
   - Consistent error handling across all operations
   - Unified toast notification system
   - Common state management patterns

2. **Error Handling**: Comprehensive error handling with proper user feedback:
   ```javascript
   try {
     const { error } = await useContactV2Store.getState().updateContact(contactId, {
       status: newStatus
     });
     if (error) throw error;
     // Success handling
   } catch (error) {
     console.error('Error updating contact status:', error);
     toast({
       title: 'Error updating status',
       description: error.message,
       status: 'error',
       duration: 3000,
       isClosable: true,
     });
   }
   ```

### Mac OS Design Philosophy Integration
1. **Visual Feedback**:
   - Clean, minimal toast notifications
   - Consistent positioning (top-right)
   - Appropriate status colors (warning, success, error)
   - Proper duration for notifications (3000ms)

2. **Interaction Design**:
   - Checkbox selection follows Mac OS patterns
   - Clear visual feedback for bulk actions
   - Proper event propagation control
   - Intuitive selection behavior

### Best Practices Identified
1. **Code Organization**:
   - Group related handlers together
   - Use descriptive function names
   - Maintain consistent error handling
   - Follow single responsibility principle

2. **State Management**:
   - Clear selection state updates
   - Proper cleanup after operations
   - Consistent store usage
   - Efficient bulk operations

3. **User Experience**:
   - Clear feedback for all actions
   - Proper loading states
   - Consistent error messages
   - Intuitive selection behavior

## Key Lessons from Webhook Implementation

## Database and Schema Design
1. Be consistent with column naming across the system
2. Document table schemas and required columns
3. Use timestamp with timezone for all temporal fields
4. Keep field names consistent between frontend and backend

## Webhook Logging
1. Column names matter:
   - Use `timestamp` instead of `created_at` to match database schema
   - Be explicit about column names in queries
   - Validate schema before implementing UI components
2. Error Handling:
   - Add detailed error messages in toasts
   - Log both webhook payload and results
   - Include workspace context in error messages
3. UI Considerations:
   - Show loading states during data fetching
   - Provide clear feedback for empty states
   - Format timestamps consistently

## Key Lessons from Webhook UI Redesign

## macOS Design Philosophy
1. Sidebar Navigation:
   - Fixed sidebar with clear visual hierarchy
   - Active state indicators with chevrons
   - Consistent spacing and padding
   - Subtle hover states and transitions

2. Content Organization:
   - Main content area with cards grid
   - Dedicated workspace for selected actions
   - Clean separation of concerns
   - Progressive disclosure of information

3. Visual Feedback:
   - Status badges with semantic colors
   - Loading states with spinners
   - Error states with clear messaging
   - Success confirmations with toasts

4. Component Structure:
   - Separate components for better maintainability
   - Shared color mode values
   - Consistent styling patterns
   - Reusable UI elements

## Environment Variable Management (March 9, 2025)

1. Environment Variable Usage:
- Use REACT_APP_BACKEND_URL for base URL configuration
- Never hardcode fallback values for critical configuration
- Add error logging for missing environment variables
- Document required environment variables in project setup

2. Frontend Integration:
- Access environment variables via process.env
- Add validation for required environment variables
- Log clear error messages for missing variables
- Keep configuration separate from business logic

3. Best Practices:
- Document all required environment variables
- Add validation at startup
- Use descriptive variable names
- Follow React environment variable naming (REACT_APP_ prefix)

## Environment Variable Access in React (March 9, 2025)

1. Direct Environment Variable Access:
- Environment variables can be accessed directly via process.env
- No need for REACT_APP_ prefix for non-React specific variables
- Keep consistent naming across backend and frontend
- Document environment variables in .env.example

2. URL Generation:
- Use environment variables for base URLs
- Keep URL format consistent: `${BACKEND_URL}/webhooks/${id}`
- Include workspace ID in request headers
- Validate environment variables before use

3. Best Practices:
- Use descriptive variable names
- Document required variables in .env.example
- Add validation checks at component level
- Show clear error messages for missing variables

## React Environment Variables (March 9, 2025)

1. React Environment Variable Naming:
- Must prefix with REACT_APP_ to be accessible in React frontend
- Example: REACT_APP_BACKEND_URL instead of BACKEND_URL
- This is a Create React App requirement for security
- Variables without prefix will be undefined in frontend

2. Environment Variable Best Practices:
- Document all variables in .env.example
- Keep consistent naming across frontend
- Add validation checks in components
- Show clear error messages for missing variables

3. URL Configuration:
- Use REACT_APP_BACKEND_URL for base URL
- Keep URL generation consistent
- Include required headers in notes
- Validate environment variables early

## Webhook Debugging Lessons Learned

### Debugging Insights
1. **Systematic Debugging Approach**: Implementing a systematic approach to debugging webhooks involves:
   - Checking the webhook logs for errors
   - Verifying the payload and field mappings
   - Testing with different payloads and scenarios

2. **Error Handling Strategy**: Implementing a comprehensive error handling strategy:
   - Log both the error and the context (payload, IDs)
   - Return appropriate HTTP status codes
   - Store error details in webhook_logs table for later analysis

3. **Payload Validation**: Validating the webhook payload before processing:
   - Check for required fields
   - Verify field formats (e.g., phone number, email)
   - Handle missing or invalid fields gracefully

4. **Field Mapping Fallbacks**: Implementing fallbacks for common field names improves webhook reliability:
   ```javascript
   // Handle common phone field names if no mapping exists
   if (!contactData.phone_number && payload.phone) {
     contactData.phone_number = payload.phone;
   }
   ```

### Technical Solutions
1. **Webhook Logging**: Implementing comprehensive logging for webhooks:
   - Log incoming payloads
   - Log field mapping results
   - Log errors and exceptions

2. **Error Notification**: Implementing error notification mechanisms:
   - Send error notifications to developers or administrators
   - Display error messages to users

3. **Payload Testing**: Implementing payload testing mechanisms:
   - Test with different payloads and scenarios
   - Verify payload validation and field mapping

### Best Practices Identified
1. **Testing with Real-World Data**: Testing webhooks with realistic payloads from the beginning helps identify integration issues early.

2. **Incremental Implementation**: Adding webhook functionality incrementally ensures each component works correctly:
   - First implement basic webhook registration
   - Then add field mapping capabilities
   - Finally implement contact creation/updating

3. **Documentation**: Maintaining clear documentation of webhook endpoints, expected payloads, and field mappings helps with troubleshooting and onboarding new users.

## Webhook Field Mapping UI Improvements

1. UI/UX Design:
- Keep field mapping interface simple and intuitive
- Place mapping controls (buttons) directly next to the data
- Use visual indicators (circles) that clearly show what can be mapped
- Follow Mac OS design patterns for consistency
- Show clear feedback when fields are mapped

2. Sample Payload Management:
- Allow loading previous payloads from webhook logs
- Maintain proper error handling for JSON parsing
- Show clear feedback for loading states
- Keep the JSON editor code-like with monospace font

3. Security Considerations:
- Enable Row Level Security (RLS) on webhook_logs table
- Ensure users can only access logs from their workspace
- Include workspace_id in queries to maintain security
- Handle errors gracefully with user-friendly messages

4. State Management:
- Track loading states separately for different operations
- Keep mappings state synchronized with the backend
- Validate JSON input without disrupting user input
- Preserve existing mappings when loading new payloads

## JSON Field Mapping UI Design (March 9, 2025)

1. Interactive Field Mapping:
- Display JSON data in a clean, readable format
- Show field paths and values side by side
- Enable direct mapping through clickable values
- Provide visual feedback for mapped fields

2. Mac OS Design Integration:
- Use monospaced fonts for JSON display
- Apply subtle hover states for interactive elements
- Maintain consistent spacing and padding
- Follow Mac OS color schemes and transitions

3. User Experience Improvements:
- Add copy functionality for JSON paths
- Show mapping status with badges and icons
- Provide clear validation feedback
- Keep the interface clean and focused

4. Component Organization:
- Separate JSON preview from mapping controls
- Use consistent button and input styles
- Maintain clear visual hierarchy
- Integrate testing functionality seamlessly

## React Component Import Best Practices

1. Icon Management:
- Import all icons from a single source when possible
- Group related icons together in imports
- Consider icon bundle size when importing
- Follow consistent naming conventions (e.g., Vsc prefix for VS Code icons)

2. Error Prevention:
- Always verify imported components are used
- Keep imports organized and grouped by source
- Remove unused imports to prevent bloat
- Test component after adding new imports

## Key Lessons from Webhook Implementation

## Database and Schema Design
1. Be consistent with column naming across the system
2. Document table schemas and required columns
3. Use timestamp with timezone for all temporal fields
4. Keep field names consistent between frontend and backend

## Webhook Logging
1. Column names matter:
   - Use `timestamp` instead of `created_at` to match database schema
   - Be explicit about column names in queries
   - Validate schema before implementing UI components
2. Error Handling:
   - Add detailed error messages in toasts
   - Log both webhook payload and results
   - Include workspace context in error messages
3. UI Considerations:
   - Show loading states during data fetching
   - Provide clear feedback for empty states
   - Format timestamps consistently

## Key Lessons from Webhook UI Redesign

## macOS Design Philosophy
1. Sidebar Navigation:
   - Fixed sidebar with clear visual hierarchy
   - Active state indicators with chevrons
   - Consistent spacing and padding
   - Subtle hover states and transitions

2. Content Organization:
   - Main content area with cards grid
   - Dedicated workspace for selected actions
   - Clean separation of concerns
   - Progressive disclosure of information

3. Visual Feedback:
   - Status badges with semantic colors
   - Loading states with spinners
   - Error states with clear messaging
   - Success confirmations with toasts

4. Component Structure:
   - Separate components for better maintainability
   - Shared color mode values
   - Consistent styling patterns
   - Reusable UI elements

## Two-Column Layout Design for Webhook Configuration (March 9, 2025)

1. Layout Strategy:
- Split complex interfaces into logical columns
- Keep related content together (JSON payload | Field mappings)
- Match heights between columns for visual balance
- Use consistent spacing and padding (gap={6})
- Maintain scrollable content within fixed heights

2. Interactive Mapping:
- Make JSON fields directly clickable for mapping
- Show mapping status inline with the data
- Provide clear visual feedback on hover
- Include quick actions (remove mapping) where relevant
- Keep interaction patterns consistent

3. Visual Hierarchy:
- Use subtle backgrounds to indicate state
- Apply consistent hover effects
- Show relationships with arrows and colors
- Maintain clear section headers
- Follow Mac OS visual patterns

4. Performance Considerations:
- Handle large JSON payloads efficiently
- Optimize scroll performance
- Prevent unnecessary re-renders
- Keep UI responsive during mapping
- Cache mapped field information

## Color Mode Management in React Components (March 10, 2025)

1. Consistent Color Mode Usage:
- Import both `useColorMode` and `useColorModeValue` from Chakra UI
- Use `useColorMode` for dynamic color values in CSS-in-JS
- Use `useColorModeValue` for static color values
- Keep color mode hooks at component level

2. Component Organization:
- Declare color mode hooks at the start of components
- Group related color values together
- Use consistent naming for color variables
- Follow Mac OS color patterns for light/dark modes

3. Performance Optimization:
- Avoid unnecessary color mode calculations
- Cache color values when possible
- Use CSS variables for frequently used colors
- Minimize color mode-related rerenders

4. Best Practices:
- Always import required hooks and components
- Use consistent color mode patterns across components
- Follow Mac OS design guidelines for color transitions
- Test components in both light and dark modes

## UI Design Lessons - March 10, 2025

### Minimalist Header Design
- Removing redundant information (like contact count) from headers improves focus
- Using Spacer component helps achieve balanced layouts
- Ghost variants for secondary actions maintain visual hierarchy
- Consistent button sizes and icon dimensions enhance professionalism

### Pagination Best Practices
- Show total count in footer instead of header for better information hierarchy
- Use ghost variant for Load More button to maintain minimal design
- Only show Load More when there's more data to load (hasNextPage)
- Include loading state feedback for better UX

### Component Integration
- Reusing existing components (QuickMessage) reduces code duplication
- Consistent menu structure across old and new components
- Proper z-index management with Portal for overlays
- Maintaining state locally for active features (calls, messages)

These lessons align with Mac OS design principles of clarity, efficiency, and consistency.

## Messaging System Integration - March 10, 2025

### Service Organization
- Keep messaging services separate and focused:
  - `twilio.js` for Twilio-specific operations
  - `messageService.js` for general message management
  - `socket.js` for real-time updates
- Each service should have a clear, single responsibility
- Document API endpoints and expected formats

### Error Handling Best Practices
- Invalid JSON errors often indicate:
  - Mismatched API expectations
  - Wrong service function being used
  - Missing or incorrect parameters
- Always validate phone numbers before sending
- Provide clear, user-friendly error messages
- Use toast notifications for feedback

### Component Integration
- Follow separation of concerns:
  - Components handle UI and user interaction
  - Services handle business logic and API calls
  - Utils handle data formatting and validation
- Keep service interfaces consistent
- Document dependencies and requirements

These improvements align with Mac OS design principles of reliability and user feedback while maintaining clean code organization.

## Contact Tag Rendering
### Problem
When rendering contact tags, we encountered runtime errors due to inconsistent tag data types. Tags could be either strings or objects with properties like `name` or `label`.

### Solution
1. Implemented consistent tag parsing across all components:
   - Added type checking for both string and object tags
   - Used fallback patterns for object tags (name -> label -> string conversion)
   - Maintained single source of truth for tag parsing logic

### Key Learnings
1. When dealing with dynamic data structures:
   - Always validate data types before rendering
   - Implement consistent parsing across all components
   - Keep the original design intact while fixing underlying issues
2. Follow Mac OS design principles:
   - Maintain visual consistency during bug fixes
   - Prioritize reliability without compromising UX
   - Keep changes minimal and focused

## Key Lessons from Webhook Implementation

## Database and Schema Design
1. Be consistent with column naming across the system
2. Document table schemas and required columns
3. Use timestamp with timezone for all temporal fields
4. Keep field names consistent between frontend and backend

## Webhook Logging
1. Column names matter:
   - Use `timestamp` instead of `created_at` to match database schema
   - Be explicit about column names in queries
   - Validate schema before implementing UI components
2. Error Handling:
   - Add detailed error messages in toasts
   - Log both webhook payload and results
   - Include workspace context in error messages
3. UI Considerations:
   - Show loading states during data fetching
   - Provide clear feedback for empty states
   - Format timestamps consistently

## Key Lessons from Webhook UI Redesign

## macOS Design Philosophy
1. Sidebar Navigation:
   - Fixed sidebar with clear visual hierarchy
   - Active state indicators with chevrons
   - Consistent spacing and padding
   - Subtle hover states and transitions

2. Content Organization:
   - Main content area with cards grid
   - Dedicated workspace for selected actions
   - Clean separation of concerns
   - Progressive disclosure of information

3. Visual Feedback:
   - Status badges with semantic colors
   - Loading states with spinners
   - Error states with clear messaging
   - Success confirmations with toasts

4. Component Structure:
   - Separate components for better maintainability
   - Shared color mode values
   - Consistent styling patterns
   - Reusable UI elements

## Environment Variable Management (March 9, 2025)

1. Environment Variable Usage:
- Use REACT_APP_BACKEND_URL for base URL configuration
- Never hardcode fallback values for critical configuration
- Add error logging for missing environment variables
- Document required environment variables in project setup

2. Frontend Integration:
- Access environment variables via process.env
- Add validation for required environment variables
- Log clear error messages for missing variables
- Keep configuration separate from business logic

3. Best Practices:
- Document all required environment variables
- Add validation at startup
- Use descriptive variable names
- Follow React environment variable naming (REACT_APP_ prefix)

## Environment Variable Access in React (March 9, 2025)

1. Direct Environment Variable Access:
- Environment variables can be accessed directly via process.env
- No need for REACT_APP_ prefix for non-React specific variables
- Keep consistent naming across backend and frontend
- Document environment variables in .env.example

2. URL Generation:
- Use environment variables for base URLs
- Keep URL format consistent: `${BACKEND_URL}/webhooks/${id}`
- Include workspace ID in request headers
- Validate environment variables before use

3. Best Practices:
- Use descriptive variable names
- Document required variables in .env.example
- Add validation checks at component level
- Show clear error messages for missing variables

## React Environment Variables (March 9, 2025)

1. React Environment Variable Naming:
- Must prefix with REACT_APP_ to be accessible in React frontend
- Example: REACT_APP_BACKEND_URL instead of BACKEND_URL
- This is a Create React App requirement for security
- Variables without prefix will be undefined in frontend

2. Environment Variable Best Practices:
- Document all variables in .env.example
- Keep consistent naming across frontend
- Add validation checks in components
- Show clear error messages for missing variables

3. URL Configuration:
- Use REACT_APP_BACKEND_URL for base URL
- Keep URL generation consistent
- Include required headers in notes
- Validate environment variables early

## Webhook Debugging Lessons Learned

### Debugging Insights
1. **Systematic Debugging Approach**: Implementing a systematic approach to debugging webhooks involves:
   - Checking the webhook logs for errors
   - Verifying the payload and field mappings
   - Testing with different payloads and scenarios

2. **Error Handling Strategy**: Implementing a comprehensive error handling strategy:
   - Log both the error and the context (payload, IDs)
   - Return appropriate HTTP status codes
   - Store error details in webhook_logs table for later analysis

3. **Payload Validation**: Validating the webhook payload before processing:
   - Check for required fields
   - Verify field formats (e.g., phone number, email)
   - Handle missing or invalid fields gracefully

4. **Field Mapping Fallbacks**: Implementing fallbacks for common field names improves webhook reliability:
   ```javascript
   // Handle common phone field names if no mapping exists
   if (!contactData.phone_number && payload.phone) {
     contactData.phone_number = payload.phone;
   }
   ```

### Technical Solutions
1. **Webhook Logging**: Implementing comprehensive logging for webhooks:
   - Log incoming payloads
   - Log field mapping results
   - Log errors and exceptions

2. **Error Notification**: Implementing error notification mechanisms:
   - Send error notifications to developers or administrators
   - Display error messages to users

3. **Payload Testing**: Implementing payload testing mechanisms:
   - Test with different payloads and scenarios
   - Verify payload validation and field mapping

### Best Practices Identified
1. **Testing with Real-World Data**: Testing webhooks with realistic payloads from the beginning helps identify integration issues early.

2. **Incremental Implementation**: Adding webhook functionality incrementally ensures each component works correctly:
   - First implement basic webhook registration
   - Then add field mapping capabilities
   - Finally implement contact creation/updating

3. **Documentation**: Maintaining clear documentation of webhook endpoints, expected payloads, and field mappings helps with troubleshooting and onboarding new users.

## Webhook Field Mapping UI Improvements

1. UI/UX Design:
- Keep field mapping interface simple and intuitive
- Place mapping controls (buttons) directly next to the data
- Use visual indicators (circles) that clearly show what can be mapped
- Follow Mac OS design patterns for consistency
- Show clear feedback when fields are mapped

2. Sample Payload Management:
- Allow loading previous payloads from webhook logs
- Maintain proper error handling for JSON parsing
- Show clear feedback for loading states
- Keep the JSON editor code-like with monospace font

3. Security Considerations:
- Enable Row Level Security (RLS) on webhook_logs table
- Ensure users can only access logs from their workspace
- Include workspace_id in queries to maintain security
- Handle errors gracefully with user-friendly messages

4. State Management:
- Track loading states separately for different operations
- Keep mappings state synchronized with the backend
- Validate JSON input without disrupting user input
- Preserve existing mappings when loading new payloads

## JSON Field Mapping UI Design (March 9, 2025)

1. Interactive Field Mapping:
- Display JSON data in a clean, readable format
- Show field paths and values side by side
- Enable direct mapping through clickable values
- Provide visual feedback for mapped fields

2. Mac OS Design Integration:
- Use monospaced fonts for JSON display
- Apply subtle hover states for interactive elements
- Maintain consistent spacing and padding
- Follow Mac OS color schemes and transitions

3. User Experience Improvements:
- Add copy functionality for JSON paths
- Show mapping status with badges and icons
- Provide clear validation feedback
- Keep the interface clean and focused

4. Component Organization:
- Separate JSON preview from mapping controls
- Use consistent button and input styles
- Maintain clear visual hierarchy
- Integrate testing functionality seamlessly

## React Component Import Best Practices

1. Icon Management:
- Import all icons from a single source when possible
- Group related icons together in imports
- Consider icon bundle size when importing
- Follow consistent naming conventions (e.g., Vsc prefix for VS Code icons)

2. Error Prevention:
- Always verify imported components are used
- Keep imports organized and grouped by source
- Remove unused imports to prevent bloat
- Test component after adding new imports

## Key Lessons from Webhook Implementation

## Database and Schema Design
1. Be consistent with column naming across the system
2. Document table schemas and required columns
3. Use timestamp with timezone for all temporal fields
4. Keep field names consistent between frontend and backend

## Webhook Logging
1. Column names matter:
   - Use `timestamp` instead of `created_at` to match database schema
   - Be explicit about column names in queries
   - Validate schema before implementing UI components
2. Error Handling:
   - Add detailed error messages in toasts
   - Log both webhook payload and results
   - Include workspace context in error messages
3. UI Considerations:
   - Show loading states during data fetching
   - Provide clear feedback for empty states
   - Format timestamps consistently

## Key Lessons from Webhook UI Redesign

## macOS Design Philosophy
1. Sidebar Navigation:
   - Fixed sidebar with clear visual hierarchy
   - Active state indicators with chevrons
   - Consistent spacing and padding
   - Subtle hover states and transitions

2. Content Organization:
   - Main content area with cards grid
   - Dedicated workspace for selected actions
   - Clean separation of concerns
   - Progressive disclosure of information

3. Visual Feedback:
   - Status badges with semantic colors
   - Loading states with spinners
   - Error states with clear messaging
   - Success confirmations with toasts

4. Component Structure:
   - Separate components for better maintainability
   - Shared color mode values
   - Consistent styling patterns
   - Reusable UI elements

## Two-Column Layout Design for Webhook Configuration (March 9, 2025)

1. Layout Strategy:
- Split complex interfaces into logical columns
- Keep related content together (JSON payload | Field mappings)
- Match heights between columns for visual balance
- Use consistent spacing and padding (gap={6})
- Maintain scrollable content within fixed heights

2. Interactive Mapping:
- Make JSON fields directly clickable for mapping
- Show mapping status inline with the data
- Provide clear visual feedback on hover
- Include quick actions (remove mapping) where relevant
- Keep interaction patterns consistent

3. Visual Hierarchy:
- Use subtle backgrounds to indicate state
- Apply consistent hover effects
- Show relationships with arrows and colors
- Maintain clear section headers
- Follow Mac OS visual patterns

4. Performance Considerations:
- Handle large JSON payloads efficiently
- Optimize scroll performance
- Prevent unnecessary re-renders
- Keep UI responsive during mapping
- Cache mapped field information

## Color Mode Management in React Components (March 10, 2025)

1. Consistent Color Mode Usage:
- Import both `useColorMode` and `useColorModeValue` from Chakra UI
- Use `useColorMode` for dynamic color values in CSS-in-JS
- Use `useColorModeValue` for static color values
- Keep color mode hooks at component level

2. Component Organization:
- Declare color mode hooks at the start of components
- Group related color values together
- Use consistent naming for color variables
- Follow Mac OS color patterns for light/dark modes

3. Performance Optimization:
- Avoid unnecessary color mode calculations
- Cache color values when possible
- Use CSS variables for frequently used colors
- Minimize color mode-related rerenders

4. Best Practices:
- Always import required hooks and components
- Use consistent color mode patterns across components
- Follow Mac OS design guidelines for color transitions
- Test components in both light and dark modes

## UI Design Lessons - March 10, 2025

### Minimalist Header Design
- Removing redundant information (like contact count) from headers improves focus
- Using Spacer component helps achieve balanced layouts
- Ghost variants for secondary actions maintain visual hierarchy
- Consistent button sizes and icon dimensions enhance professionalism

### Pagination Best Practices
- Show total count in footer instead of header for better information hierarchy
- Use ghost variant for Load More button to maintain minimal design
- Only show Load More when there's more data to load (hasNextPage)
- Include loading state feedback for better UX

### Component Integration
- Reusing existing components (QuickMessage) reduces code duplication
- Consistent menu structure across old and new components
- Proper z-index management with Portal for overlays
- Maintaining state locally for active features (calls, messages)

These lessons align with Mac OS design principles of clarity, efficiency, and consistency.

## Messaging System Integration - March 10, 2025

### Service Organization
- Keep messaging services separate and focused:
  - `twilio.js` for Twilio-specific operations
  - `messageService.js` for general message management
  - `socket.js` for real-time updates
- Each service should have a clear, single responsibility
- Document API endpoints and expected formats

### Error Handling Best Practices
- Invalid JSON errors often indicate:
  - Mismatched API expectations
  - Wrong service function being used
  - Missing or incorrect parameters
- Always validate phone numbers before sending
- Provide clear, user-friendly error messages
- Use toast notifications for feedback

### Component Integration
- Follow separation of concerns:
  - Components handle UI and user interaction
  - Services handle business logic and API calls
  - Utils handle data formatting and validation
- Keep service interfaces consistent
- Document dependencies and requirements

These improvements align with Mac OS design principles of reliability and user feedback while maintaining clean code organization.

## Icon Management and Mac OS Design Integration
### March 11, 2025

1. **Icon Import Organization**
- Keep icon imports from different libraries separate (@chakra-ui/icons vs lucide-react)
- Use consistent icon sizes (14px for actions, 6px for status)
- Import only needed icons to reduce bundle size
- Organize imports alphabetically for better maintainability

2. **Mac OS Design Principles**
- Use semantic colors for different states (success, warning, error)
- Implement subtle animations for better feedback
- Follow Mac OS spacing and alignment patterns
- Maintain consistent visual hierarchy

3. **Accessibility Best Practices**
- Always include aria-labels for IconButtons
- Ensure proper color contrast ratios
- Provide clear visual feedback for interactions
- Use semantic HTML elements with icons

4. **Error Prevention**
- Check component library documentation for correct imports
- Verify icon availability before implementation
- Test icon rendering across different themes
- Maintain consistent error handling patterns

These learnings help maintain a polished, Mac OS-like experience while ensuring code quality and accessibility.

### Campaign System Implementation Lessons - March 14, 2024

#### Architecture Decisions
1. **Component Structure**
   - **Issue**: Initial design had tightly coupled components
   - **Solution**: Separated concerns into distinct components
   - **Learning**: 
     * Keep components focused and single-purpose
     * Use proper state management
     * Implement clear component interfaces
   - **Prevention**:
     * Plan component structure before implementation
     * Review component responsibilities
     * Document component interfaces

2. **Database Schema**
   - **Issue**: Initial schema didn't support all campaign types
   - **Solution**: Implemented flexible JSONB fields for extensibility
   - **Learning**:
     * Plan for future feature additions
     * Use appropriate data types
     * Consider query performance
   - **Prevention**:
     * Document schema requirements thoroughly
     * Review schema with team
     * Test with sample data

3. **Real-time Updates**
   - **Issue**: Analytics updates were slow and inconsistent
   - **Solution**: Implemented Supabase real-time subscriptions
   - **Learning**:
     * Use appropriate real-time technology
     * Handle subscription cleanup
     * Manage subscription state
   - **Prevention**:
     * Test real-time performance
     * Implement proper error handling
     * Document subscription patterns

4. **State Management**
   - **Issue**: Complex state management across components
   - **Solution**: Centralized state in custom hooks
   - **Learning**:
     * Keep state management simple
     * Use appropriate state patterns
     * Document state flow
   - **Prevention**:
     * Plan state management strategy
     * Review state dependencies
     * Test state updates

5. **Error Handling**
   - **Issue**: Inconsistent error handling across components
   - **Solution**: Implemented standardized error handling
   - **Learning**:
     * Use consistent error patterns
     * Provide helpful error messages
     * Log errors appropriately
   - **Prevention**:
     * Document error handling patterns
     * Review error scenarios
     * Test error conditions

6. **Performance Optimization**
   - **Issue**: Slow campaign loading with large datasets
   - **Solution**: Implemented pagination and lazy loading
   - **Learning**:
     * Consider data volume
     * Use appropriate loading patterns
     * Optimize database queries
   - **Prevention**:
     * Test with large datasets
     * Monitor performance metrics
     * Document optimization strategies

7. **Security Implementation**
   - **Issue**: Initial RLS policies were too permissive
   - **Solution**: Implemented granular RLS policies
   - **Learning**:
     * Review security requirements carefully
     * Test security policies thoroughly
     * Document security patterns
   - **Prevention**:
     * Plan security strategy
     * Review security policies
     * Test security implementation

8. **UI/UX Design**
   - **Issue**: Initial UI was not intuitive
   - **Solution**: Implemented step-based workflow
   - **Learning**:
     * Focus on user experience
     * Get user feedback early
     * Iterate on design
   - **Prevention**:
     * Create UI mockups
     * Test with users
     * Document design decisions

### Best Practices Established

1. **Component Development**
   - Create focused, single-purpose components
   - Implement clear component interfaces
   - Document component responsibilities

2. **Database Design**
   - Plan for extensibility
   - Use appropriate data types
   - Consider query performance
   - Implement proper indexes

3. **State Management**
   - Keep state management simple
   - Use custom hooks for complex logic
   - Document state flow

4. **Error Handling**
   - Use consistent error patterns
   - Provide helpful error messages
   - Log errors appropriately

5. **Security**
   - Implement granular RLS policies
   - Test security thoroughly
   - Document security patterns

6. **Performance**
   - Consider data volume
   - Implement appropriate loading patterns
   - Monitor performance metrics

7. **Testing**
   - Test with real data
   - Test error conditions
   - Test security implementation
   - Test performance

8. **Documentation**
   - Document architecture decisions
   - Document component interfaces
   - Document security patterns
   - Document troubleshooting steps