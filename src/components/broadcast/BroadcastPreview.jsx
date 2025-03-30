import React, { useState } from 'react';
import styled from 'styled-components';
import { FaArrowRight, FaPaperPlane, FaMobileAlt } from 'react-icons/fa';
import axios from 'axios';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const Container = styled.div`
  padding: 15px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
`;

const ContentLayout = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
  }
`;

const PreviewColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TestColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 300px;
`;

const DeviceTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
  text-align: center;
`;

const PhoneFrame = styled.div`
  width: 220px;
  height: 400px;
  border-radius: 24px;
  border: 8px solid #333;
  background-color: white;
  overflow: hidden;
  position: relative;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const PhoneHeader = styled.div`
  padding: 8px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eaeaea;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  text-align: center;
`;

const MessageContainer = styled.div`
  padding: 10px;
  height: calc(100% - 70px);
  overflow-y: auto;
  background-color: #f7f7f7;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 8px 10px;
  background-color: #e5f8f6;
  border-radius: 16px 16px 16px 4px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  align-self: flex-start;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const TimeStamp = styled.div`
  font-size: 10px;
  color: #999;
  text-align: center;
  margin: 6px 0;
`;

const EmailPreviewContainer = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  width: 320px;
  height: 400px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const EmailHeader = styled.div`
  padding: 10px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eaeaea;
`;

const EmailSubject = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
`;

const EmailMetadata = styled.div`
  font-size: 10px;
  color: #777;
`;

const EmailBody = styled.div`
  padding: 12px;
  height: calc(100% - 45px);
  overflow-y: auto;
`;

const TestMessageSection = styled.div`
  background-color: white;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TestMessageTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
`;

const TestMessageForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PhoneFormatNote = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 2px;
  margin-bottom: 8px;
`;

const InputField = styled.input`
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: #5b6af9;
    box-shadow: 0 0 0 2px rgba(91, 106, 249, 0.2);
  }
`;

const SendTestButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #38b2ac;
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover {
    background-color: ${props => props.disabled ? '#38b2ac' : '#2c9a94'};
  }
  
  svg {
    margin-right: 6px;
  }
`;

const FeedbackMessage = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: ${props => props.isError ? '#fff5f5' : '#f0fff4'};
  color: ${props => props.isError ? '#e53e3e' : '#38a169'};
`;

const BroadcastPreview = ({ type, content, onContinue }) => {
  const [testRecipient, setTestRecipient] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { currentWorkspace } = useWorkspace();
  
  const handleSendTest = async (e) => {
    e.preventDefault();
    
    if (!testRecipient) {
      setFeedbackMessage('Please enter a recipient');
      setIsError(true);
      return;
    }

    if (!currentWorkspace?.id) {
      setFeedbackMessage('No workspace selected');
      setIsError(true);
      return;
    }
    
    setIsSending(true);
    
    try {
      if (type === 'sms') {
        // Send test SMS using our new API endpoint
        const response = await axios.post('https://cc.automate8.com/api/preview/send-sms', {
          phoneNumber: testRecipient,
          workspaceId: currentWorkspace.id,
          previewText: content.body
        });
        
        if (response.data.success) {
          setFeedbackMessage(`Test SMS sent to ${testRecipient}`);
          setIsError(false);
          // Reset field after successful send
          setTestRecipient('');
        } else {
          throw new Error(response.data.error || 'Failed to send test SMS');
        }
      } else {
        // For email, we'll implement this later or use a different endpoint
        setFeedbackMessage(`Test email functionality coming soon`);
        setIsError(false);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setFeedbackMessage(error.message || 'Failed to send test message');
      setIsError(true);
    } finally {
      setIsSending(false);
      
      // Clear feedback message after a delay
      setTimeout(() => {
        setFeedbackMessage('');
      }, 5000);
    }
  };
  
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderSmsPreview = () => (
    <PreviewColumn>
      <DeviceTitle>SMS Preview</DeviceTitle>
      <PhoneFrame>
        <PhoneHeader>
          SMS
        </PhoneHeader>
        <MessageContainer>
          <TimeStamp>Today {formatDate()}</TimeStamp>
          <MessageBubble>
            {content.body}
          </MessageBubble>
        </MessageContainer>
      </PhoneFrame>
    </PreviewColumn>
  );
  
  const renderEmailPreview = () => (
    <PreviewColumn>
      <DeviceTitle>Email Preview</DeviceTitle>
      <EmailPreviewContainer>
        <EmailHeader>
          <EmailSubject>{content.subject}</EmailSubject>
          <EmailMetadata>Today at {formatDate()}</EmailMetadata>
        </EmailHeader>
        <EmailBody dangerouslySetInnerHTML={{ __html: content.body }} />
      </EmailPreviewContainer>
    </PreviewColumn>
  );
  
  const renderTestForm = () => (
    <TestColumn>
      <TestMessageSection>
        <TestMessageTitle>Send a Test {type.toUpperCase()}</TestMessageTitle>
        <TestMessageForm onSubmit={handleSendTest}>
          <InputWrapper>
            <InputField 
              type="text" 
              placeholder={type === 'sms' ? "Enter phone number" : "Enter email address"}
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
            />
            <SendTestButton type="submit" disabled={isSending}>
              <FaPaperPlane size={12} /> Send Test
            </SendTestButton>
          </InputWrapper>
          {type === 'sms' && (
            <PhoneFormatNote>
              Format: +1XXXXXXXXXX (e.g., +16267888830) or 10-digit number (e.g., 6267888830)
            </PhoneFormatNote>
          )}
        </TestMessageForm>
        
        {feedbackMessage && (
          <FeedbackMessage isError={isError}>
            {feedbackMessage}
          </FeedbackMessage>
        )}
      </TestMessageSection>
    </TestColumn>
  );
  
  return (
    <Container>
      <Title>Preview & Test</Title>
      <Subtitle>Preview your {type} and send a test before finalizing</Subtitle>
      
      <ContentLayout>
        {type === 'sms' ? renderSmsPreview() : renderEmailPreview()}
        {renderTestForm()}
      </ContentLayout>
    </Container>
  );
};

export default BroadcastPreview;