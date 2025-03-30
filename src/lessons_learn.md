# Lessons Learned

## Rich Text Editor Implementation
1. **Sticky Header Considerations**
   - When implementing sticky headers in a scrollable container, the container must have:
     - A defined height (e.g., height="100%")
     - Proper overflow handling (overflow="hidden" on container, overflow="auto" on content)
     - Flex layout to maintain proper spacing
   - The sticky element needs:
     - position="sticky"
     - top={0}
     - zIndex to stay above content
     - flexShrink={0} to prevent compression
   - Parent containers must be properly configured to allow sticky positioning to work

2. **TipTap Editor Integration**
   - Use proper imports from lowlight (createLowlight, common) instead of direct import
   - Handle proper cleanup of editor instance
   - Implement auto-save with debouncing
   - Consider memory usage with large documents

3. **Component Organization**
   - Separate toolbar and content for better maintainability
   - Use composition for complex components
   - Keep state management close to where it's needed
   - Follow Mac OS design patterns for consistency

## ReactFlow Initialization
- Always initialize ReactFlow instance using the `onInit` handler
- The `reactFlowInstance` is required for core functionality like saving flows
- Missing initialization can lead to "Flow instance not initialized" errors
- ReactFlow hooks and instance methods won't work without proper initialization

## React Flow Best Practices
- Always wrap ReactFlow components with ReactFlowProvider at the highest level possible
- ReactFlowProvider must be a parent of any component using ReactFlow hooks or instance
- Missing ReactFlowProvider can cause "Flow instance not initialized" errors
- Only initialize one ReactFlow instance per provider
- Keep ReactFlow state (nodes, edges) close to where it's used

## Error Handling Best Practices
- Use try/catch blocks for async operations
- Provide specific error messages for different failure cases
- Handle both main operation and cleanup operation errors separately
- Show appropriate toast notifications with different statuses (error, warning, success)

## State Management
- Properly manage loading/saving states during async operations
- Clean up state when components unmount or data is reloaded
- Use proper dependency arrays in useEffect hooks
- Initialize state with sensible defaults

## Data Validation
- Validate IDs before performing operations
- Check array types before mapping or iterating
- Use fallback values for optional properties
- Handle workspace IDs consistently with defaults

## Component Architecture
- Keep components focused and single-purpose
- Use proper component hierarchy for state management
- Follow Mac OS design patterns for consistency
- Separate UI components from business logic

## UI/UX Improvements for Flow Builder
1. **Minimalist Interface Design**
   - Remove unnecessary input fields that might confuse users
   - Only show fields that are required for the current action
   - Maintain context without forcing users to re-enter information they've already provided

2. **Non-Intrusive Dialog Patterns**
   - Use popovers instead of full modals for simple interactions
   - Position UI elements close to the triggering action for better context
   - Implement absolute positioning when needed for precise placement
   - Use Portal component to ensure proper stacking context and z-index behavior

3. **Form Field Optimization**
   - Only ask for information that's not already available
   - Provide clear, concise labels and helpful descriptions
   - Focus on the primary task (e.g., describing changes) rather than secondary information
   - Auto-focus on the most important field to speed up user interaction

4. **User Identification Best Practices**
   - Store and display user email for accountability in collaborative features
   - Fetch user information from authentication context rather than requiring manual input
   - Display user information consistently across the application
   - Consider privacy implications when displaying user information

5. **Contextual Save Operations**
   - Provide immediate feedback on save operations
   - Collect relevant metadata (who, what, when) during save operations
   - Display version history in a clear, organized manner
   - Allow users to understand changes between versions

## Feature Request Implementation
1. **Floating UI Elements**
   - Position interactive elements strategically in the viewport for easy access
   - Use fixed positioning with proper z-index to ensure elements are always accessible
   - Implement smooth animations for opening/closing to provide visual feedback
   - Consider the element's position relative to other UI components to prevent overlap

2. **Expandable Form Patterns**
   - Use collapsible forms to save screen space while providing functionality
   - Implement clear visual indicators for expandable/collapsible elements
   - Provide immediate feedback when forms are submitted
   - Include proper form validation with helpful error messages

