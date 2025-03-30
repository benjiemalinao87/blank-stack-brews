# Lessons Learned

What you should write here: any lessons learned when you successfully fix the issue. Do not use this to log progress and roadmap. There is @progress.md for that and roadmap in @roadmap.md.

## Development Lessons Learned

### TypeScript Implementation

#### Key Differences and Benefits
1. **Type Safety**
   - `.tsx` provides compile-time type checking
   - `.js` is more flexible but prone to runtime errors
   
2. **React/JSX Support**
   - `.tsx` offers type checking for React props and components
   - `.js` can use JSX but without type safety
   
3. **Developer Experience**
   - `.tsx` provides better IDE support and autocompletion
   - Type definitions serve as built-in documentation

#### Best Practices
- Use `.tsx` for React components and type-safe code
- Use `.js` for simple scripts or when TypeScript adds unnecessary complexity
- Convert `.js` to `.tsx` when adding TypeScript to improve maintainability
- Don't mix `.js` and `.tsx` for similar components
- Ensure proper tsconfig.json setup
- Don't ignore TypeScript errors - they prevent future bugs

### TypeScript Migration Process

#### Migration Chain
1. **Dependency Order**
   - Convert files in dependency order
   - If a TypeScript file imports a JavaScript file, convert the imported file first
   - Start from leaf dependencies (files with no imports)
   - Work backwards to files that import others

2. **Component Directory Migration**
   - Keep all files in a component directory consistent
   - Convert all related components at once
   - Update imports in parent components
   - Fix type issues progressively, starting with critical components

## Bug Fixes and Solutions

### Onboarding Flow Redirect Loop (2025-02-05)

#### Problem
The application was stuck in a redirect loop between the onboarding flow and main app:
1. After completing onboarding, it would briefly show the main app
2. Then immediately redirect back to onboarding
3. This created an infinite loop, preventing users from accessing the main app

#### Root Causes
1. **Race Condition**: The redirect was happening before the onboarding completion state was properly saved
2. **State Persistence**: The onboarding completion state wasn't being persisted across page reloads
3. **Navigation Timing**: Using `window.location.href` didn't guarantee state updates were complete

#### Solution
1. **Added Local Storage Persistence**:
   ```javascript
   // In OnboardingContext
   const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
     return localStorage.getItem('onboardingComplete') === 'true';
   });
   ```

2. **Improved State Update Handling**:
   ```javascript
   // In OnboardingFlow
   await new Promise(resolve => {
     setIsOnboardingComplete(true);
     setTimeout(resolve, 1000);
   });
   localStorage.setItem('onboardingComplete', 'true');
   ```

### Contact Selection Bug Fix (2025-01-30)

#### Issue
Contact selection in the LiveChat component wasn't working due to inconsistent data passing between components.

#### Root Cause
1. Data Inconsistency:
   - Components were passing around phone numbers instead of complete contact objects
   - This created a mismatch between the selection state and the actual contact data
   - Required extra lookups to find contact details from phone numbers

#### Solution
1. Unified Data Model:
   - Changed to passing full contact objects between components
   - Eliminated need for phone number lookups
   - Made state management more straightforward

#### Key Lessons
1. State Management:
   - Keep data models consistent across component boundaries
   - Avoid using partial data (like IDs or phone numbers) when you need the full object
   - Minimize data transformations between components

2. Component Design:
   - Props should reflect the actual data needs of components
   - If a component needs multiple properties from an object, pass the whole object
   - Avoid splitting related data across multiple props

### Window Resize Bug Fix (2025-01-30)

#### Issue
Window resizing in LiveChat component was sticking/continuing even after releasing the mouse button.

#### Root Cause
1. Event Handler Scope:
   - Mouse event handlers were attached to the component's Box element
   - Events could be lost when mouse moved outside the component
   - No proper cleanup of event listeners

#### Solution
1. Window-Level Event Handling:
   - Moved mousemove and mouseup handlers to window level
   - Added proper event listener cleanup
   - Prevented text selection during resize

#### Key Lessons
1. Event Handler Management:
   - Use window-level event listeners for drag operations
   - Always clean up event listeners to prevent memory leaks
   - Prevent default behaviors that might interfere (like text selection)

### Inbound Message Display Bug Fix (2025-01-30)

#### Issue
Inbound messages were not displaying in the LiveChat UI even though they were being received by the socket connection.

#### Root Cause
1. Phone Number Format Mismatch:
   - Inbound and outbound messages had phone numbers in different formats
   - Direct string comparison failed due to variations in country code (+1 vs 1) and special characters
   - Message filtering logic was too strict, requiring exact matches

#### Solution
1. Phone Number Normalization:
   ```javascript
   // Bad: Direct string comparison
   msg.from === contact.phone
   
   // Good: Normalized comparison
   normalizePhone(msg.from) === normalizePhone(contact.phone)
   ```

### Outbound Message Bug Fix (2025-01-30)

#### Issue
Outbound text messages were failing with a "Failed to fetch" error.

#### Root Cause Analysis
1. Message State Management:
   - Messages weren't being added to UI state before confirmation from server
   - No handling of pending message states
   - Missing error state cleanup

#### Solution
1. Optimistic Updates:
   ```javascript
   // 1. Create message object immediately
   const outboundMessage = {
     status: 'pending',
     timestamp: new Date().toISOString(),
     // ... other fields
   };

   // 2. Add to UI state right away
   setMessages(prev => [...prev, outboundMessage]);

   // 3. Send to server
   const response = await fetch('https://cc.automate8.com/send-sms', ...);

   // 4. Update status on success
   setMessages(prev => prev.map(msg => 
     msg === outboundMessage 
       ? { ...msg, status: 'sent' } 
       : msg
   ));
   ```

### Default Filter State Management Fix (2025-01-30)

#### Issue
The conversation filter in the Contacts component was defaulting to "Open" instead of "All" despite having "All" set as the default value in the store.

#### Root Cause Analysis
1. State Initialization:
   - The store had `currentFilter: 'All'` set, but the initialization pattern wasn't explicit enough
   - Component-level initialization using useEffect was causing race conditions with the store's state
   - The store's state structure wasn't properly encapsulated

#### Solution
1. Store Restructuring:
   - Created an explicit `initialState` object in the store
   - Moved all initial values into this object for better clarity
   - Used object spread to ensure proper state initialization

#### Key Lessons
1. State Management Best Practices:
   - Keep state initialization explicit and centralized
   - Avoid component-level initialization for global state
   - Use a clear initialization pattern in stores

2. **Phone Number Management in Multi-Board System (2025-02-26)**

#### Problem
When implementing phone number selection for boards, we encountered several challenges:
1. Phone numbers could be accidentally assigned to multiple boards
2. No clear indication of which numbers were already in use
3. Confusing UX when selecting phone numbers
4. Potential race conditions in phone number assignment

#### Root Cause
1. **Lack of Assignment Tracking**:
   - No central tracking of which phone numbers were assigned to which boards
   - No validation to prevent duplicate assignments
   - UI didn't reflect current assignments

2. **UI/UX Issues**:
   - Phone numbers displayed without proper formatting
   - No clear indication of number availability
   - Confusing feedback when trying to use an assigned number

#### Solution
1. **Database-Level Assignment Tracking**:
   ```javascript
   // Query both phone numbers and current assignments
   const { data: boards } = await supabase
     .from('boards')
     .select('id, name, phoneNumber')
     .eq('workspace_id', currentWorkspace.id);

   // Create assignment map
   const phoneAssignments = {};
   boards.forEach(b => {
     if (b.phoneNumber && b.id !== board?.id) {
       phoneAssignments[b.phoneNumber] = {
         id: b.id,
         name: b.name
       };
     }
   });
   ```

2. **Enhanced UI Feedback**:
   - Added clear visual indicators for number availability
   - Implemented proper phone number formatting
   - Added tooltips showing current assignments
   - Disabled and grayed out already assigned numbers

3. **Validation Logic**:
   - Added checks before saving phone number assignments
   - Implemented proper error handling and user feedback
   - Prevented race conditions by checking assignments at save time

#### Lessons Learned
1. **Data Integrity**:
   - Always track resource assignments at the database level
   - Implement proper validation before allowing assignments
   - Consider race conditions in multi-user environments

2. **User Experience**:
   - Provide clear visual feedback for resource availability
   - Show helpful error messages when conflicts occur
   - Use proper formatting for phone numbers
   - Add context about why certain options are unavailable

3. **Code Organization**:
   - Separate assignment logic from UI components
   - Implement reusable formatting utilities
   - Use proper TypeScript types for better maintainability
   - Add comprehensive error handling

4. **Testing Considerations**:
   - Test concurrent assignment scenarios
   - Verify proper handling of race conditions
   - Ensure proper cleanup of assignments
   - Test UI feedback for various states

## Database and Schema Management

### CRM Schema Design (2025-02-05)

#### Issue
Needed to design a flexible CRM schema that supports contacts, pipeline stages, deals, and appointments while maintaining workspace isolation and extensibility.

#### Solution
1. **Consistent Table Structure**:
   ```sql
   -- Good: Consistent TEXT type
   workspace_id TEXT REFERENCES workspaces(id)
   
   -- Good: Flexible fields
   status TEXT DEFAULT 'active'
   custom_fields JSONB DEFAULT '{}'
   ```

### Row Level Security (RLS) Policy Debugging

#### Issue
Users were unable to access their workspace due to RLS policy errors:
```
Error loading workspace: No detected in policy for relation 'workspace_members'
```

#### Root Cause
1. RLS policies were missing explicit `TO authenticated` clause
2. Policy definitions were too restrictive
3. Circular dependency in policy checks

#### Solution
Updated RLS policies with proper access controls:
```sql
CREATE POLICY "workspace members policy"
ON public.workspace_members
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    workspace_id IN (
        SELECT workspace_id 
        FROM public.workspace_members 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);
```

## Performance Optimization

### Contact List Performance Optimization (2025-02-05)

#### Issue Description
The Contact List component was experiencing performance issues when handling large datasets (500,000+ contacts). Issues included:
- Slow initial loading
- Poor scrolling performance
- High memory usage
- Unnecessary re-renders
- Network inefficiency with large data fetches

#### Solution Implemented
1. Virtual Scrolling:
   - Implemented react-window for efficient list rendering
   - Added infinite scrolling with react-window-infinite-loader
   - Implemented auto-sizing with react-virtualized-auto-sizer
   - Added loading skeletons for better UX

2. Optimized Data Fetching:
   - Implemented cursor-based pagination
   - Added client-side caching using Map
   - Optimized database queries
   - Selected only required fields
   - Added proper indexing suggestions

3. Improved State Management:
   - Moved search/filter state to global store
   - Implemented debounced search
   - Added proper loading states
   - Optimized re-renders

#### Best Practices
1. List Implementation:
   ```javascript
   // Bad: Rendering all items
   {contacts.map(contact => (
     <ContactCard contact={contact} />
   ))}

   // Good: Using virtual list
   <VirtualizedList
     height={height}
     width={width}
     itemCount={itemCount}
     itemSize={76}
   >
     {Row}
   </VirtualizedList>
   ```

## Environment and Configuration Management

### Environment Configuration and Service Connectivity (2025-01-31)

#### Issue
Frontend service was using hardcoded URLs and environment variables weren't properly managed between development and production environments.

#### Solution
1. **Environment Variables Management**:
   ```javascript
   // Bad: Hardcoded URLs and mixed configuration
   const SOCKET_URL = 'https://cc.automate8.com';
   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://default-url.supabase.co';

   // Good: Proper environment validation and usage
   if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
     throw new Error('Missing Supabase environment variables');
   }
   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
   ```

2. **Service Configuration**:
   ```javascript
   // Bad: Hardcoded socket configuration
   const socket = io('https://cc.automate8.com', {
     autoConnect: true
   });

   // Good: Environment-based configuration
   const socket = io(process.env.REACT_APP_API_URL, {
     autoConnect: true,
     transports: ['websocket', 'polling'],
     withCredentials: true,
     reconnectionAttempts: 5,
     reconnectionDelay: 1000,
     timeout: 20000
   });
   ```

#### Key Lessons
1. **Environment Management**:
   - Always use environment variables for service URLs
   - Validate required environment variables early
   - Keep environment files out of version control
   - Use `.env.example` to document required variables

2. **Service Configuration**:
   - Configure services based on environment
   - Handle connection failures gracefully
   - Implement proper reconnection strategies
   - Log connection events for debugging 

### Supabase URL Configuration Error (2025-02-05)

#### Issue
Application crashed with error: "Invalid Supabase URL format - must start with https://"

#### Root Cause
1. Environment Configuration:
   - Supabase URL was missing the required `https://` prefix
   - Environment variables weren't properly validated at startup
   - No clear documentation of required URL format

#### Solution
1. URL Format Validation:
   ```javascript
   // Bad: No validation
   const supabase = createClient(process.env.REACT_APP_SUPABASE_URL);
   
   // Good: With validation
   if (!process.env.REACT_APP_SUPABASE_URL?.startsWith('https://')) {
     throw new Error('Invalid Supabase URL format - must start with https://');
   }
   ```

#### Key Lessons
1. Environment Validation:
   - Validate all required environment variables at startup
   - Check URL formats before creating clients
   - Provide clear error messages for configuration issues
   - Document required formats in .env.example

2. Error Prevention:
   - Add TypeScript types for environment variables
   - Use environment variable validation utilities
   - Add CI checks for environment configuration
   - Include environment setup in deployment documentation 

