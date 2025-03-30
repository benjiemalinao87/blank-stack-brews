import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaClock, FaFileAlt, FaUserAlt, FaChevronDown, FaMinus } from 'react-icons/fa';

const Container = styled.div`
  padding: 20px;
  position: relative;
  min-height: 400px; // Minimum height to ensure content is visible
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #1d1d1f;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #86868b;
  margin-bottom: 30px;
`;

const RecipientCount = styled.div`
  background: #f5f5f7;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountNumber = styled.span`
  font-weight: 600;
  color: #1d1d1f;
`;

const MessageBox = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;
  margin-bottom: 80px; // Space for floating button
  
  /* Customize scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f5f5f7;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d1d1d6;
    border-radius: 4px;
    
    &:hover {
      background: #c1c1c6;
    }
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px; // Reduced from 150px
  max-height: 300px; // Add max height
  padding: 12px; // Reduced from 16px
  border: 1px solid #e5e5e7;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #0071e3;
  }
  
  &::placeholder {
    color: #86868b;
  }
`;

const CharacterCount = styled.div`
  font-size: 12px;
  color: #86868b;
  text-align: right;
  padding: 8px 16px;
  border-top: 1px solid #f5f5f7;
`;

const FloatingButtonContainer = styled.div`
  position: sticky;
  bottom: 24px;
  right: 24px;
  display: flex;
  justify-content: flex-end;
  padding-right: 24px;
  pointer-events: none; // Allow scrolling through the container
  margin-top: -72px; // Pull up to overlap with bottom margin of MessagesContainer
`;

const FloatingButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: #0071e3;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 1000;
  pointer-events: auto; // Re-enable pointer events for the button
  
  &:hover {
    background: #0077ed;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const OptionsMenu = styled.div`
  position: absolute;
  bottom: 60px;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 180px;
  z-index: 1001;
  pointer-events: auto;
  transform-origin: bottom right;
  animation: slideUp 0.2s ease;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: none;
  color: #1d1d1f;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
  
  &:hover {
    background: #f5f5f7;
  }
  
  svg {
    color: #86868b;
  }
`;

const DelayOptions = styled.div`
  position: absolute;
  left: -120px;
  bottom: 0;
  transform: translateY(-100%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  gap: 8px;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const DelayOption = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #e5e5e7;
  background: white;
  color: #1d1d1f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #0071e3;
    color: #0071e3;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e5e7;
  background: white;
  color: #ff3b30;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
  
  &:hover {
    background: #fff1f0;
    border-color: #ff3b30;
  }
  
  svg {
    font-size: 12px;
  }
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f5f5f7;
  gap: 8px;
`;

const PersonalizeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e5e5e7;
  background: white;
  color: #1d1d1f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #0071e3;
    color: #0071e3;
  }
  
  svg {
    font-size: 12px;
    color: #86868b;
  }
`;

const PersonalizeMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 200px;
  z-index: 100;
`;

const PersonalizeGroup = styled.div`
  padding: 8px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f5f5f7;
  }
`;

const GroupTitle = styled.div`
  padding: 4px 16px;
  font-size: 12px;
  color: #86868b;
  font-weight: 500;
  text-transform: uppercase;
`;

const PersonalizeItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #1d1d1f;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #f5f5f7;
  }
  
  span {
    color: #86868b;
    margin-left: auto;
    font-size: 12px;
  }
`;

const PERSONALIZATION_VARS = {
  contact: [
    { label: 'First Name', value: '{firstname}' },
    { label: 'Last Name', value: '{lastname}' },
    { label: 'Email', value: '{email}' },
    { label: 'Phone', value: '{phone}' },
    { label: 'Full Name', value: '{fullname}' }
  ],
  metadata: [
    { label: 'Product', value: '{product}' },
    { label: 'Lead Source', value: '{lead_source}' },
    { label: 'Market', value: '{market}' },
    { label: 'Tags', value: '{tags}' }
  ]
};

const BroadcastComposer = ({ type, content, onContentChange, recipientCount }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDelayOptions, setShowDelayOptions] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, content: '', delay: 0 }]);
  const [showPersonalize, setShowPersonalize] = useState(null);
  const maxLength = type === 'sms' ? 160 : 5000;
  
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showOptions && 
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target) && 
        !buttonRef.current.contains(event.target)
      ) {
        setShowOptions(false);
        setShowDelayOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const handleContentChange = (id, value) => {
    const updatedMessages = messages.map(msg => 
      msg.id === id ? { ...msg, content: value } : msg
    );
    setMessages(updatedMessages);
    
    // Update parent component
    onContentChange({
      ...content,
      body: value
    });
  };
  
  const insertPersonalization = (messageId, variable) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const textarea = document.querySelector(`textarea[data-message-id="${messageId}"]`);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = message.content;
    
    const newContent = text.substring(0, start) + variable + text.substring(end);
    handleContentChange(messageId, newContent);
    
    setShowPersonalize(null);
    
    // Reset cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };
  
  const addNewMessage = () => {
    setMessages([...messages, { 
      id: Date.now(),
      content: '',
      delay: 0 
    }]);
    setShowOptions(false);
  };
  
  const addDelayedMessage = (delay) => {
    setMessages([...messages, { 
      id: Date.now(),
      content: '',
      delay 
    }]);
    setShowOptions(false);
  };

  const deleteMessage = (id) => {
    if (messages.length <= 1) return; // Prevent deleting the last message
    const updatedMessages = messages.filter(msg => msg.id !== id);
    setMessages(updatedMessages);
  };

  return (
    <Container>
      <Title>Compose</Title>
      <Subtitle>Create your message content</Subtitle>
      
      <RecipientCount>
        <CountNumber>{recipientCount || 0}</CountNumber> contacts will receive this message
      </RecipientCount>
      
      <MessagesContainer>
        {messages.map((message, index) => (
          <MessageBox key={message.id}>
            {message.delay > 0 && (
              <div style={{ padding: '8px 12px', color: '#86868b', fontSize: '13px', borderBottom: '1px solid #f5f5f7' }}>
                Delayed by: {message.delay} minutes
              </div>
            )}
            <ToolbarContainer>
              <div style={{ position: 'relative' }}>
                <PersonalizeButton onClick={() => setShowPersonalize(message.id)}>
                  <FaUserAlt size={12} />
                  Personalize
                  <FaChevronDown />
                </PersonalizeButton>
                
                {showPersonalize === message.id && (
                  <PersonalizeMenu>
                    <PersonalizeGroup>
                      <GroupTitle>Contact Fields</GroupTitle>
                      {PERSONALIZATION_VARS.contact.map(variable => (
                        <PersonalizeItem 
                          key={variable.value}
                          onClick={() => insertPersonalization(message.id, variable.value)}
                        >
                          {variable.label}
                          <span>{variable.value}</span>
                        </PersonalizeItem>
                      ))}
                    </PersonalizeGroup>
                    <PersonalizeGroup>
                      <GroupTitle>Metadata Fields</GroupTitle>
                      {PERSONALIZATION_VARS.metadata.map(variable => (
                        <PersonalizeItem 
                          key={variable.value}
                          onClick={() => insertPersonalization(message.id, variable.value)}
                        >
                          {variable.label}
                          <span>{variable.value}</span>
                        </PersonalizeItem>
                      ))}
                    </PersonalizeGroup>
                  </PersonalizeMenu>
                )}
              </div>
              
              {messages.length > 1 && (
                <DeleteButton onClick={() => deleteMessage(message.id)}>
                  <FaMinus />
                </DeleteButton>
              )}
            </ToolbarContainer>
            <TextArea
              data-message-id={message.id}
              value={message.content}
              onChange={(e) => handleContentChange(message.id, e.target.value)}
              placeholder="Type your message here... Use personalization variables to make your message more engaging"
              maxLength={maxLength}
            />
            <CharacterCount>
              {message.content.length}/{maxLength} characters
            </CharacterCount>
          </MessageBox>
        ))}
      </MessagesContainer>
      
      <FloatingButtonContainer>
        <FloatingButton 
          ref={buttonRef}
          onClick={() => setShowOptions(!showOptions)}
        >
          <FaPlus size={20} />
        </FloatingButton>
        
        {showOptions && (
          <OptionsMenu ref={menuRef}>
            <MenuItem 
              onMouseEnter={() => setShowDelayOptions(true)}
              onMouseLeave={() => setShowDelayOptions(false)}
            >
              <FaClock /> Delay Message
              {showDelayOptions && (
                <DelayOptions>
                  <DelayOption onClick={() => {
                    addDelayedMessage(15);
                    setShowOptions(false);
                    setShowDelayOptions(false);
                  }}>15m</DelayOption>
                  <DelayOption onClick={() => {
                    addDelayedMessage(60);
                    setShowOptions(false);
                    setShowDelayOptions(false);
                  }}>1h</DelayOption>
                  <DelayOption onClick={() => {
                    addDelayedMessage(1440);
                    setShowOptions(false);
                    setShowDelayOptions(false);
                  }}>1d</DelayOption>
                </DelayOptions>
              )}
            </MenuItem>
            <MenuItem onClick={() => {
              addNewMessage();
              setShowOptions(false);
            }}>
              <FaFileAlt /> New Message
            </MenuItem>
          </OptionsMenu>
        )}
      </FloatingButtonContainer>
    </Container>
  );
};

export default BroadcastComposer; 