3. **Database Schema Design**
   - Include metadata fields (requested_by, workspace_id) for proper data attribution
   - Use appropriate field types (UUID, TEXT, INTEGER) for different data needs
   - Implement default values to simplify client-side code
   - Design with future feature expansion in mind (voting, categorization)

4. **User Feedback Celebrations**
   - Use visual effects like confetti to celebrate user accomplishments
   - Provide clear success messages after form submissions
   - Combine visual and textual feedback for better user experience
   - Keep celebrations brief and non-intrusive

5. **Component Architecture**
   - Separate button and form components for better code organization
   - Use consistent styling that matches the application's design language
   - Implement proper state management for UI interactions
   - Follow Mac OS design patterns for a familiar user experience

## Feature Request Enhancements
1. **Tabbed Interface Design**
   - Use tabs to organize related functionality within a compact space
   - Implement proper state management for tab switching
   - Ensure each tab has a clear purpose and distinct functionality
   - Follow Mac OS design principles with subtle visual indicators

2. **Real-time Updates with Supabase**
   - Use Supabase subscriptions for immediate UI updates
   - Properly clean up subscriptions in useEffect return functions
   - Handle subscription events with appropriate state updates
   - Implement optimistic UI updates for better user experience

3. **Status Tracking and Visualization**
   - Use consistent color coding for different statuses (pending, in progress, completed)
   - Implement appropriate icons to visually represent status
   - Provide clear, concise status labels
   - Organize information hierarchically with the most important details prominent

4. **Badge Notifications**
   - Use badges to indicate counts without cluttering the interface
   - Implement conditional rendering based on state (new vs. count)
   - Position badges consistently according to Mac OS design patterns
   - Use appropriate colors to indicate different states (new, active)

5. **React Hooks Rules**
   - Never call hooks inside callbacks or conditions
   - Extract values from hooks at the component level, not inside render functions
   - Properly handle hook dependencies to prevent unnecessary re-renders
   - Follow React's rules of hooks strictly to prevent subtle bugs

6. **Parent-Child Component Communication**
   - Use callback props for child-to-parent communication
   - Pass functions down to child components for state updates
   - Implement proper prop validation and default values
   - Consider using context for deeply nested component trees

## Contact Management
1. **Tag Handling in UI Components**
   - Always implement robust tag parsing to handle various data formats (JSON strings, arrays, objects)
   - Use a consistent approach to tag color assignment across the application
   - Implement fallback mechanisms for missing or malformed tag data
   - Create helper functions for tag operations that can be reused across components
   - When displaying tags, always handle potential type mismatches to prevent runtime errors

2. **Name Display Consistency**
   - Use a consistent name formatting function across all UI components
   - Implement proper fallbacks for missing name fields (first_name, last_name, name)
   - Consider internationalization aspects when formatting names
   - Maintain a clear hierarchy of fallbacks (name → first_name + last_name → phone → "Unknown")

3. **Search Implementation Best Practices**
   - Implement proper debouncing (800ms is a good starting point) to prevent excessive API calls
   - Separate immediate UI feedback from actual API requests for better perceived performance
   - Use local state for search input to provide immediate feedback
   - Add loading indicators during search operations
   - Handle both success and error states appropriately
   - Consider implementing search filters for more targeted results
   - Support multiple search patterns for the same data (especially phone numbers)
   - When searching names, consider both full name and individual components (first name, last name)
   - For phone numbers, normalize formats and search across multiple common formats
   - Implement smart splitting of search terms when appropriate (e.g., "John Doe" → firstname="John", lastname="Doe")

4. **Component Import Management**
   - Keep imports organized and comprehensive to prevent runtime errors
   - Group related imports together for better code readability
   - When using UI libraries like Chakra UI, ensure all components are properly imported
   - Consider using import/export index files for complex component hierarchies

5. **Selection State Management**
   - Implement clear selection state with proper toggle functionality
   - Use array-based selection tracking for multiple selections
   - Connect selection state to UI components with appropriate handlers
   - Handle bulk selection actions with clear visual feedback
   - Ensure selection state is properly initialized and reset when data changes

