# Notification Center

A macOS-style notification center for displaying activity and notifications in the application.

## Features

- 🔔 Collapsible notification panel in the bottom-right corner
- 🎨 Styled to match macOS notification center
- 🌓 Supports light and dark mode
- 🔄 Animated transitions
- 📱 Responsive design
- 🧠 Context-based state management
- 🔍 Different notification types (info, success, warning, error)
- 🗂️ Categorized notifications by source
- ⏱️ Relative timestamps
- 🔕 Mark as read functionality
- 🗑️ Clear all notifications

## Usage

### 1. Wrap your application with the NotificationProvider

```jsx
import { NotificationProvider } from '../../contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      {/* Your app components */}
    </NotificationProvider>
  );
}
```

### 2. Add the NotificationCenter component to your layout

```jsx
import { NotificationCenter } from '../components/notification-center';

function Layout() {
  return (
    <>
      {/* Your app layout */}
      <NotificationCenter />
    </>
  );
}
```

### 3. Use the useNotification hook to add notifications

```jsx
import { useNotification } from '../../contexts/NotificationContext';
import { createInfoNotification } from '../components/notification-center/notificationUtils';

function MyComponent() {
  const { addNotification } = useNotification();
  
  const handleClick = () => {
    addNotification(createInfoNotification({
      title: 'Hello',
      message: 'This is a notification',
    }));
  };
  
  return (
    <button onClick={handleClick}>Show Notification</button>
  );
}
```

## Notification Utilities

The `notificationUtils.js` file provides helper functions to create different types of notifications:

- `createNotification`: Base function for creating notifications
- `createInfoNotification`: Creates an info notification
- `createSuccessNotification`: Creates a success notification
- `createWarningNotification`: Creates a warning notification
- `createErrorNotification`: Creates an error notification
- `createSystemNotification`: Creates a system notification
- `createChatNotification`: Creates a chat notification
- `createContactNotification`: Creates a contact notification
- `createAppointmentNotification`: Creates an appointment notification

## Notification Object Structure

```js
{
  id: number,            // Automatically generated
  timestamp: Date,       // Automatically generated
  read: boolean,         // Automatically set to false
  title: string,         // Required
  message: string,       // Optional
  type: string,          // 'info', 'success', 'warning', 'error'
  source: string,        // Optional, e.g., 'System', 'Chat'
  icon: string,          // Optional, URL to an icon image
  onClick: function      // Optional, function to call when clicked
}
```

## API

### NotificationContext

- `notifications`: Array of notification objects
- `unreadCount`: Number of unread notifications
- `isOpen`: Boolean indicating if the notification center is open
- `addNotification(notification)`: Adds a new notification
- `removeNotification(id)`: Removes a notification by ID
- `markAsRead(id)`: Marks a notification as read
- `markAllAsRead()`: Marks all notifications as read
- `clearAll()`: Removes all notifications
- `toggleNotificationCenter()`: Toggles the notification center visibility
- `closeNotificationCenter()`: Closes the notification center
- `openNotificationCenter()`: Opens the notification center

## Performance Considerations

- The notification center uses React's context API for state management
- Notifications are limited to a maximum of 50 to prevent memory issues
- Animations are handled by Framer Motion for smooth transitions
- The component is rendered in a Portal to avoid layout issues
- Notifications are rendered using virtualization for better performance with many items

## Customization

You can customize the appearance of the notification center by modifying the following files:

- `NotificationCenter.js`: Main container component
- `NotificationCenterHeader.js`: Header component
- `NotificationItem.js`: Individual notification component

## Example

See `NotificationDemo.js` for a complete example of how to use the notification center. 