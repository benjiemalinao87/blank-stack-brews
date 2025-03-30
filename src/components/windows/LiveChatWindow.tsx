import React, { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { DockWindow } from '../dock/DockWindow';
import { UserList } from '../chat/UserList';
import { MessageList } from '../chat/MessageList';
import { MessageInput } from '../chat/MessageInput';
import { socket } from '../../socket';
import logger from '../../utils/logger';

export function LiveChatWindow() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('new_message', (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });

    return () => {
      socket.off('new_message');
    };
  }, []);

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim()) return;

    try {
      await socket.emit('send_message', {
        to: selectedUser,
        message: message.trim()
      });
      setMessage('');
    } catch (error) {
      logger.error('Error sending message:', error);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.from === selectedUser || msg.to === selectedUser
  );

  return (
    <DockWindow title="Live Chat">
      <Box h="100%" display="flex">
        {/* Left Panel */}
        <Box w="300px" borderRight="1px solid" borderColor="gray.200">
          <UserList
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            messages={messages}
            deleteContact={() => logger.warn('deleteContact not implemented')}
          />
        </Box>

        {/* Right Panel */}
        <Box flex="1" display="flex" flexDirection="column">
          <MessageList messages={filteredMessages} />
          <MessageInput
            message={message}
            onChange={setMessage}
            onSend={handleSendMessage}
          />
        </Box>
      </Box>
    </DockWindow>
  );
}