## Supabase URL Environment Variable Issue - 2024-02-05

### Issue
Application crashed with error: "Invalid Supabase URL format - must start with https://"

### Root Cause
The environment variables were properly configured in the `.env` file but weren't being picked up by the running React application.

### Solution
1. Verified the correct format of Supabase URL in frontend/.env:
   ```
   REACT_APP_SUPABASE_URL=https://ycwttshvizkotcwwyjpt.supabase.co
   ```
2. Restarted the React development server to load the new environment variables.

### Key Learnings
1. **Environment Variable Loading**:
   - React environment variables are loaded when the development server starts
   - Changes to `.env` file require a server restart to take effect
   - Always verify environment variables are properly formatted (e.g., URLs starting with https://)

2. **Best Practices**:
   - Always restart the development server after modifying environment variables
   - Use proper URL format with protocol (https://) for Supabase configuration
   - Validate environment variables at application startup
   - Add appropriate error messages for missing or malformed environment variables 

## Message Synchronization in Chat Applications

### Problem
Messages sent in live chat were visible in contact list preview but not in the chat area, indicating issues with message state management and synchronization.

### Solution
1. Implemented proper state management in LiveChat component:
   - Used local state for messages with useState
   - Added effects to load messages when contact changes
   - Properly handled message updates and duplicates
   - Used correct phone number field (phone_number instead of phone)

2. Improved message store integration:
   - Added message store to maintain consistent message state
   - Implemented proper message fetching based on selected contact
   - Added duplicate message checking
   - Updated both local state and store when sending messages

### Best Practices
1. Always maintain a single source of truth for messages
2. Handle both local state and global store updates
3. Check for duplicate messages when receiving updates
4. Use proper phone number field consistently across components
5. Implement proper error handling for message sending
6. Update UI state immediately for better user experience
7. Verify message synchronization between different views

### What Not To Do
1. Don't rely solely on props for message state
2. Don't update message state without checking for duplicates
3. Don't mix phone and phone_number fields
4. Don't forget to handle error cases
5. Don't update UI only after server response

## Message Duplication Prevention (2024-02-06)

### Problem
Outgoing messages were appearing multiple times in the chat due to:
1. Multiple state management locations (local state, message store, props)
2. Lack of proper message deduplication logic
3. Race conditions between optimistic updates and server responses

### Solution
1. Centralized Message Store:
   - Created a single source of truth in messageService
   - Implemented addMessageToStore function with duplicate checking
   - Used message identifiers (messageSid, timestamp, content) for deduplication

2. Improved Message Handling:
   ```javascript
   const isDuplicate = messages.some(m => 
     (m.messageSid && m.messageSid === message.messageSid) || 
     (m.timestamp === message.timestamp && 
      m.message === message.message && 
      m.from === message.from && 
      m.to === message.to)
   );
   ```

3. Optimistic Updates:
   - Added pending messages to store immediately
   - Updated message status after server response
   - Maintained message order and prevented jumps

### Best Practices
1. Message Identification:
   - Use multiple identifiers for reliable duplication detection
   - Consider both server-generated IDs and local timestamps
   - Include message content in duplicate checks

2. State Management:
   - Maintain a single source of truth
   - Handle optimistic updates properly
   - Update all related states consistently

3. Error Handling:
   - Preserve pending messages on failure
   - Provide clear error feedback
   - Allow message retry on failure

### What Not To Do
1. Don't rely on single field for duplicate detection
2. Don't update UI state before adding to message store
3. Don't forget to handle message status updates
4. Don't ignore race conditions between updates

## Message Deduplication and Display (2025-02-05)

### Problem
1. Messages were appearing duplicated in the chat UI
2. Messages were temporarily displaying on wrong side before jumping to correct position
3. Chat wasn't automatically scrolling to latest messages

### Solution
1. **Message Deduplication**:
   - Implemented multi-level deduplication strategy
   - Added checks for timestamp, content, sender, and recipient
   - Applied deduplication at message store and UI levels
   - Added proper message clearing when switching contacts

2. **Message Direction Handling**:
   - Determined message direction once at group level
   - Added multiple checks for outbound messages:
     - direction === 'outbound'
     - from === TWILIO_PHONE_NUMBER
     - type === 'outbound'
   - Prevented message "jumping" by setting correct alignment immediately

3. **Auto-scrolling Improvements**:
   - Added messageBoxRef for direct scroll control
   - Implemented reliable scrollToBottom function
   - Added scroll triggers for:
     - New messages
     - Contact changes
     - Initial load
     - Message sends

### Best Practices
1. **Message Handling**:
   - Use multiple identifiers for message uniqueness
   - Set message direction early and consistently
   - Handle all message states (pending, sent, error)
   - Update UI optimistically for better UX

2. **UI/UX**:
   - Maintain consistent message alignment
   - Ensure smooth scrolling behavior
   - Provide immediate feedback for sent messages
   - Handle edge cases (empty states, errors)

3. **State Management**:
   - Deduplicate at multiple levels
   - Clear state appropriately
   - Handle async updates properly
   - Maintain consistent data structure

### What Not To Do
1. Don't rely on single field for message uniqueness
2. Don't determine message direction multiple times
3. Don't update scroll position without proper refs
4. Don't forget to handle loading and error states 

## LiveChat Contact List Optimization (2025-02-05)

### Problem
1. Contact list performance was poor with large numbers of contacts
2. Unread messages weren't properly highlighted
3. Contact sorting didn't prioritize unread messages
4. Conversation status wasn't properly managed

### Solution
1. **Virtual Scrolling Implementation**:
   - Added react-window for efficient list rendering
   - Implemented AutoSizer for responsive sizing
   - Created memoized ContactItem component
   - Added proper item size calculation
   - Improved scroll performance for large lists

2. **Unread Message Handling**:
   - Added unread count tracking
   - Implemented blue dot indicator for unread messages
   - Added bold text styling for unread messages
   - Clear unread count when selecting contact
   - Maintain unread state until agent response or status change

3. **Contact Sorting and Filtering**:
   - Prioritize Open conversations with unread messages
   - Sort by most recent message timestamp
   - Filter by conversation status (Open, Pending, Done, etc.)
   - Default to showing Open conversations
   - Maintain proper sorting when new messages arrive

4. **Conversation Status Management**:
   - Auto-update status to Open for new inbound messages
   - Preserve Spam and Invalid status
   - Clear unread count when marking as Done
   - Update status across all components consistently

### Best Practices
1. **Performance**:
   - Use virtual scrolling for large lists
   - Implement proper component memoization
   - Optimize re-renders with proper dependencies
   - Use efficient sorting and filtering algorithms

2. **User Experience**:
   - Clear visual indicators for unread messages
   - Consistent status management
   - Immediate UI updates for better feedback
   - Proper error handling and loading states

3. **Code Organization**:
   - Separate contact item into its own component
   - Use proper prop types and memoization
   - Maintain single source of truth for contact state
   - Follow consistent naming conventions

### What Not To Do
1. Don't render all contacts at once without virtualization
2. Don't update unread count for currently viewed contact
3. Don't change Spam/Invalid status automatically
4. Don't sort/filter on every render
5. Don't clear unread status without user action
6. Don't mix conversation status management across components 

## Production Message Duplication Issue

### Problem
Messages are being duplicated when sent from production (cc1.automate8.com) but work correctly on localhost. This indicates an environment-specific issue with message handling and Socket.IO events.

### Root Cause Analysis
1. In production, messages are being processed twice:
   - Once from the direct API response
   - Once from the Socket.IO event
2. Local development doesn't show this because of different Socket.IO connection settings

### Solution
1. Implement message deduplication using unique IDs:
   ```javascript
   // Generate a unique ID for the message
   const messageId = `${timestamp}-${message}-${from}-${to}`;
   
   // Check if we've already processed this message
   if (processedMessageIds.has(messageId)) {
     return;
   }
   
   // Add to processed set
   processedMessageIds.add(messageId);
   ```

2. Ensure consistent message handling across environments:
   - Use message IDs for deduplication
   - Track processed messages
   - Clear message tracking cache periodically
   - Handle both API and Socket.IO events properly

### Best Practices
1. Always implement message deduplication in real-time systems
2. Use unique identifiers for each message
3. Clear message tracking cache periodically
4. Test message flows in all environments
5. Monitor message queues for duplicates

### What Not To Do
1. Don't assume production behaves like development
2. Don't skip message deduplication logic
3. Don't let message tracking grow unbounded
4. Don't ignore environment-specific behaviors 

## Message Duplication Fix

### Problem Description
Messages were being duplicated in production (cc1.automate8.com) but not in localhost due to:
1. Messages being processed twice - once from API response and once from socket event
2. Race conditions in message processing
3. Inefficient duplicate detection
4. Environment-specific socket connection differences

### Solution Implemented
1. Robust Message Deduplication:
   - Message queue for handling concurrent processing
   - Consistent message ID generation
   - Async message processing with proper error handling
   - Periodic cleanup of old processed IDs

2. Improved UI Message Handling:
   - Unique temporary IDs for optimistic updates
   - Set-based duplicate detection
   - Timestamp-based near-simultaneous message detection
   - Better cleanup of temporary messages

3. Environment Consistency:
   - Using environment variables for all URLs
   - Consistent socket connection settings
   - Proper handling of both API and socket events

### Best Practices
1. Always implement message queuing for concurrent operations
2. Use unique message IDs that include all relevant data
3. Handle both optimistic updates and server responses
4. Clean up old data periodically
5. Test with production-like conditions
6. Use environment variables for configuration

### What Not To Do
1. Don't rely on simple timestamp comparison for deduplication
2. Don't ignore race conditions in message processing
3. Don't assume socket behavior is the same across environments
4. Don't keep message IDs indefinitely
5. Don't mix different URL sources (hardcoded vs env vars)

### Testing Steps
1. Send multiple messages rapidly to test concurrent handling
2. Check both sent and received messages for duplicates
3. Verify message order is maintained
4. Test reconnection scenarios
5. Monitor memory usage for message ID storage

### Verification
- No duplicate messages in the UI
- Correct message order
- Proper optimistic updates
- Clean error handling
- Memory usage stays stable 

## Message Persistence and AI Integration

#### Issue
Needed to implement robust message persistence with AI-ready features while maintaining real-time sync and optimistic updates.

#### Root Cause Analysis
1. Messages needed to be stored with proper relationships to contacts and workspaces
2. Real-time updates required careful state management
3. AI features needed proper data structures (embeddings, sentiment)
4. Message types needed automatic detection
5. Performance considerations for large message histories

#### Solution
1. **Database Schema Design**
```sql
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'email', 'link', 'video', 'image', 'calendar', 'phone')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    sentiment FLOAT,
    embedding vector(1536),
    twilio_sid TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

2. **State Management**
- Used Zustand for client-side state management
- Implemented optimistic updates for better UX
- Added proper error handling and rollback
- Used cursor-based pagination for performance

3. **Real-time Updates**
- Supabase real-time subscriptions for instant updates
- Proper message deduplication
- Optimistic UI updates with fallback

4. **AI Integration**
- Vector embeddings for semantic search
- Sentiment analysis field
- Automatic message type detection
- Rich metadata storage

#### Best Practices
1. **Message State Management**
- Always use optimistic updates for better UX
- Implement proper error handling and rollback
- Use cursor-based pagination for large message histories
- Cache messages for better performance

2. **Real-time Sync**
- Subscribe to changes at the workspace level
- Handle all CRUD operations in real-time
- Implement proper message ordering
- Handle offline/online scenarios

3. **AI Features**
- Use triggers for automatic embedding updates
- Implement background jobs for AI processing
- Store AI results in dedicated fields
- Use proper vector indexing

4. **Performance**
- Index frequently queried fields
- Use cursor-based pagination
- Implement message caching
- Use proper RLS policies

#### Pitfalls to Avoid
1. Don't rely on client-side timestamps for ordering
2. Don't store large binary data in messages table
3. Don't process AI features synchronously
4. Don't fetch all messages at once
5. Don't use offset-based pagination for large datasets

#### Key Learnings
1. Proper message persistence requires careful consideration of:
   - Real-time sync
   - State management
   - Performance
   - AI integration
   - Error handling

2. AI features should be:
   - Processed asynchronously
   - Stored efficiently
   - Indexed properly
   - Updated automatically

3. Performance considerations:
   - Use proper indexes
   - Implement caching
   - Use cursor-based pagination
   - Handle large datasets efficiently

## LiveChat Message Flow Optimization (2025-02-10)

### Issue
The LiveChat application had several issues with message handling:
1. Outbound messages were being duplicated in the UI
2. Socket connections weren't properly established
3. Message state management needed optimization

### Root Cause Analysis
1. **Duplicate Message Rendering**
   - Multiple socket emissions in backend (`io.emit` and `io.to(room).emit`)
   - Insufficient duplicate detection in frontend message store
   - Race conditions between optimistic updates and real messages

2. **Socket Connection**
   - WebSocket connection needed to be secure in production
   - Socket transport needed to be consistent
   - Phone number registration with socket server needed proper timing

### Solution Implementation

#### Backend Changes (`backend/index.js`)
1. Consolidated socket emissions:
   ```javascript
   // Single, targeted emission to specific room
   io.to(normalizedTo).emit('new_message', messageToSend);
   ```

2. Improved message data structure:
   ```javascript
   const messageToSend = {
     id: messageResponse.sid,
     twilio_sid: messageResponse.sid,
     direction: 'outbound',
     content: messageResponse.body,
     created_at: new Date().toISOString(),
     contact_id: contactId,
     status: messageResponse.status,
     clientId
   };
   ```

#### Frontend Changes

1. **Socket Configuration** (`frontend/src/socket.js`)
   - Updated to use secure WebSocket in production
   - Removed polling transport
   - Added connection status tracking

2. **Message Store** (`frontend/src/services/messageStore.js`)
   - Enhanced duplicate detection using multiple criteria:
     ```javascript
     const messageExists = messages.some(m => 
       m.id === messageData.id || 
       (m.twilio_sid && m.twilio_sid === messageData.twilio_sid) ||
       (messageData.direction === m.direction && 
        messageData.content === m.content && 
        m.from === messageData.from && 
        m.to === messageData.to &&
        Math.abs(new Date(m.timestamp) - new Date(messageData.timestamp)) < 2000
     );
     ```
   - Improved optimistic update handling:
     - Added unique clientId for tracking optimistic messages
     - Updated existing messages instead of adding duplicates
     - Maintained message ordering with proper timestamps

3. **API Service** (`frontend/src/services/api.ts`)
   - Ensured socket connection before sending messages
   - Added better error handling
   - Improved message status tracking

### Key Learnings

1. **Socket.IO Best Practices**
   - Use rooms for targeted message delivery
   - Avoid multiple emissions of the same event
   - Ensure proper socket connection before sending messages
   - Handle connection status and reconnection gracefully

2. **Message Deduplication Strategy**
   - Use multiple identifiers (ID, Twilio SID, content + timestamp)
   - Consider message direction when checking duplicates
   - Allow small timestamp differences (5 seconds) for practical matching
   - Update existing messages instead of adding new ones

3. **State Management**
   - Use optimistic updates for better UX
   - Track message status properly
   - Maintain consistent message ordering
   - Clean up and normalize message data

4. **Error Handling**
   - Verify environment variables (TWILIO_PHONE_NUMBER)
   - Add comprehensive error logging
   - Handle socket connection issues gracefully
   - Provide clear error feedback to users

### Connected Components
The message flow involves several interconnected components:

1. **Frontend**
   - `socket.js`: WebSocket connection management
   - `messageStore.js`: Message state and real-time updates
   - `api.ts`: HTTP API and message sending
   - LiveChat component: UI rendering and user interaction

2. **Backend**
   - `index.js`: Socket.IO server and Twilio integration
   - Twilio webhook: Handling inbound messages
   - Socket rooms: Message routing and delivery

3. **External Services**
   - Twilio: SMS messaging
   - Socket.IO: Real-time communication
   - Supabase: Data persistence

This solution demonstrates the importance of coordinating multiple services and components while maintaining clean, reliable message handling.

## Twilio Message Configuration (2025-02-10)

### Issue
Outbound messages were failing with the error: "The 'StatusCallback' URL undefined/status is not a valid URL"

### Root Cause Analysis
1. The `statusCallback` parameter was included in the Twilio message creation options
2. The `TWILIO_WEBHOOK` environment variable was not set in the Railway deployment
3. This caused Twilio to reject the message creation request with a 400 error

### Solution
1. Removed the optional `statusCallback` parameter from message creation:
   ```javascript
   const messageResponse = await client.messages.create({
     body: content,
     to: to,
     from: process.env.TWILIO_PHONE_NUMBER
   });
   ```

### Key Learnings
1. **Optional Parameters**
   - Only include optional Twilio parameters when they are properly configured
   - Status callbacks are useful for tracking message delivery but not required
   - Always verify environment variables before using them in API calls

2. **Error Handling**
   - Twilio provides specific error codes (21609 in this case) for better debugging
   - Check the Twilio error documentation for detailed explanations
   - Log the complete error object for better troubleshooting

3. **Environment Variables**
   - Document all required environment variables
   - Verify environment variables in both development and production
   - Consider making non-critical features optional based on environment variables

### Best Practices
1. Start with minimal required configuration
2. Add optional features only after basic functionality works
3. Document all environment variables and their purposes
4. Implement proper error handling for missing configurations
5. Use Twilio's test credentials in development

## Window State Management and Independent Windows

### Problem
1. Search states were interfering between LiveChat and Contacts windows
2. Window states were not preserved when switching between windows
3. LiveChat window was opening in wrong position (centered) instead of consistent with other windows
4. Opening LiveChat was causing Contacts window to refresh

### Root Cause Analysis
1. Both components were sharing the same global store state
2. No window-specific state management
3. Inconsistent window positioning logic
4. Component state wasn't properly isolated

### Solution
1. Created WindowContext for window-specific state management:
   ```javascript
   const WindowContext = createContext();
   const [windowStates, setWindowStates] = useState(new Map());
   ```

2. Implemented independent search states:
   - Each window maintains its own search state
   - Search state persists when switching windows
   - No interference between windows

3. Fixed window positioning:
   - Consistent initial position (50px, 50px)
   - Removed centered positioning
   - Added proper bounds
   - Matched macOS-style window behavior

4. Enhanced search functionality:
   - Local state management for searches
   - Improved filtering logic
   - Better performance with useMemo
   - Multiple field search (name, phone, email, source)

### Best Practices
1. Use React Context for window-specific state
2. Maintain independent state for each window
3. Consistent window positioning across the application
4. Implement proper cleanup and state preservation
5. Use memoization for expensive filtering operations

### What Not To Do
1. Don't share global state for window-specific features
2. Don't use fixed positioning that breaks draggable functionality
3. Don't reset window state unnecessarily
4. Don't implement search without proper memoization
5. Don't mix window-specific and global states

### Key Learnings
1. Window independence is crucial for UX
2. State isolation prevents unexpected interactions
3. Consistent positioning improves usability
4. Proper state management improves performance
5. Context API is powerful for window-specific state 

## Message Persistence in LiveChat

### Problem
Messages were disappearing from the LiveChat UI when:
1. User sent outbound messages
2. Messages appeared to send successfully (received on device)
3. But disappeared from the chat interface
4. Only inbound messages remained visible

### Root Cause Analysis
1. Local message state wasn't properly preserving existing messages when updating
2. Optimistic updates were being overwritten by server responses
3. Message deduplication was too aggressive
4. Local state and server state weren't properly synchronized

### Solution
1. Implemented robust message state preservation:
   ```javascript
   setLocalMessages(prev => {
     // Preserve existing messages while adding new ones
     const allMessages = [...prev, ...messages];
     
     // Enhanced deduplication with multiple criteria
     return allMessages.reduce((acc, message) => {
       const isDuplicate = acc.some(m => (
         m.message === message.message &&
         m.direction === message.direction &&
         m.from === message.from &&
         m.to === message.to &&
         Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 2000
       ));
       
       if (!isDuplicate) {
         acc.push(message);
       }
       return acc;
     }, []);
   });
   ```

2. Improved optimistic updates:
   ```javascript
   // Create optimistic message
   const optimisticMessage = {
     message: messageToSend,
     to: selectedContact.phone_number,
     from: process.env.REACT_APP_TWILIO_PHONE_NUMBER,
     direction: 'outbound',
     type: 'outbound',
     timestamp: new Date().toISOString(),
     status: 'pending',
     tempId: `temp-${Date.now()}-${Math.random()}`
   };

   // Add to local state while preserving existing messages
   setLocalMessages(prev => [...prev, optimisticMessage]);
   ```

3. Enhanced error handling:
   ```javascript
   try {
     const response = await onSendMessage(messageToSend);
     setLocalMessages(prev => prev.map(msg => 
       msg.tempId === optimisticMessage.tempId ? { ...response, tempId: msg.tempId } : msg
     ));
   } catch (error) {
     // Remove failed optimistic message while preserving others
     setLocalMessages(prev => prev.filter(msg => msg.tempId !== optimisticMessage.tempId));
     setNewMessage(messageToSend); // Restore message in input
   }
   ```

### Best Practices
1. Always preserve existing messages when updating state
2. Use optimistic updates with proper rollback
3. Implement comprehensive deduplication logic
4. Handle errors without losing message history
5. Maintain message order and consistency
6. Use temporary IDs for optimistic updates
7. Implement proper state synchronization

### What Not To Do
1. Don't replace entire message state on updates
2. Don't rely on server response alone for UI updates
3. Don't use simple equality checks for deduplication
4. Don't lose optimistic updates on success
5. Don't forget to handle error cases
6. Don't mix message sources without proper merging

### Key Learnings
1. Message persistence requires careful state management
2. Optimistic updates improve perceived performance
3. Proper error handling maintains consistency
4. Multiple criteria needed for reliable deduplication
5. State updates should be additive not replacive 

## Message Persistence in LiveChat - Latest Update

### Problem
Outbound messages were disappearing from the UI after being sent, despite being successfully delivered. Specifically:
1. Messages were visible momentarily when sent
2. Successfully delivered to recipient's device
3. Disappeared from the chat interface after sending
4. Only inbound messages remained visible

### Root Cause Analysis
1. Local message state wasn't properly preserving existing messages
2. Optimistic updates were being overwritten by server responses
3. Message deduplication was too aggressive
4. Local state and server state weren't properly synchronized

### Solution
1. Implemented robust message state preservation:
   ```javascript
   setLocalMessages(prev => {
     // Preserve existing messages while adding new ones
     const allMessages = [...prev, ...messages];
     
     // Enhanced deduplication with multiple criteria
     return allMessages.reduce((acc, message) => {
       const isDuplicate = acc.some(m => (
         m.message === message.message &&
         m.direction === message.direction &&
         m.from === message.from &&
         m.to === message.to &&
         Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 2000
       ));
       
       if (!isDuplicate) {
         acc.push(message);
       }
       return acc;
     }, []);
   });
   ```

2. Improved optimistic updates:
   ```javascript
   // Create optimistic message
   const optimisticMessage = {
     message: messageToSend,
     to: selectedContact.phone_number,
     from: process.env.REACT_APP_TWILIO_PHONE_NUMBER,
     direction: 'outbound',
     type: 'outbound',
     timestamp: new Date().toISOString(),
     status: 'pending',
     tempId: `temp-${Date.now()}-${Math.random()}`
   };

   // Add to local state while preserving existing messages
   setLocalMessages(prev => [...prev, optimisticMessage]);
   ```

3. Enhanced error handling:
   ```javascript
   try {
     const response = await onSendMessage(messageToSend);
     setLocalMessages(prev => prev.map(msg => 
       msg.tempId === optimisticMessage.tempId ? { ...response, tempId: msg.tempId } : msg
     ));
   } catch (error) {
     // Remove failed optimistic message while preserving others
     setLocalMessages(prev => prev.filter(msg => msg.tempId !== optimisticMessage.tempId));
     setNewMessage(messageToSend); // Restore message in input
   }
   ```

### Best Practices
1. Always preserve existing messages when updating state
2. Use optimistic updates with proper rollback
3. Implement comprehensive deduplication logic
4. Handle errors without losing message history
5. Maintain message order and consistency
6. Use temporary IDs for optimistic updates
7. Implement proper state synchronization

### What Not To Do
1. Don't replace entire message state on updates
2. Don't rely on server response alone for UI updates
3. Don't use simple equality checks for deduplication
4. Don't lose optimistic updates on success
5. Don't forget to handle error cases
6. Don't mix message sources without proper merging

### Key Learnings
1. Message persistence requires careful state management
2. Optimistic updates improve perceived performance
3. Proper error handling maintains consistency
4. Multiple criteria needed for reliable deduplication
5. State updates should be additive not replacive 

## Message Status Constraint Fix (2025-02-18)

#### Issue
Inbound messages were failing to save due to a database constraint violation on the `status` field.

#### Root Cause
1. The `messages` table has a CHECK constraint that only allows these status values:
   - 'pending'
   - 'delivered' 
   - 'failed'
2. The Twilio webhook handler was trying to use 'received' which is not an allowed value

#### Solution
1. Updated the Twilio webhook handler to use 'delivered' status for inbound messages
2. This aligns with our message status model where:
   - Outbound messages: pending -> delivered/failed
   - Inbound messages: always delivered (since we only receive them after successful delivery)

#### Key Lessons
1. Always check database constraints when getting unexpected database errors
2. Keep status values consistent across the application
3. Document allowed status values in both schema and application code
4. Consider adding TypeScript enums or constants for status values to prevent typos

## Socket Room Management and Contact Validation

### Problem
Socket room management and contact validation were causing issues with message delivery and chat functionality.

### Solution
1. Implemented robust socket room management:
   - Used a Map to track active socket rooms
   - Cleaned up rooms when sockets disconnect
   - Ensured clients leave previous rooms before joining new ones
   - Used consistent room naming conventions

2. Improved contact validation:
   - Validated contact existence with full context (id, phone, workspace)
   - Verified phone number consistency between stored and received
   - Handled contact lookup errors explicitly
   - Included workspace context in all operations

### Key Lessons
1. **Socket Room Management**
   - Use a Map to track active socket rooms
   - Clean up rooms when sockets disconnect
   - Ensure clients leave previous rooms before joining new ones
   - Use consistent room naming conventions

2. **Contact Validation**
   - Validate contact existence with full context (id, phone, workspace)
   - Verify phone number consistency between stored and received
   - Handle contact lookup errors explicitly
   - Include workspace context in all operations

3. **Socket Event Handling**
   - Use socket.once() for one-time events like join confirmations
   - Implement timeouts for async operations
   - Clean up event listeners to prevent memory leaks
   - Add detailed error logging for debugging

4. **Message Flow**
   - Validate contact before joining room
   - Ensure room is joined before sending messages
   - Handle optimistic updates properly
   - Clean up temporary messages on errors

These improvements make the messaging system more reliable and maintainable.

## Inbound and Outbound Message Flow

### Problem
Messages were not being properly delivered in both directions:
1. Outbound messages were failing with "Contact not found" errors
2. Inbound messages were not being saved with correct status
3. Real-time updates were inconsistent

### Solution

#### 1. Outbound Message Flow
- Fixed contact lookup in socket handlers:
  ```javascript
  // Verify contact exists and belongs to workspace
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, phone_number, workspace_id')
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)
    .single();
  ```
- Added proper socket room management
- Implemented better error handling and validation
- Added message acknowledgment with timeouts

#### 2. Inbound Message Flow (Twilio Webhook)
- Changed message status from 'received' to 'delivered':
  ```javascript
  // Save inbound message
  const { data: message, error } = await supabase
    .from('messages')
    .insert([{
      contact_id: contactId,
      workspace_id: workspaceId,
      direction: 'inbound',
      content,
      message_type: 'text',
      status: 'delivered',  // Changed from 'received'
      twilio_sid: twilioSid
    }])
  ```
- Fixed phone number normalization
- Added proper error handling for Twilio webhooks
- Improved real-time broadcasting to correct rooms

### Key Lessons

1. **Message Status Management**
   - Use consistent status values ('delivered' for both inbound/outbound)
   - Validate status transitions
   - Handle edge cases (failed deliveries, retries)

2. **Phone Number Handling**
   - Normalize phone numbers before any database operations
   - Use E.164 format consistently
   - Validate phone numbers at both ends

3. **Real-time Updates**
   - Use socket rooms for targeted message delivery
   - Clean up socket connections and rooms
   - Handle reconnection scenarios
   - Implement proper error recovery

4. **Database Operations**
   - Use transactions for related operations
   - Include proper foreign key constraints
   - Handle race conditions in message processing

5. **Error Handling**
   - Log detailed error information
   - Implement proper fallbacks
   - Clean up resources on failure
   - Provide meaningful error messages to users

These improvements ensure reliable message delivery in both directions while maintaining data consistency.

## Handling Message Duplication in Real-Time Chat

**Date**: February 18, 2025
**Issue**: Messages appearing twice in the chat UI when sending outbound messages, but displaying correctly after refresh.

**Root Cause**:
The duplication was happening due to the interaction between optimistic updates and real-time socket events:
1. When sending a message, we created a temporary message for optimistic UI update
2. When the server confirmed the message, we received both a `message_sent` event and a `new_message` event
3. Our duplicate detection wasn't properly handling the relationship between temp and confirmed messages

**Solution**:
1. Improved duplicate detection:
   ```javascript
   const isDuplicate = messages.some(m => 
     m.id === messageData.id || 
     (m.id.startsWith('temp-') && messageData.tempId === m.id) ||
     // Time-based deduplication for similar messages
     (messageData.direction === m.direction && 
      messageData.content === m.content && 
      Math.abs(new Date(m.created_at) - new Date(messageData.created_at)) < 2000)
   );
   ```

2. Better socket event handling:
   - Only process `new_message` events for inbound messages or messages without tempId
   - Added explicit handling of `message_sent` event to replace temp messages
   - Proper cleanup of all socket listeners when switching contacts

**Key Learnings**:
1. When implementing real-time features with optimistic updates:
   - Track the relationship between temporary and confirmed states
   - Handle all possible event combinations (success, error, duplicate)
   - Clean up event listeners to prevent memory leaks

2. Message deduplication strategies:
   - Use unique identifiers (tempId, messageId)
   - Consider time-based similarity for backup
   - Handle both optimistic and confirmed states

3. Socket event management:
   - Be explicit about which events handle what type of messages
   - Clean up listeners when components unmount or context changes
   - Use `removeAllListeners` before setting up new ones

This pattern can be applied to other real-time features where you need to handle optimistic updates while maintaining consistency with server state.

## Dynamic Twilio Webhook Configuration Issue

**Date**: [Current Date]

## Problem

We encountered an issue with dynamic Twilio webhook configuration where:
1. Outbound text messages from LiveChat UI were not being sent
2. Inbound text messages were not being received

## Root Cause

The root cause was identified as a discrepancy between the actual Twilio configuration and the database state:
- Twilio was properly configured with the correct webhook URL (visible in Twilio dashboard)
- But the database (`workspace_twilio_config` table) had `is_configured: false` and `webhook_url: null`
- This caused the application to behave as if Twilio wasn't configured properly

## Solution

We implemented a comprehensive fix:

1. Updated the `/twilio/configure-webhook` endpoint to also set `is_configured: true` and store the `webhook_url`
2. Added a new `/twilio/verify-webhook` endpoint that checks Twilio's actual configuration and updates the database
3. Enhanced the test-connection endpoint to also check and sync webhook configuration
4. Updated the frontend to properly verify and handle webhook states

## Testing

The fix was verified with a step-by-step testing process:
1. Database synchronization tests
2. Webhook configuration tests with both global and workspace-specific webhooks
3. Outbound message tests
4. Inbound message tests
5. End-to-end verification

## Lessons Learned

1. **State Synchronization**: Always ensure that any external service configuration is properly reflected in your database state. Having mismatched states can lead to confusing bugs.

2. **Complete Updates**: When updating external services via an API, make sure to update all relevant database fields to maintain a consistent state.

3. **Verification Endpoints**: Create endpoints specifically for verifying and syncing configuration with external services. This makes troubleshooting much easier.

4. **Testing Plan**: For integrations with external services, create a comprehensive testing plan that covers all flows (outbound and inbound).

5. **Status Verification**: Don't just check if an API call returns success, verify that the desired state was actually achieved.

## Future Improvements

1. Add regular webhook verification jobs to ensure the database state always matches the actual Twilio configuration
2. Implement better error handling for webhook configuration failures
3. Add more detailed logging for Twilio API interactions
4. Create a webhook testing tool in the admin interface

## Database Schema and API Endpoint Alignment

### Schema Mismatch in Message Handling
1. **Issue Identified**
   - The `/send-sms` endpoint was attempting to save messages with incorrect field names (`from_number`, `to_number`, `body`)
   - The database schema actually uses `content` for message text, requires a `contact_id`, and has specific fields like `message_type` and `status`
   - This mismatch caused messages to be sent via Twilio but not saved in the database

2. **Root Cause**
   - Multiple endpoints with different expectations about the database schema
   - Lack of consistent data model across the application
   - Missing contact handling in some endpoints

3. **Solution Implemented**
   - Updated the `/send-sms` endpoint to match the current database schema
   - Added contact lookup/creation logic to ensure messages are associated with contacts
   - Ensured consistent field naming (`content` instead of `body`)
   - Added proper metadata to store sender/recipient information

4. **Lessons**
   - Always ensure API endpoints align with the current database schema
   - When multiple endpoints handle similar functionality, maintain consistency in data models
   - Include proper error handling for database operations
   - Document schema changes and ensure all parts of the application are updated accordingly

## Database Schema and API Endpoint Alignment - Part 2

### Schema Mismatch Troubleshooting
1. **Issue Identified**
   - The `/send-sms` endpoint was attempting to save messages with incorrect field names
   - The database schema uses `body` for message text, not `content`
   - The error message "Could not find the 'from_number' column of 'messages' in the schema cache" suggests a schema cache issue

2. **Troubleshooting Steps**
   - Updated all references from `content` to `body` in the codebase
   - Updated contact field references from `phone` to `phone_number`
   - Modified Supabase client initialization to include schema settings
   - Tried using direct SQL queries instead of the ORM
   - Created a test endpoint with minimal fields

3. **Lessons Learned**
   - Schema cache issues can be difficult to diagnose
   - Always verify database schema before implementing endpoints
   - Consider using database migrations to keep schema in sync
   - When encountering schema cache issues:
     - Try restarting the server
     - Check if schema changes have been deployed
     - Consider using raw SQL queries as a workaround
     - Verify that all field names match exactly

4. **Next Steps**
   - Verify that code changes are properly deployed
   - Consider implementing a database schema validation tool
   - Add more comprehensive error handling for database operations
   - Create a database schema documentation file to reference

### Chat Popup Real-Time Message Handling - Key Learnings

### Problem
The Chat Popup component had two main issues:
1. Inbound messages weren't showing in real-time without refresh
2. Outbound messages weren't being delivered to the recipient's phone

### Solution Architecture
The solution involved aligning the Chat Popup with LiveChat's proven implementation:

1. **Real-Time Message Reception (Inbound)**
   - Implemented dual subscription system:
     - Supabase real-time subscriptions for database changes
     - Socket.IO for immediate message delivery
   - Created unique channel names to prevent conflicts
   - Added proper message deduplication
   - Enhanced cleanup of subscriptions and listeners

2. **Message Sending (Outbound)**
   - Switched from direct API calls to using messageStore
   - Leveraged the same message sending pipeline as LiveChat
   - Proper handling of Twilio phone number configuration
   - Consistent API endpoint usage across components

### Key Files Involved
1. `frontend/src/components/chat/ChatPopUp.js`
   - Added dual real-time subscriptions
   - Implemented proper message state management
   - Enhanced subscription cleanup

2. `frontend/src/components/chat/components/InputArea.js`
   - Integrated with messageStore for sending messages
   - Removed direct API calls
   - Improved error handling

3. `frontend/src/services/messageStore.js`
   - Central service for message handling
   - Manages both Supabase and Twilio interactions
   - Handles message deduplication and state

4. `frontend/src/socket.js`
   - Provides Socket.IO configuration
   - Manages real-time connections

### Critical Lessons
1. **Centralized Message Handling**
   - Use a single source of truth for message operations
   - Avoid duplicate implementations across components
   - Share proven code paths between similar features

2. **Real-Time Updates**
   - Multiple subscription methods provide better reliability
   - Need proper cleanup to prevent memory leaks
   - Message deduplication is crucial with multiple sources

3. **API Integration**
   - Consistent endpoint usage across components
   - Proper phone number formatting for Twilio
   - Centralized error handling

4. **State Management**
   - Use optimistic updates for better UX
   - Maintain consistent message format
   - Handle both success and error cases

5. **Code Organization**
   - Reuse existing services when possible
   - Keep message handling logic centralized
   - Follow established patterns in the codebase

### Future Considerations
1. Consider extracting common message handling logic into a shared hook
2. Add retry logic for failed message sends
3. Implement better error feedback in the UI
4. Add message delivery status indicators

# Lessons Learned: Webhook Implementation

## Database Constraint Issues

### Problem
The webhook system was failing with a database constraint error:
```
Failed to create log entry: code: '23514', details: 'Failing row contains (...), message: 'new row for relation "webhook_logs" violates check constraint "valid_status"'
```

### Solution
- Added validation to ensure the `status` field only contains allowed values ('success', 'error')
- Changed the initial status from 'processing' to 'error' when creating log entries
- Added proper error handling around database operations

### Prevention
- Always check database constraints before inserting/updating records
- Use enums or predefined constants for status fields
- Implement proper validation before database operations

## Undefined Property Access

### Problem
The webhook system was failing with errors like:
```
TypeError: Cannot read properties of undefined (reading 'id')
```

### Solution
- Used optional chaining (`?.`) when accessing potentially undefined properties
- Added explicit null checks before accessing properties
- Added proper error handling around property access
- Added validation for required parameters

### Prevention
- Always check if objects exist before accessing their properties
- Use optional chaining (`?.`) for safer property access
- Implement proper input validation
- Add defensive programming techniques to handle edge cases

## API Authentication Issues

### Problem
The webhook API endpoints were failing due to authentication issues, as the workspace ID and user information were not being properly extracted from the request.

### Solution
- Added support for workspace ID from both the request object and headers
- Added explicit checks for required parameters
- Added proper error handling for authentication failures

### Prevention
- Implement consistent authentication mechanisms across all endpoints
- Add proper validation for authentication tokens and headers
- Use middleware for authentication to avoid duplication

## Field Mapping Issues

### Problem
The webhook system was failing to process field mappings correctly, resulting in "Missing required fields" errors even when the fields were present in the payload.

### Findings
- The field mappings were empty (`{}`) in the database
- The webhook was expecting specific field names ('firstname', 'lastname', 'phone_number') but the payload had different field names or nested structures
- The field mappings update endpoint was failing with "Failed to update field mappings"
- The webhook was not properly mapping the fields from the payload to the expected field names

### Solution
- Added fallback mappings when no field mappings are defined in the database
- Added support for common field name variations (e.g., `phone` vs `phone_number`, `first_name` vs `firstname`)
- Added support for nested fields in common structures (e.g., `contact.firstname`, `data.firstname`)
- Added support for fields in arrays (e.g., `contacts[0].firstname`)
- Added better logging to help diagnose issues

### Prevention
- Implement fallback mechanisms for missing or empty field mappings
- Support common field name variations and nested structures
- Add comprehensive logging for debugging
- Validate field mappings before using them
- Provide clear error messages when field mappings are missing or invalid

## Database Schema Issues

### Problem
The webhook was failing with errors like:
```
Failed to create/update contact: Could not find the 'company' column of 'contacts' in the schema cache
```

### Solution
- Identified the fields that actually exist in the contacts table
- Modified the webhook to only use fields that exist in the contacts table
- Added error handling for non-existent fields

### Prevention
- Verify the database schema before implementing features
- Document the database schema and required fields
- Add validation for field names before using them
- Provide clear error messages when fields don't exist in the database

## Testing Improvements

### Problem
The testing script was not properly configured to test the webhook system with the correct authentication and payload structure.

### Solution
- Updated the testing script to use the correct authentication headers
- Added tests for different payload formats (direct fields, nested fields, arrays)
- Improved error handling and reporting in the testing script
- Added more comprehensive test cases

### Prevention
- Create comprehensive test suites for all API endpoints
- Test with various payload structures and edge cases
- Implement proper error handling in test scripts
- Document expected behavior and test cases

## General Best Practices

1. **Error Handling**: Implement proper error handling at all levels of the application
2. **Validation**: Validate all inputs before processing
3. **Defensive Programming**: Always check for null/undefined values
4. **Logging**: Implement comprehensive logging for debugging
5. **Testing**: Create thorough test cases for all functionality
6. **Documentation**: Document expected behavior, constraints, and error cases
7. **Fallbacks**: Implement fallback mechanisms for missing or invalid configurations
8. **Schema Validation**: Verify database schema before using fields

## ESLint Error: Undefined Variable

**Problem:**
- ESLint reported an error in `FieldMapping.js` where `defaultSamplePayload` was being used but not defined.
- The code was referencing this variable when setting the sample payload state, but the variable was never declared.

**Solution:**
- Added a `defaultSamplePayload` constant at the top of the file with a sample JSON structure.
- This provides a fallback when no sample payload is available from the webhook metadata.

**Lesson:**
- Always define variables before using them, especially when they serve as fallbacks.
- ESLint is valuable for catching undefined variables and other potential issues before they cause runtime errors.
- When implementing features that use fallback values, make sure those fallback values are properly defined.

### Modal Component Integration Bug Fix (2023-10-03)

#### Issue
When opening the ContactDetailView from the contact page, the modal would blink or reload multiple times in quick succession, creating a jarring user experience. However, fixing this issue caused a new problem where the same component used in the board view would blink/reload multiple times.

#### Root Cause Analysis
1. **Circular Dependency in Props**:
   - The `isOpen` state from the parent component was being passed to both the Modal and the ContactDetailView
   - This created a circular dependency where state changes in one component triggered re-renders in the other
   - Each re-render would trigger the useEffect hooks in ContactDetailView, causing multiple data fetches

2. **Redundant State Management**:
   - The Modal component already manages its own visibility state
   - Passing the same state to the child component created redundant state management
   - The child component's useEffect hooks were dependent on the `isOpen` prop, causing multiple triggers

3. **Dual Usage Context**:
   - The same component was being used in two different contexts:
     - In a modal dialog (contact page) where visibility is controlled by the parent
     - Directly in the DOM (board) where it's always visible
   - Different contexts require different lifecycle management

#### Solution
1. **Conditional Rendering in Modal Context**:
   ```javascript
   <Modal
     isOpen={isContactDetailViewOpen}
     onClose={() => setIsContactDetailViewOpen(false)}
     size="5xl"
   >
     <ModalOverlay />
     <ModalContent maxW="90vw" maxH="90vh" overflowY="auto">
       {isContactDetailViewOpen && (
         <ContactDetailView 
           onClose={() => setIsContactDetailViewOpen(false)} 
           contactId={contact.id}
           // other props...
         />
       )}
     </ModalContent>
   </Modal>
   ```

2. **Context-Aware Component Lifecycle**:
   ```javascript
   // Detect if we're in a modal or directly in the DOM
   const isInModal = typeof document !== 'undefined' && 
     document.querySelector('.chakra-modal__content') !== null;
   
   // Effect to load data conditionally based on context
   useEffect(() => {
     // In modal mode, only load when isOpen is true
     // In direct mode (board), always load when contactId changes
     if ((isInModal && isOpen && contactId) || (!isInModal && contactId)) {
       // Load data...
     }
   }, [isInModal, isOpen, contactId]);
   ```

3. **Context-Specific State Reset**:
   ```javascript
   // Effect to reset state when modal closes (only in modal mode)
   useEffect(() => {
     if (isInModal && !isOpen) {
       resetState();
     }
   }, [isInModal, isOpen, resetState]);

   // Clean up when component unmounts (both modes)
   useEffect(() => {
     return () => {
       resetState();
     };
   }, [resetState]);
   ```

#### Key Lessons
1. **Modal Integration Best Practices**:
   - Use conditional rendering to mount/unmount modal content
   - Avoid passing the same state to both the modal and its children
   - Let the Modal component handle its own visibility state

2. **React Component Lifecycle**:
   - Be mindful of useEffect dependencies and how they trigger re-renders
   - Use cleanup functions in useEffect for proper resource management
   - Consider the component lifecycle when designing state management

3. **Context-Aware Components**:
   - When a component can be used in multiple contexts, make it context-aware
   - Detect the rendering context and adjust behavior accordingly
   - Use different lifecycle management strategies based on context
   - Test components in all possible usage contexts

4. **Performance Optimization**:
   - Minimize redundant state and prop passing
   - Use conditional rendering to prevent unnecessary component mounting
   - Monitor and fix UI glitches that affect user experience
   - Add cooldown periods between data fetches to prevent excessive API calls

### Search Functionality Improvements (2025-02-27)

#### Issue
Search functionality in both Contacts and LiveChat components had responsiveness issues:
1. Input field was lagging behind user typing
2. No visual feedback during search operations
3. LiveChat search wasn't properly debounced like Contacts search
4. Search results weren't updating properly

#### Root Cause Analysis
1. **UI Responsiveness Issues**:
   - Input state was directly tied to the search query state
   - Debouncing was applied to the entire state update, including the input field
   - No separation between UI state and search execution state

2. **Inconsistent Implementation**:
   - Contacts search had debouncing but LiveChat search didn't
   - Different approaches to handling search between components
   - Missing loading indicators during search operations

#### Solution
1. **Separated Input State from Search Execution**:
   ```javascript
   // Before: Single state for both input and search
   const [searchQuery, setSearchQuery] = useState('');
   // ...
   onChange={(e) => setSearchQuery(e.target.value)}
   
   // After: Separate states with immediate UI updates
   const [inputValue, setInputValue] = useState('');
   // ...
   const handleInputChange = (e) => {
     const value = e.target.value;
     setInputValue(value); // Immediate UI update
     setContactsSearchQuery(value); // Debounced search execution
   };
   ```

2. **Consistent Debouncing Implementation**:
   ```javascript
   // Applied to both contact and livechat search
   setLivechatSearchQuery: debounce(async (query) => {
     set({ livechatSearchQuery: query });
     
     // Reload contacts with the new search query
     const state = get();
     await state.loadContacts(null, 50, 'livechat');
   }, 800), // 800ms debounce
   ```

3. **Added Visual Feedback**:
   ```javascript
   <Input
     placeholder="Search contacts..."
     value={inputValue}
     onChange={handleInputChange}
   />
   {isLoading && (
     <InputRightElement>
       <Spinner size="sm" color="gray.400" />
     </InputRightElement>
   )}
   ```

#### Key Lessons
1. **UI Responsiveness Best Practices**:
   - Separate UI state from business logic state
   - Apply debouncing only to expensive operations, not UI updates
   - Provide visual feedback during asynchronous operations

2. **Consistent Patterns**:
   - Use the same patterns for similar functionality across components
   - Implement debouncing consistently for search operations
   - Ensure loading states are properly managed and displayed

3. **Search Implementation**:
   - Use array-based conditions for better search query construction
   - Apply appropriate debounce timing (800ms worked well)
   - Ensure search state is properly synchronized between components

## Webhook Field Mappings

### Issue
When configuring webhook field mappings, the UI was not properly displaying or saving the mappings due to incorrect handling of the data structure returned from Supabase's join query.

### Solution
1. When fetching webhook data with joined field_mappings:
   ```javascript
   // Correct way to access joined field_mappings data
   const fieldMappings = webhook.field_mappings?.[0] || {};
   ```

2. Proper JSONPath format for field mappings:
   ```javascript
   {
     "field_mappings": {
       [fieldName]: {
         "type": "jsonpath",
         "path": "$.fieldPath"  // Must include $. prefix
       }
     }
   }
   ```

### Key Learnings
1. Supabase returns joined data as an array, even for single records
2. JSONPath expressions must start with `$.` for proper field extraction
3. Keep the data structure consistent between frontend and backend:
   - Frontend: Handle the array structure from joins
   - Database: Store mappings in a standardized format
   - Backend: Validate JSONPath format before processing

### Testing
1. Verify mappings in database using:
   ```sql
   SELECT webhook_id, mappings FROM field_mappings WHERE webhook_id = '<webhook_id>';
   ```
2. Check the UI reflects the same structure after saving and reloading

## macOS-Style Notification Center Implementation

### Implementation Approach

1. **Isolated Implementation**: Created a completely isolated notification system in a dedicated folder without modifying existing code. This approach ensures:
   - No interference with existing functionality
   - Easy to remove or modify if needed
   - Clean separation of concerns

2. **Context-Based State Management**: Used React Context API for state management:
   - Centralized notification state
   - Efficient updates without prop drilling
   - Easy access from any component

3. **Performance Optimizations**:
   - Limited maximum number of notifications to 50
   - Used React.memo and useCallback for optimized rendering
   - Implemented proper cleanup of old notifications
   - Used Portal for rendering outside the main DOM hierarchy

4. **Styling Approach**:
   - Used Chakra UI for consistent styling
   - Implemented backdrop filter for frosted glass effect
   - Responsive design that works on all screen sizes
   - Support for both light and dark mode

### Best Practices

1. **Component Structure**:
   - Small, focused components (NotificationCenter, NotificationItem, NotificationCenterHeader)
   - Clear separation of concerns
   - Reusable utility functions

2. **State Management**:
   - Used useCallback for memoized functions
   - Immutable state updates
   - Proper cleanup to prevent memory leaks

3. **Accessibility**:
   - Proper ARIA attributes
   - Keyboard navigation support
   - Sufficient color contrast

4. **Animation**:
   - Smooth transitions using Framer Motion
   - Non-intrusive animations
   - Performance-conscious implementation

### What Not To Do

1. **Avoid Global State Pollution**:
   - Don't add notification state to existing contexts
   - Don't use global variables for notification state

2. **Avoid Performance Issues**:
   - Don't render all notifications at once without virtualization
   - Don't keep unlimited notifications in memory
   - Don't use heavy animations that could affect performance

3. **Avoid UI Conflicts**:
   - Don't position the notification center where it could overlap important UI elements
   - Don't use z-index values that could conflict with existing components

4. **Avoid Tight Coupling**:
   - Don't tightly couple the notification system with other components
   - Don't modify existing components to work with the notification system

### Future Improvements

1. **Integration with Backend**:
   - Real-time notifications via WebSockets
   - Persistence across sessions

2. **Enhanced Features**:
   - Grouping similar notifications
   - Custom notification templates
   - Notification priorities
   - Notification sounds

3. **Advanced Interactions**:
   - Swipe to dismiss
   - Expandable notifications
   - Quick actions within notifications

4. **Analytics**:
   - Track notification engagement
   - Analyze which notifications are most effective

# Webhook Field Mapping Issue

## Problem
The webhook field mapping system was not correctly identifying mapped fields in the UI. Specifically, fields like `lead_status` were appearing in the "Unmapped Fields" section despite being mapped in the webhook configuration.

## Analysis

After reviewing the code, I found the following issues:

1. **Field Mapping Structure Mismatch**: 
   - In the webhook logs, the field mappings were processed correctly, but there was a mismatch between how fields were mapped and how they were checked for being unmapped.
   - The webhook processing code correctly mapped fields from the payload to contact fields, but the unmapped fields detection logic didn't correctly identify all mapped fields.

2. **Case Sensitivity Issue**:
   - The field `lead_status` was mapped to `leadstatusreason` in the webhook configuration.
   - However, in the UI, it was showing up as `leadstatus` in the unmapped fields section.
   - This suggested there might be case sensitivity issues or field name normalization problems.

3. **Unmapped Fields Detection Logic**:
   - The `processUnmappedFields` function in `webhookRoutes.js` checked if a field was mapped by comparing the field path with the mapping path.
   - However, it didn't account for all possible mapping scenarios, especially when field names differed between the source and destination.

## Solution

1. **Improve Unmapped Fields Detection**:
   - Created a clear mapping between source fields in the payload and contact fields in the database using a `sourceToContactFieldMap`.
   - Used this mapping to determine if a field should be considered "mapped" or "unmapped".
   - Ensured that mapped fields are correctly saved to the contacts table and not added to the unmapped_fields JSON object.

2. **Fix Field Mapping Structure**:
   - Ensured the field mappings structure is consistent throughout the application.
   - Made the system respect the field mappings configured in the UI rather than hardcoding specific mappings.

3. **Add Logging and Validation**:
   - Added more detailed logging to track how fields are being mapped and which ones are being detected as unmapped.
   - Improved error handling and debugging information.

## Implementation Details

The key changes were made to the `processUnmappedFields` function in `webhookRoutes.js`:

1. Created a `sourceToContactFieldMap` that maps source fields in the payload to contact fields in the database:
```javascript
// Create a map of source fields to contact fields for easier lookup
const sourceToContactFieldMap = {};
Object.entries(fieldMappings).forEach(([contactField, mapping]) => {
  const sourcePath = typeof mapping === 'string' ? mapping : mapping.path.replace(/^\$\./, '');
  sourceToContactFieldMap[sourcePath] = contactField;
});
```

2. Simplified the logic for determining if a field is mapped by directly checking the `sourceToContactFieldMap`:
```javascript
// Check if this field is mapped using the sourceToContactFieldMap
const mappedContactField = sourceToContactFieldMap[key] || sourceToContactFieldMap[fieldPath];

if (mappedContactField) {
  console.log(`Field ${fieldPath} is mapped to ${mappedContactField}`);
  return; // Skip adding to unmapped_fields
}

// If we get here, the field is not mapped
console.log(`Field ${fieldPath} is NOT mapped and will be added to unmapped_fields`);
contactData.metadata.unmapped_fields[fieldPath] = value;
```

## Testing Results

The fix was successfully tested with multiple payloads:

1. Basic test with a standard payload:
   - Contact ID: `43121d81-4b8c-48c4-a833-00968d2d64d8`
   - Confirmed that `leadstatus` was correctly mapped to `lead_status` and did not appear in unmapped fields.

2. Variant test with different values and additional fields:
   - Contact ID: `04a7f0b8-7a75-4153-83ac-9c3f0b60cab3`
   - Confirmed that `leadstatus` ("Qualified") was correctly mapped to `lead_status`.
   - Confirmed that `leadstatusreason` ("Ready for appointment") was correctly mapped according to UI configuration.
   - Confirmed that additional unmapped fields (`budget`, `preferred_contact_time`, `referral_source`) appeared in the unmapped_fields section.

## Lessons Learned

1. **Dynamic Configuration is Key**: 
   - Field mappings should be dynamic based on UI configuration, not hardcoded in the backend.
   - The backend should respect the mappings defined by users in the UI.

2. **Clear Mapping Structure**:
   - Creating a clear mapping structure (like `sourceToContactFieldMap`) makes it easier to determine if a field is mapped.
   - This approach is more maintainable and less error-prone than complex conditional logic.

3. **Thorough Testing with Various Payloads**:
   - Testing with different payloads helps ensure the solution is robust.
   - Including edge cases (like additional unmapped fields) in tests helps verify the system handles all scenarios correctly.

4. **Detailed Logging**:
   - Comprehensive logging is essential for debugging complex data processing systems like webhooks.
   - Logging each step of the field mapping process helps identify issues quickly.

### Unmapped Fields Mapping Feature (2025-03-11)

#### Problem
When webhooks received data with fields that weren't mapped to contact fields, these fields were stored in the `unmapped_fields` section of the contact's metadata. However, there was no way for users to map these fields to standard or custom fields after the contact was created. The UI showed a "Coming soon" message when users clicked the "Map to Custom Fields" button.

#### Solution
1. **Created a New Modal Component**
   - Implemented `UnmappedFieldMappingModal.js` to provide a user interface for mapping unmapped fields
   - The modal displays all unmapped fields with their values and allows users to select which standard or custom field to map each one to

2. **Updated ContactDetailView.js**
   - Connected the "Map to Custom Fields" button to open the new modal
   - Added state management for the modal
   - Implemented a handler function to update the contact when fields are mapped

3. **Implemented Field Mapping Logic**
   - Added functionality to fetch available standard and custom fields
   - Created a mapping system that allows users to select target fields
   - Implemented the save functionality that:
     - Updates standard fields directly on the contact
     - Updates custom fields in the contact's metadata.custom_fields
     - Removes mapped fields from the unmapped_fields object

#### Key Learnings
1. **UI/UX Considerations**
   - Provided clear feedback to users about what fields are being mapped
   - Used color-coded badges to distinguish between standard and custom fields
   - Added loading states to prevent confusion during API operations

2. **Data Structure Management**
   - Maintained the existing data structure while adding new functionality
   - Ensured backward compatibility with the existing unmapped fields system
   - Properly handled the transition of data from unmapped_fields to their appropriate locations

3. **State Management**
   - Used React's useState and useEffect hooks effectively to manage component state
   - Implemented proper state updates to ensure the UI reflects changes immediately
   - Added proper error handling and loading states

This implementation enhances the webhook system by allowing users to reclaim valuable data that was previously inaccessible in the unmapped fields section, improving the overall data management capabilities of the application.

## Component Integration Best Practices

### Successful Approaches:
1. **Modular Component Design**
   - Keeping components focused and single-purpose
   - Using clear, consistent prop interfaces
   - Maintaining separation of concerns between components

2. **State Management**
   - Centralizing shared state in the parent component
   - Using local state for component-specific functionality
   - Implementing clear state update patterns

3. **User Interface Patterns**
   - Providing multiple view options (table/grid) for different use cases
   - Using consistent styling and interaction patterns
   - Implementing progressive disclosure with the sidebar

4. **Performance Considerations**
   - Lazy loading tab content
   - Conditional rendering of heavy components
   - Efficient state updates with proper React hooks usage

### Challenges and Solutions:
1. **Component Communication**
   - Challenge: Managing state and events across multiple components
   - Solution: Implemented clear prop drilling and event handling patterns

2. **Layout Management**
   - Challenge: Handling multiple floating components (bulk actions, sidebar)
   - Solution: Used proper z-indexing and positioning strategies

3. **Data Flow**
   - Challenge: Keeping data consistent across different views
   - Solution: Centralized data management in parent component

4. **User Experience**
   - Challenge: Balancing feature richness with usability
   - Solution: Implemented progressive disclosure and clear visual hierarchy

### Best Practices to Follow:
1. Always maintain a single source of truth for shared state
2. Use consistent naming conventions across components
3. Implement proper type checking for component props
4. Keep component responsibilities clear and focused
5. Document component interfaces and expected behaviors
6. Test component integration points thoroughly
7. Consider mobile responsiveness from the start
8. Implement proper error boundaries and fallbacks

## Reusable UI Components

### CountBadge Component Implementation

#### Successful Approaches:
1. **Component Reusability**
   - Created a highly reusable CountBadge component that can be used across different parts of the application
   - Implemented flexible props to allow customization of appearance and behavior
   - Used consistent styling that works well in both light and dark modes

2. **Visual Design**
   - Followed macOS-style design principles with rounded pill shape and circular count badge
   - Used semantic color schemes that convey meaning (e.g., green for completed, yellow for pending)
   - Implemented proper spacing and typography for optimal readability

3. **Integration Points**
   - Successfully integrated with QuickFilterChips for filtering leads
   - Integrated with LeadGridView for displaying group counts
   - Maintained consistent appearance across different contexts

4. **Accessibility and UX**
   - Added proper hover states for interactive badges
   - Implemented clear visual feedback for active/inactive states
   - Used appropriate color contrast for text readability

#### Challenges and Solutions:
1. **Color Mode Support**
   - Challenge: Ensuring badges look good in both light and dark modes
   - Solution: Used useColorModeValue hook to define appropriate colors for each mode

2. **Count Calculation**
   - Challenge: Efficiently calculating counts for different categories
   - Solution: Implemented dedicated calculation functions that run only when data changes

3. **Visual Consistency**
   - Challenge: Maintaining consistent appearance across different contexts
   - Solution: Created a single reusable component with flexible props

#### Best Practices to Follow:
1. Create reusable UI components for common patterns to maintain consistency
2. Use semantic color schemes that convey meaning to users
3. Implement proper light/dark mode support from the beginning
4. Design components with flexibility in mind to accommodate different use cases
5. Use proper spacing and typography for optimal readability
6. Add appropriate hover and active states for interactive elements
7. Consider accessibility in component design (contrast, sizing, interaction)

## React Hooks Rules

### Issue Encountered:
We encountered an ESLint error related to the Rules of Hooks in the QuickFilterChips component:
```
ERROR in [eslint] 
src/components/inbound-lead-management/QuickFilterChips.js
  Line 87:15:  React Hook "useColorModeValue" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks
```

### Root Cause:
The `useColorModeValue` hook was being called conditionally inside the component, which violates React's Rules of Hooks. React hooks must be called at the top level of a component and in the same order on every render to ensure proper state management.

### Solution:
1. Moved all hook calls to the top level of the component
2. Stored hook results in variables that can be used conditionally later in the component
3. Ensured hooks are called in the same order on every render

### Best Practices for React Hooks:
1. **Call Hooks at the Top Level Only**
   - Never call hooks inside loops, conditions, or nested functions
   - Always call hooks at the top level of your React function component
   - This ensures hooks are called in the same order each time a component renders

2. **Maintain Consistent Hook Order**
   - Call hooks in the same order on every render
   - React relies on the order of hook calls to associate state with each hook

3. **Use ESLint Plugin**
   - The `eslint-plugin-react-hooks` package helps catch hooks-related issues
   - Configure ESLint to use the React hooks plugin for early detection of problems

4. **Extract Complex Logic to Custom Hooks**
   - When hook logic becomes complex, extract it into a custom hook
   - This improves readability and makes the component logic more maintainable

5. **Avoid Conditional Hook Calls**
   - If you need conditional behavior, put the condition inside the hook
   - Example: `useEffect(() => { if (condition) { /* effect code */ } }, [condition])`

## Color Coding UI Components

### Successful Approaches:
1. **Semantic Color Coding**
   - Used consistent color schemes for different filter types (e.g., green for "Today", blue for "New Leads")
   - Maintained color identity even in inactive states to help users recognize filter types
   - Implemented proper active/inactive states while preserving color identity

2. **Active vs. Inactive States**
   - Created distinct visual differences between active and inactive states
   - Used opacity and color intensity to indicate state without changing the base color scheme
   - Maintained color consistency across state changes for better recognition

3. **Color Mode Support**
   - Implemented proper light and dark mode support for all color states
   - Used useColorModeValue to define appropriate colors for each mode
   - Ensured good contrast in both light and dark modes

### Challenges and Solutions:
1. **Maintaining Color Identity**
   - Challenge: Keeping filter types recognizable by color while showing active/inactive states
   - Solution: Used the same color scheme but with different intensity/opacity for active vs. inactive

2. **Consistent Visual Hierarchy**
   - Challenge: Ensuring active filters stand out while maintaining a cohesive design
   - Solution: Used more vibrant background colors for active states while keeping the same base color

3. **Accessibility Considerations**
   - Challenge: Ensuring sufficient contrast for all color combinations
   - Solution: Carefully selected color pairs that maintain good contrast in both light and dark modes

### Best Practices to Follow:
1. Use semantic colors that convey meaning (e.g., green for success, blue for information)
2. Maintain color identity across different states (active, inactive, hover)
3. Implement proper light/dark mode support for all colors
4. Consider accessibility and ensure sufficient contrast
5. Use opacity and intensity variations rather than completely different colors for state changes
6. Document color schemes and their meanings for future reference
7. Test color combinations in both light and dark modes

## Modern UI Design for Metrics

### Successful Approaches:
1. **Clean, Minimalist Design**
   - Reduced visual clutter by focusing on essential information
   - Used whitespace effectively to create a clean, modern look
   - Implemented subtle borders and shadows for depth without heaviness
   - Maintained consistent padding and spacing for visual harmony

2. **Visual Hierarchy**
   - Used font size and weight to establish clear information hierarchy
   - Placed the most important information (metric value) prominently
   - Used color to draw attention to key elements
   - Maintained consistent alignment for better readability

3. **Interactive Elements**
   - Added subtle hover effects to indicate interactivity
   - Implemented smooth transitions for state changes
   - Used consistent interaction patterns across components
   - Maintained visual feedback for all interactive elements

4. **Color Usage**
   - Applied semantic color coding for different metric types
   - Used color intensity to create visual interest without overwhelming
   - Ensured sufficient contrast for text readability
   - Implemented proper light/dark mode support for all colors

### Challenges and Solutions:
1. **Information Density**
   - Challenge: Balancing information density with clean design
   - Solution: Used a compact layout with clear visual hierarchy to present information efficiently

2. **Component Reusability**
   - Challenge: Creating components that work well in different contexts
   - Solution: Implemented flexible props and styling options for maximum adaptability

3. **Consistent Styling**
   - Challenge: Maintaining consistent styling across different metric types
   - Solution: Created a base component with customizable options while preserving core design elements

### Best Practices to Follow:
1. Focus on essential information and reduce visual noise
2. Use typography effectively to establish clear information hierarchy
3. Apply consistent spacing and alignment for visual harmony
4. Implement subtle animations and transitions for better user experience
5. Use color purposefully to guide attention and convey meaning
6. Design for both light and dark modes from the beginning
7. Add subtle interactivity to enhance user engagement
8. Maintain consistent styling patterns across similar components

## Space-Efficient UI Design

### Successful Approaches
1. **Incremental Size Reductions**: Making small reductions across multiple elements (padding, margins, font sizes) creates significant space savings without compromising any single aspect of the design.
2. **Prioritizing Content**: Focusing on what information is truly essential and giving it appropriate visual weight while minimizing decorative elements.
3. **Responsive Density**: Adjusting the number of columns based on screen size ensures optimal use of horizontal space on different devices.
4. **Consistent Scale Reduction**: Maintaining proportional relationships between elements while reducing their overall size preserves visual harmony.

### Challenges and Solutions
1. **Readability vs. Space Efficiency**: Finding the balance between compact design and readability.
   - Solution: Reduced font sizes strategically, keeping primary information (values) more prominent than secondary information (labels).
2. **Touch Target Sizes**: Ensuring interactive elements remain usable on touch devices despite size reduction.
   - Solution: Maintained adequate spacing between interactive elements while reducing internal padding.
3. **Visual Hierarchy Preservation**: Maintaining clear visual hierarchy with reduced size differences.
   - Solution: Used color, weight, and subtle size differences to maintain hierarchy without requiring large size contrasts.

### Best Practices to Follow
1. Test readability at actual size on target devices before finalizing reductions.
2. Maintain minimum touch target sizes of 44×44px for mobile interfaces.
3. Use whitespace strategically - reduce it where it's excessive but preserve it where it aids in grouping and separation.
4. Consider offering density controls to users with different preferences and accessibility needs.
5. Ensure color contrast meets accessibility standards, especially with smaller text.
6. Use truncation with tooltips for text that might not fit in reduced spaces.
7. Maintain consistent spacing ratios throughout the interface for visual harmony.
8. Prioritize vertical space savings on scrollable interfaces where vertical real estate is most valuable.

# Modal Positioning Lessons

## Issue: Modal Positioning in React Applications
When implementing modals in React applications, especially with nested components and complex layouts, several key factors affect proper positioning:

### What Didn't Work
1. **Relative Z-Index Values**
   - Using low z-index values (1000-2000) wasn't sufficient
   - Modal appeared behind other elements due to stacking context issues
   - Parent container's z-index affected modal visibility

2. **Transform Property Application**
   - Using only CSS transform without style object wasn't reliable
   - Transform property conflicts occurred with animation libraries

3. **Parent Container Influence**
   - Modal positioning was affected by parent container's overflow settings
   - AnimatePresence wrapper caused positioning conflicts

### Successful Solution
1. **Z-Index Hierarchy**
   - Use very high z-index values (99998 for backdrop, 99999 for modal)
   - Ensure backdrop and modal are rendered at root level
   - Remove unnecessary wrapper components (like AnimatePresence)

2. **Redundant Position Properties**
   - Apply position properties in both CSS and style object
   - Use !important flag for transform property
   ```jsx
   position="fixed"
   top="50%"
   left="50%"
   transform="translate(-50%, -50%) !important"
   style={{
     position: 'fixed',
     top: '50%',
     left: '50%',
     transform: 'translate(-50%, -50%)',
   }}
   ```

3. **Modal Container Structure**
   - Separate backdrop and modal content
   - Render modal outside of scrollable containers
   - Keep modal state management in parent component

### Best Practices to Follow
1. Always render modals at the root level of your application
2. Use sufficiently high z-index values to avoid conflicts
3. Apply positioning properties redundantly for cross-browser compatibility
4. Keep modal components independent of parent container's styling
5. Test modal behavior with different screen sizes and scrolling conditions

// ... existing code ...

## SQL File Organization

**Date:** Current date
**Task:** Organize SQL files into a dedicated supabaseSchema directory

**What was done:**
1. Created a dedicated `supabaseSchema` directory in the project root
2. Organized SQL files from various locations into a structured directory:
   - Root SQL files moved to the main supabaseSchema directory
   - Created subdirectories for different migration sources:
     - `migrations/` for files from the root migrations directory
     - `backend_migrations/` for files from backend/migrations
     - `supabase_migrations/` for files from supabase/migrations
3. Added a README.md file to document the organization and purpose of the files

**Benefits:**
1. Improved project organization with all database-related SQL files in one location
2. Better visibility of database schema and migrations
3. Easier maintenance and discovery of SQL files
4. Clear documentation of file purposes and organization

**Best practices:**
1. Keep SQL files organized by their purpose (schema definitions, migrations, checks)
2. Use consistent naming conventions for SQL files
3. Document the organization and purpose of SQL files
4. Maintain subdirectories for different sources or categories of SQL files

**How it should not be done:**
1. Scattering SQL files throughout the project without organization
2. Mixing SQL files with application code
3. Using inconsistent naming conventions
4. Failing to document the purpose and organization of SQL files

## Audience Segmentation in CRM Systems

**Date:** March 12, 2025
**Task:** Analyze and document the AudienceSegment component

**What was learned:**
1. **Purpose and Value**: Audience segmentation is a critical CRM feature that enables targeted communication, personalized marketing, and efficient lead management by filtering contacts based on specific criteria.

2. **Implementation Approach**:
   - Frontend implementation requires dynamic filter building with intuitive UI
   - Backend requires flexible schema design to support various filter types
   - Performance considerations are essential for large contact databases

3. **Database Design Best Practices**:
   - Separate tables for segments, conditions, and segment-contact associations
   - Proper indexing for performance optimization
   - Row-level security for multi-tenant applications
   - JSONB fields for flexible metadata storage

4. **Integration Considerations**:
   - Seamless integration with messaging systems for targeted campaigns
   - Connection with analytics for performance measurement
   - Integration with automation systems for triggered workflows
   - Compatibility with existing contact management features

**Best practices:**
1. Prioritize user experience with intuitive filter building interfaces
2. Implement proper database persistence with optimized queries
3. Support both simple and complex filtering scenarios
4. Provide immediate visual feedback on segment sizes
5. Enable actionability through direct integration with messaging and campaign tools
6. Implement caching mechanisms for frequently used segments
7. Design for scalability from the beginning

**How it should not be done:**
1. Storing segment definitions without proper database persistence
2. Using mock data instead of real-time filtering against the actual database
3. Limiting filter options to basic fields without supporting custom fields
4. Implementing without considering performance implications for large datasets
5. Creating segments without actionable integration with messaging or campaign tools

## API Design and Scaling Principles

### Date: 2023-11-15

**Context:** Created a comprehensive memory document about API scaling principles based on our experience with the AudienceSegment feature.

**What Worked Well:**
- Documenting key scaling principles in a dedicated file (`docs/api_scaling_memory.md`)
- Providing concrete examples for each principle
- Creating a practical implementation checklist

**Key Principles Documented:**
1. **Stateless API Design** - Essential for horizontal scaling
2. **Materialized Views** - For optimizing complex, frequently-used queries
3. **Caching Strategy** - Multi-level approach with appropriate TTLs
4. **Rate Limiting** - Per-user and per-endpoint protection
5. **Horizontal Scaling** - Load balancing and stateless architecture
6. **Asynchronous Processing** - Job queues for resource-intensive operations
7. **Idempotent Endpoints** - Safe retries and improved reliability

**Lessons Learned:**
- Statelessness is the foundation of scalable API design
- Long-running operations should always be handled asynchronously
- Proper database optimization (indexes, materialized views) is critical for performance
- Rate limiting should be implemented from the beginning, not as an afterthought
- Idempotency is essential for reliable API operations

**For Future Projects:**
- Start with a scalable architecture from day one
- Implement monitoring and observability early
- Consider database scaling needs during schema design
- Document API design decisions and scaling considerations
- Use the checklist in `api_scaling_memory.md` for all new API endpoints

**References:**
- [API Scaling Memory Document](/docs/api_scaling_memory.md)
- [Scaling Considerations Document](/docs/scaling.md)

## Message Duplication Prevention - Comprehensive Fix (2024-02-27)

### Problem
Messages were appearing multiple times in the LiveChat UI due to:
1. Multiple sources of messages (API responses, socket events)
2. Race conditions between optimistic updates and server responses
3. Inconsistent message ID generation
4. Inefficient duplicate detection

### Root Cause Analysis
1. **Multiple Event Sources**:
   - Messages coming from both API responses and socket events
   - Different event types ('new_message', 'message_sent') for same message
   - Lack of coordination between event handlers

2. **State Management Issues**:
   - Inconsistent message state updates
   - Race conditions with optimistic updates
   - No proper cleanup of temporary messages

3. **Duplicate Detection Gaps**:
   - Simple ID-based checking wasn't sufficient
   - No handling of near-simultaneous messages
   - Missing checks for optimistic updates

### Solution
1. **Unified Message Processing**:
   ```javascript
   const isDuplicate = (message, existingMessages) => {
     // Check exact ID match
     if (existingMessages.some(m => m.id === message.id)) {
       return true;
     }

     // Check temporary ID for optimistic updates
     if (message.tempId && existingMessages.some(m => m.tempId === message.tempId)) {
       return true;
     }

     // Check content + metadata within time window
     return existingMessages.some(m => (
       m.content === message.content &&
       m.direction === message.direction &&
       m.from === message.from &&
       m.to === message.to &&
       Math.abs(new Date(m.created_at) - new Date(message.timestamp)) < 2000
     ));
   };
   ```

2. **Robust Message Queue**:
   ```javascript
   // Queue for handling concurrent message processing
   const messageQueue = new Map();
   
   // Process message with queue
   if (messageQueue.has(messageId)) {
     return new Promise((resolve) => {
       const queue = messageQueue.get(messageId) || [];
       queue.push(resolve);
       messageQueue.set(messageId, queue);
     });
   }
   ```

3. **Optimistic Updates**:
   ```javascript
   // Create optimistic message
   const optimisticMessage = {
     ...message,
     tempId: `temp-${Date.now()}-${Math.random()}`,
     status: 'pending',
     timestamp: new Date().toISOString()
   };
   
   // Update on success
   const updatedMessage = {
     ...data.message,
     tempId: optimisticMessage.tempId,
     status: 'delivered'
   };
   ```

### Best Practices
1. **Message Processing**:
   - Use a message queue for concurrent processing
   - Implement comprehensive duplicate detection
   - Clean up processed message IDs with TTL
   - Sort messages by timestamp consistently

2. **State Management**:
   - Maintain a single source of truth
   - Handle optimistic updates properly
   - Clean up temporary state
   - Use proper error handling

3. **Event Handling**:
   - Clean up event listeners before setting new ones
   - Handle different event types appropriately
   - Implement proper socket room management
   - Add timeouts for async operations

4. **Error Recovery**:
   - Remove optimistic updates on failure
   - Provide clear error feedback
   - Maintain message order
   - Handle edge cases gracefully

### What Not To Do
1. Don't rely on simple ID matching for duplicates
2. Don't process same event type multiple times
3. Don't keep processed message IDs indefinitely
4. Don't ignore race conditions
5. Don't mix message sources without proper handling
6. Don't update state without checking existing messages

### Verification Steps
1. Send multiple messages rapidly to test concurrency
2. Check both sent and received messages for duplicates
3. Verify message order is maintained
4. Test reconnection scenarios
5. Monitor memory usage for message ID storage
6. Verify optimistic updates work correctly
7. Test error recovery scenarios

This comprehensive fix ensures reliable message handling while maintaining good performance and user experience.

## JavaScript Module Export Best Practices (2024-02-27)

### Issue
Build error due to duplicate exports in messageService.js:
```
ERROR: `sendMessage` has already been exported. Exported identifiers must be unique.
```

### Root Cause
The same function was being exported twice:
1. Once as a named export: `export const sendMessage = async (message) => {...}`
2. Again in the final export block: `export { processMessage, sendMessage, isDuplicate, generateMessageId };`

### Solution
Removed the duplicate export from the final export block since the function was already exported as a named export.

### Best Practices
1. **Export Management**:
   - Keep track of what's already been exported
   - Use named exports consistently
   - Don't mix default and named exports for the same identifier
   - Use a single export statement per identifier

2. **Module Organization**:
   - Group exports at the end of the file when possible
   - Use named exports for better tree-shaking
   - Be explicit about what's being exported
   - Document export patterns in comments if complex

3. **Code Style**:
   - Use consistent export patterns across the codebase
   - Consider using barrel files (index.js) for complex modules
   - Keep exports organized and documented
   - Use TypeScript for better export management

### What Not To Do
1. Don't export the same identifier multiple times
2. Don't mix export styles unnecessarily
3. Don't use default exports for libraries/utilities
4. Don't export everything without consideration

This fix ensures clean module exports and better maintainability.

## Variable Scope in Try-Catch Blocks (2024-02-27)

### Issue
ESLint error in messageService.js:
```
ERROR: 'optimisticMessage' is not defined no-undef
```

### Root Cause
The `optimisticMessage` variable was defined inside the try block but was being accessed in the catch block. Variables defined inside a try block are not accessible in the catch block due to block scoping rules in JavaScript.

### Solution
Moved the variable declaration and initialization before the try-catch block to ensure it's accessible in both try and catch blocks:
```javascript
// Good: Variable accessible in both try and catch
const optimisticMessage = {
  ...message,
  tempId: `temp-${Date.now()}-${Math.random()}`,
  status: 'pending'
};

try {
  // Use optimisticMessage
} catch (error) {
  // Can still access optimisticMessage here
}

// Bad: Variable not accessible in catch
try {
  const optimisticMessage = { /* ... */ };
  // Use optimisticMessage
} catch (error) {
  // ERROR: optimisticMessage is not defined
}
```

### Best Practices
1. **Variable Scope**:
   - Declare variables needed in catch blocks before the try-catch
   - Keep try blocks focused on error-prone operations
   - Don't rely on variables defined inside try blocks

2. **Error Handling**:
   - Clean up resources properly in catch blocks
   - Provide meaningful error messages
   - Handle all possible error cases
   - Maintain consistent state even after errors

3. **Code Organization**:
   - Group related operations logically
   - Keep error handling separate from main logic
   - Use clear variable names that indicate purpose
   - Document error handling behavior

### What Not To Do
1. Don't define variables inside try blocks if needed in catch
2. Don't ignore errors without proper cleanup
3. Don't leave application in inconsistent state after errors
4. Don't mix error handling with business logic

This fix ensures proper variable access in error handling code while maintaining clean and maintainable code structure.

## Maintaining Consistent Enums Across Stack (2024-02-27)

### Issue
Message duplication due to inconsistent message types:
- Frontend using 'sms'
- Backend using 'text'
- Database schema only allowing 'text'

This caused messages to appear twice because the deduplication logic wasn't matching messages with different types.

### Root Cause
The message type was being set inconsistently across different parts of the application:
1. Frontend (`messageStore.js`): Used 'sms'
2. Backend (`index.js`): Used 'text'
3. Database schema: Only allowed 'text' (and other non-SMS types)

### Solution
Standardized all message types to use 'text' to match the database schema constraints:
```sql
-- Database schema
message_type TEXT NOT NULL DEFAULT 'text' CHECK (
  message_type IN ('text', 'email', 'link', 'video', 'image', 'calendar', 'phone')
)
```

```javascript
// Frontend and Backend
message_type: 'text'  // Consistently using 'text' instead of 'sms'
```

### Best Practices
1. **Schema as Source of Truth**:
   - Use database schema as the single source of truth for enums
   - Document allowed values in schema with CHECK constraints
   - Reference schema when implementing frontend/backend logic

2. **Type Consistency**:
   - Use consistent types across all application layers
   - Create shared type definitions/constants
   - Validate types at each layer
   - Use TypeScript interfaces where possible

3. **Code Organization**:
   - Keep enum definitions in a central location
   - Use constants instead of hardcoding values
   - Document enum meanings and use cases
   - Consider using TypeScript enums

### What Not To Do
1. Don't use different values for the same concept
2. Don't bypass database constraints
3. Don't hardcode enum values
4. Don't mix similar but different types (e.g., 'sms' vs 'text')

This fix ensures consistent message types across the application, preventing duplication and improving reliability.

## Message Deduplication Logic Improvements (2024-02-27)

### Issue
Messages were still appearing as duplicates in the UI even after standardizing message types to 'text'. The deduplication logic was not properly handling message field variations and had overly strict timing requirements.

### Root Cause Analysis
1. Field name inconsistency: Messages could have content in either `body` or `content` field
2. Timestamp comparison was too strict (2 seconds)
3. Unnecessary fields in comparison (`from`/`to` which weren't always present)
4. Insufficient logging to debug deduplication issues

### Solution
Enhanced deduplication logic with:
```javascript
isDuplicate: (message, existingMessages) => {
  // Compare using either body or content field
  const existingContent = m.body || m.content;
  const newContent = message.body || message.content;
  
  // More flexible time window (5 seconds)
  const timeDiff = Math.abs(existingTimestamp - newTimestamp);
  const isTimeMatch = timeDiff < 5000;
  
  // Only compare essential fields
  return isContentMatch && isDirectionMatch && isTimeMatch;
}
```

### Best Practices
1. **Field Normalization**:
   - Handle multiple possible field names
   - Use fallbacks for content fields
   - Document expected field names

2. **Time Windows**:
   - Use reasonable time windows for deduplication
   - Consider network latency and processing time
   - Make time windows configurable if needed

3. **Logging**:
   - Add detailed logging for debugging
   - Log comparison results
   - Include relevant message fields

### What Not To Do
1. Don't assume field names are consistent
2. Don't make time windows too strict
3. Don't compare unnecessary fields
4. Don't skip logging in critical logic

This fix ensures more reliable message deduplication while maintaining flexibility for different message formats.

## Message Flow and ID Consistency (2024-02-27)

### Issue
Messages were being duplicated due to multiple message creation points in the system:
1. Socket event emission creating a message
2. Direct API calls creating another message
3. Each creation point generating different IDs for the same message

### Root Cause Analysis
The message sending flow had multiple paths that could create messages:
```javascript
// Original problematic flow:
1. Create temp message (tempId)
2. Save to Supabase (new ID)
3. Emit socket event (could create new message)
4. Call API endpoint (could create new message)
5. Update status (using different IDs)
```

Each path generated its own ID, making deduplication difficult even with content matching.

### Solution
Unified the message flow to use a single consistent ID throughout:
```javascript
// New streamlined flow:
1. Generate single messageId
2. Create temp message with messageId
3. Save to Supabase with same messageId
4. Only emit socket event (no direct API calls)
5. Wait for socket response
6. Update status using same messageId
```

### Best Practices
1. **ID Management**:
   - Generate and use a single ID throughout message lifecycle
   - Pass the same ID through all system components
   - Use the ID for both temporary and permanent states

2. **Message Flow**:
   - Choose one primary path for message sending
   - Avoid multiple creation points
   - Use socket events for real-time updates
   - Handle optimistic updates consistently

3. **State Management**:
   - Track message state changes using consistent ID
   - Update UI and database atomically
   - Handle errors without losing message tracking

### What Not To Do
1. Don't create multiple paths for the same operation
2. Don't generate different IDs for the same entity
3. Don't mix socket events with direct API calls
4. Don't lose track of message identity across updates

This fix ensures messages maintain a single identity throughout their lifecycle, preventing duplication and improving reliability.

## UUID Message ID Implementation (2024-02-27)

### Issue
Message saving failed with error: "invalid input syntax for type uuid"

### Root Cause
We were using a custom timestamp-based ID format (`${Date.now()}-${random}`), but Supabase expects UUID format for id fields.

### Solution
Implemented proper UUID generation:
```javascript
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Usage in message creation
const messageId = generateUUID();
```

### Best Practices
1. Always use proper UUID format for database ID fields
2. Maintain ID consistency across the system
3. Use the same ID for temporary and permanent states
4. Consider UUID v4 for uniqueness in distributed systems

## Multi-Tenant Scalability Planning (2024-02-27)

### Current Architecture Analysis
Current implementation works but has scalability limitations for multi-tenant usage:
- Global message storage
- Single socket connection for all workspaces
- No workspace-specific resource limits
- Potential memory management issues

### Proposed Scalability Improvements

1. **Workspace Isolation**:
```javascript
workspaceStores: {
  [workspaceId]: {
    processedMessageIds: new Set(),
    messageQueue: new Map(),
    messages: [],
    lastSyncTimestamp: Date
  }
}
```

2. **Socket Management**:
```javascript
// Workspace & Contact specific rooms
`workspace:${workspaceId}`
`workspace:${workspaceId}:contact:${contactId}`
```

3. **Resource Management**:
```javascript
workspaceConfig: {
  [workspaceId]: {
    maxConcurrentMessages: number,
    rateLimit: {
      messages: number,
      timeWindow: minutes
    },
    retentionPeriod: days
  }
}
```

4. **Caching Strategy**:
```javascript
workspaceCache: {
  [workspaceId]: {
    recentMessages: LRUCache,
    contactThreads: LRUCache,
    settings: Cache
  }
}
```

### Implementation Phases
1. Phase 1: Workspace Isolation
   - Separate message stores per workspace
   - Workspace-specific socket rooms
   - Memory management improvements

2. Phase 2: Resource Management
   - Rate limiting per workspace
   - Message queuing
   - Error handling per tenant

3. Phase 3: Performance Optimization
   - Caching implementation
   - Database optimizations
   - Connection pooling

4. Phase 4: Monitoring
   - Per-workspace metrics
   - Usage analytics
   - Error tracking

### Best Practices for Multi-Tenant Implementation
1. **Data Isolation**:
   - Strict workspace separation
   - Tenant-specific storage
   - Proper access controls

2. **Resource Management**:
   - Fair resource allocation
   - Prevent tenant interference
   - Scalable storage strategy

3. **Error Handling**:
   - Tenant-specific error management
   - Graceful degradation
   - Clear error reporting

4. **Security**:
   - Data segregation
   - Access control
   - Audit logging

### What Not To Do
1. Don't mix data between workspaces
2. Don't use global state for tenant-specific data
3. Don't ignore resource limits
4. Don't skip monitoring implementation

This scalability plan ensures the application can grow with increasing numbers of workspaces while maintaining performance and reliability.

## Workspace Creation After Signup

### Issue
When a new user signs up, the workspace creation fails with a "new row violates row-level security policy" error. This prevents the user from accessing the main application.

### Root Cause
1. Row Level Security (RLS) policies were too restrictive, preventing new users from creating workspaces
2. Database trigger for workspace creation was not properly handling all cases
3. No fallback mechanism in the frontend if the automatic workspace creation fails

### Solution
1. Updated RLS policies to allow:
   - Service role to manage all workspaces
   - Authenticated users to create workspaces during signup
   - Users to view their own workspaces
   - Admins to update their workspaces

2. Improved database trigger to:
   - Handle workspace creation more robustly
   - Create necessary related records (status categories, options)
   - Better error handling without failing user creation

3. Added frontend fallback:
   - Verify workspace creation after signup
   - Attempt manual workspace creation if automatic creation fails
   - Allow user to proceed even if workspace creation fails (can be fixed later)

### How to Fix
1. Apply SQL scripts through Supabase dashboard:
   - `sql/fix_workspace_creation_flow.sql`
   - `sql/fix_user_creation_complete.sql`
2. Update frontend code in `frontend/src/lib/supabaseUnified.js`

### Prevention
1. Always test signup flow with new users
2. Implement proper error handling at all levels
3. Have fallback mechanisms for critical operations
4. Regularly review and test RLS policies

# UUID Handling in Database Tables

## Issue
- When new users signed up, workspace creation failed with several errors:
  - `column "created_by" does not exist`
  - `null value in column "id" violates not-null constraint`
  - `default for column "id" cannot be cast automatically to type uuid`
  - `cannot alter type of a column used in a policy definition`

## Root Cause
- Inconsistent data types in database tables (TEXT vs UUID)
- Missing explicit UUID generation for primary keys
- RLS policies preventing alterations to columns they depend on
- Missing columns in some tables

## Solution
1. Created separate scripts to handle each aspect of the fix:
   - `create_user_trigger.sql`: Fixed the user creation trigger with proper UUID handling
   - `test_workspace_creation.sql`: Test script to verify fixes

2. Key fixes included:
   - Explicitly using `uuid_generate_v4()` for all ID columns
   - Setting proper data types (UUID for IDs)
   - Adding required timestamp fields
   - Fixing schema references with `public.` prefix
   - Adding proper error handling in PL/pgSQL blocks

## Best Practices for UUID in Postgres
1. Always use the UUID extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
2. Generate UUIDs using `uuid_generate_v4()`
3. Be explicit about UUID types: use `::UUID` casting when necessary
4. For tables with UUID primary keys, set default: `DEFAULT uuid_generate_v4()`
5. When altering column types:
   - Drop policies that depend on those columns first
   - Handle each alteration in a separate transaction
   - Add error handling for each operation

# RLS Policy Infinite Recursion

## Issue
When attempting to access workspace data after signup, the application gets stuck with "infinite recursion detected in policy for relation 'workspace members'" error.

## Root Cause
The Row-Level Security (RLS) policies for the workspace_members table were creating a circular dependency:
- The policy was checking if the user has access to workspace_members
- But to do that check, it needed to query workspace_members
- This created an infinite recursion loop

## Solution
1. Drop all existing policies on the workspace_members table
2. Create simplified policies that avoid circular references:
   - Allow service_role to manage all workspace_members
   - Let authenticated users view all workspace memberships (no recursion)
   - Restrict create/update/delete to the user's own memberships

## Lessons Learned
1. When designing RLS policies, be careful about circular dependencies
2. Use simplified checks like `user_id = auth.uid()` rather than joins that could create loops
3. Test policies with new users to ensure they don't encounter recursion issues
4. Monitor logs for "infinite recursion" errors which indicate policy problems

# Comprehensive Workspace Creation Implementation

## Complete Solution
To fully address the workspace creation issues for new users, we implemented a multi-layered approach:

1. **Fixed RLS Policies**:
   - Created simplified policies that avoid circular references
   - Used direct user ID checks instead of recursive queries
   - Fixed policy permissions to allow proper access
   - Allowed authenticated users to view necessary data

2. **Enhanced Database Trigger**:
   - Implemented robust UUID handling for all ID fields
   - Added explicit timestamps for all date fields
   - Included proper error handling to prevent user creation failures
   - Created complete workspace setup including status categories and options

3. **Frontend Fallback Mechanism**:
   - Added verification logic to check workspace creation status
   - Implemented manual workspace creation if automatic creation fails
   - Created complete workspace data structures including onboarding status
   - Added extensive error handling and logging

## Key Implementation Details
1. **UUIDs and Data Types**:
   - Use explicit `uuid_generate_v4()` for generating UUIDs in SQL
   - Use `crypto.randomUUID()` for generating UUIDs in JavaScript
   - Include all required fields with proper types
   - Set proper timestamps for created_at and updated_at fields

2. **Proper Error Handling**:
   - Use exception handling in SQL functions
   - Add proper logging for diagnosing issues
   - Implement fallback mechanisms at every level
   - Don't fail user creation if workspace creation fails

3. **Complete Data Setup**:
   - Create all necessary records for a fully functional workspace
   - Include status categories and options
   - Set up onboarding status
   - Add proper relationships between tables

## Best Practices for New Features
1. Always use UUIDs for database primary keys
2. Create explicit error handling at all levels
3. Implement fallback mechanisms for critical operations
4. Test new user flows regularly
5. Monitor workspace creation for failures
6. Use properly structured database triggers
7. Create complete documentation for system behavior