## Data Format Consistency
1. **JSON String Handling in Database Fields**
   - When storing complex data like arrays or objects in database fields, ensure consistent format (JSON strings)
   - Always implement robust parsing logic that can handle different data formats (strings, arrays, objects)
   - Use try/catch blocks when parsing JSON to prevent runtime errors
   - Implement fallback values when parsing fails to maintain UI stability

2. **Tag System Implementation**
   - Use consistent color mapping for tags based on tag content for visual recognition
   - Implement hash functions for deterministic color assignment to ensure the same tag always gets the same color
   - Handle edge cases where tags might be in different formats (strings vs objects)
   - Ensure tag parsing happens at all data entry/exit points (adding contacts, loading contacts)

3. **Error Handling for Data Processing**
   - Log specific error messages that help identify the source of the problem
   - Implement graceful fallbacks when data doesn't match expected format
   - Check data types before performing operations (e.g., `Array.isArray()` before using array methods)
   - Use defensive programming techniques like optional chaining and nullish coalescing

## Contact V2 Implementation Insights (March 10, 2025)

1. **State Management Separation**
   - Creating a dedicated state management store for new features prevents conflicts with existing code
   - Using the same patterns but separate instances allows for parallel development
   - Zustand's simple API makes it easy to create focused stores for specific features
   - Real-time subscriptions should be properly cleaned up to prevent memory leaks

2. **Real-time Data Integration**
   - Supabase real-time subscriptions require proper channel naming to avoid conflicts
   - Optimistic UI updates improve perceived performance while waiting for server responses
   - Cache invalidation strategies are crucial for keeping data fresh without excessive requests
   - Proper error boundaries and fallbacks ensure the UI remains usable even when data fetching fails

3. **Mac OS Design Principles in React**
   - Subtle visual hierarchy with proper spacing creates a clean, professional look
   - Consistent use of borders, shadows, and hover states provides intuitive feedback
   - Modal dialogs should follow OS-like patterns (title at top, actions at bottom)
   - Form validation should be immediate but non-intrusive
   - Loading states should be clearly indicated but not disruptive

4. **Component Architecture**
   - Breaking UI into focused components improves maintainability
   - Passing only necessary props prevents unnecessary re-renders
   - Consistent prop naming across similar components reduces cognitive load
   - Reusing design patterns (like modals, tables, forms) creates a cohesive experience
   - Proper state lifting ensures data consistency across components

5. **Performance Considerations**
   - Cursor-based pagination is more efficient than offset pagination for large datasets
   - Client-side caching reduces unnecessary network requests
   - Debouncing search inputs prevents excessive API calls
   - Conditionally rendering complex UI elements improves initial load time
   - Using proper React hooks dependencies prevents unnecessary effect triggers

## Contact V2 Tags Implementation Insights (March 10, 2025)

1. **Database Schema Understanding**
   - Always verify the actual database schema structure before implementing UI components
   - Field names may differ between legacy and new implementations (e.g., `phone` vs `phone_number`)
   - JSONB fields in PostgreSQL require proper parsing and error handling in the frontend
   - Schema relationships should be verified before attempting to query related tables

2. **Safe JSON Parsing**
   - Always implement defensive parsing for JSON fields coming from the database
   - Use try/catch blocks to handle malformed JSON data
   - Provide sensible defaults when JSON parsing fails
   - Validate the parsed data structure before attempting to use it (e.g., check if it's an array)

3. **Consistent Visual Representation**
   - Map data values to visual properties (like colors) in a consistent way
   - Use a combination of predefined mappings and algorithmic fallbacks for unknown values
   - Simple hash functions can generate consistent colors based on string values
   - Maintain visual consistency with existing UI patterns when displaying the same data types

4. **Error Handling Cascade**
   - Address errors at multiple levels: database query, data parsing, and UI rendering
   - Provide meaningful error messages that help identify the root cause
   - Implement graceful fallbacks at each level to prevent UI breakage
   - Log errors appropriately for debugging without exposing sensitive information

5. **Database Field Naming Conventions**
   - Be aware of naming inconsistencies across different parts of the application
   - Normalize field names when creating new components that interact with existing data
   - Document field mappings when bridging between different naming conventions
   - Consider creating utility functions for field name translation in larger applications
