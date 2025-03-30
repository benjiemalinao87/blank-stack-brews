import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPaperPlane, FaClock, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import broadcastQueueService from './broadcastQueueService';
import { useToast } from '@chakra-ui/react';

const Container = styled.div`
  padding: 20px;
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

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
`;

const OptionCard = styled.div`
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.selected && `
    border: 2px solid #5b6af9;
    box-shadow: 0 4px 12px rgba(91, 106, 249, 0.15);
  `}
`;

const OptionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.selected ? '20px' : '0'};
`;

const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  background-color: ${props => props.bgColor || '#f0f0f0'};
`;

const RadioButton = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${props => props.selected ? '#5b6af9' : '#d1d1d1'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  
  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #5b6af9;
    display: ${props => props.selected ? 'block' : 'none'};
  }
`;

const OptionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
`;

const OptionDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin-top: 5px;
`;

const DateTimeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding-left: 35px;
`;

const InputField = styled.input`
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #f8f8f8;
  font-size: 14px;
  flex: 1;
  min-width: 180px;
  
  &:focus {
    outline: none;
    border-color: #5b6af9;
    box-shadow: 0 0 0 2px rgba(91, 106, 249, 0.2);
  }
`;

const Note = styled.div`
  display: flex;
  align-items: center;
  background-color: #f0f5ff;
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 30px;
  font-size: 14px;
  color: #444;
  
  svg {
    margin-right: 12px;
    min-width: 16px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 8px;
  background-color: ${props => props.primary ? '#5b6af9' : '#e0e0e0'};
  color: ${props => props.primary ? 'white' : '#333'};
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.primary ? '#4a59e8' : '#d1d1d1'};
  }
  
  svg {
    margin-right: 8px;
  }
`;

const ProgressContainer = styled.div`
  margin: 20px 0;
  padding: 15px;
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin: 10px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background-color: #5b6af9;
  transition: width 0.3s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-top: 10px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'processing':
        return 'background-color: #ebf5ff; color: #2b6cb0;';
      case 'retrying':
        return 'background-color: #fef3c7; color: #92400e;';
      case 'success':
        return 'background-color: #def7ec; color: #046c4e;';
      case 'error':
        return 'background-color: #fde8e8; color: #c81e1e;';
      default:
        return 'background-color: #f3f4f6; color: #374151;';
    }
  }}
`;

const TestButton = styled(Button)`
  background-color: #38b2ac;
  color: white;
  
  &:hover {
    background-color: #319795;
  }
`;

const BroadcastScheduler = ({ 
  scheduledDate, 
  onScheduleChange, 
  onSendNow, 
  onSchedule, 
  broadcastType, 
  broadcastContent, 
  recipients,
  workspaceId
}) => {
  const [schedulingOption, setSchedulingOption] = useState('now');
  const [selectedDateTime, setSelectedDateTime] = useState(scheduledDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const toast = useToast();
  
  // Validate required props
  React.useEffect(() => {
    if (!recipients) {
      setError('No recipients selected. Please select recipients in the Audience tab.');
      return;
    }
    if (!broadcastContent) {
      setError('No broadcast content. Please compose your message in the Compose tab.');
      return;
    }
    if (!workspaceId) {
      setError('Workspace ID is missing.');
      return;
    }
    setError(null);
  }, [recipients, broadcastContent, workspaceId]);
  
  const handleOptionChange = (option) => {
    setSchedulingOption(option);
    setError(null);
  };
  
  const handleDateTimeChange = (e) => {
    const value = e.target.value;
    setSelectedDateTime(value);
    onScheduleChange(value);
    setError(null);
  };
  
  const handleProgress = (progressData) => {
    setProgress(progressData);
    
    // Show appropriate status messages
    if (progressData.status === 'processing') {
      setError(null); // Clear any previous errors during processing
    } else if (progressData.status === 'retrying') {
      setError(`Retrying failed messages... (${progressData.retriesRemaining} attempts remaining)`);
      toast({
        title: 'Retrying failed messages',
        description: `${progressData.retriesRemaining} attempts remaining`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } else if (progressData.status === 'batch_complete') {
      if (progressData.errorCount > 0) {
        setError(`Processing: ${progressData.successCount} successful, ${progressData.errorCount} failed`);
        toast({
          title: 'Batch processing update',
          description: `${progressData.successCount} successful, ${progressData.errorCount} failed`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };
  
  const handleSend = async () => {
    // Validate required data before proceeding
    if (!recipients || recipients.length === 0) {
      setError('No recipients selected for broadcast');
      toast({
        title: 'Error',
        description: 'No recipients selected for broadcast',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!broadcastContent || !broadcastContent.body) {
      setError('Broadcast content is missing');
      toast({
        title: 'Error',
        description: 'Broadcast content is missing',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!workspaceId) {
      setError('Workspace ID is missing');
      toast({
        title: 'Error',
        description: 'Workspace ID is missing',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);
    
    try {
      // Log the payload for debugging
      console.log('Preparing broadcast for recipients:', recipients.length);
      
      // Prepare messages for all recipients
      const messages = recipients.map(recipient => {
        const message = {
          workspaceId,
          contactId: recipient.contact_id,
          broadcastId: Date.now().toString(),
          content: {
            body: broadcastContent.body
          },
          recipients: [broadcastType === 'email' ? recipient.email : recipient.phone_number],
          scheduledTime: new Date().toISOString(),
          delay: 0,
          metadata: {
            totalRecipients: recipients.length,
            broadcastType,
            recipientIndex: recipients.indexOf(recipient),
            source: 'broadcast'
          }
        };
        
        // Log the first message payload for debugging
        if (recipients.indexOf(recipient) === 0) {
          console.log('First message payload:', JSON.stringify(message, null, 2));
        }
        
        return message;
      });

      toast({
        title: 'Sending broadcast',
        description: `Processing ${recipients.length} recipients...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      let queueResponse;
      if (schedulingOption === 'now') {
        queueResponse = await broadcastQueueService.sendImmediate(broadcastType, messages, handleProgress);
      } else {
        queueResponse = await broadcastQueueService.scheduleForLater(broadcastType, messages, selectedDateTime, handleProgress);
      }

      if (queueResponse.success) {
        // Check if any messages were sent via fallback
        const fallbackCount = queueResponse.results?.filter(r => r.endpoint === 'direct').length || 0;
        const fallbackUsed = fallbackCount > 0;
        
        if (schedulingOption === 'now') {
          onSendNow(queueResponse);
          toast({
            title: 'Broadcast sent successfully',
            description: `${queueResponse.totalProcessed} messages sent${fallbackUsed ? ' (some using fallback method)' : ''}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          // Show special notification if fallback was used
          if (fallbackUsed) {
            toast({
              title: 'Fallback Method Used',
              description: `${fallbackCount} of ${queueResponse.totalProcessed} messages sent using direct method due to queue service issues.`,
              status: 'warning',
              duration: 7000,
              isClosable: true,
            });
          }
        } else {
          onSchedule(selectedDateTime, queueResponse);
          toast({
            title: 'Broadcast scheduled successfully',
            description: `${queueResponse.totalProcessed} messages scheduled for ${new Date(selectedDateTime).toLocaleString()}${fallbackUsed ? ' (some using fallback method)' : ''}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          // Show special notification if fallback was used for scheduled messages
          if (fallbackUsed) {
            toast({
              title: 'Fallback Method Used',
              description: `Some messages were scheduled using direct method due to queue service issues. This may affect scheduled delivery.`,
              status: 'warning',
              duration: 7000,
              isClosable: true,
            });
          }
        }

        // Show final status
        if (queueResponse.totalFailed > 0) {
          const statusMessage = `Broadcast complete: ${queueResponse.totalProcessed - queueResponse.totalFailed} successful, ${queueResponse.totalFailed} failed. Success rate: ${queueResponse.summary.successRate}%`;
          setError(statusMessage);
          toast({
            title: 'Broadcast completed with errors',
            description: statusMessage,
            status: 'warning',
            duration: 7000,
            isClosable: true,
          });
        }
      } else {
        setError('Failed to process broadcast. Please try again.');
        toast({
          title: 'Broadcast failed',
          description: 'Failed to process broadcast. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

    } catch (err) {
      console.error('Broadcast scheduling error:', err);
      
      // Handle specific API errors
      let errorMessage = '';
      let errorTitle = 'Broadcast Error';
      let errorStatus = 'error';
      
      // Check for specific error patterns
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        errorTitle = 'Connection Error';
        errorMessage = 'Could not connect to the broadcast service. This might be due to:' +
                       '\n1. The backend server is not running' + 
                       '\n2. There are network connectivity issues' +
                       '\nPlease check the server status and try again.';
      } else if (err.message?.includes('Supabase environment') || 
                (err.message?.includes('environment variable') && err.message?.includes('Missing'))) {
        errorTitle = 'Backend Configuration Error';
        errorMessage = 'The backend is missing required configuration. Please contact your administrator to set up the required environment variables.';
      } else if (err.name === 'ApiError') {
        errorTitle = 'API Error';
        errorMessage = `API Error: ${err.message}`;
      } else if (err.name === 'NetworkError' || err.message === 'Failed to fetch') {
        errorTitle = 'Network Error';
        errorMessage = 'Network error connecting to message service. This could be due to CORS restrictions or the service being unavailable. Your message has been saved and will be sent when connection is restored.';
      } else {
        errorMessage = err.message || 'Failed to schedule broadcast';
      }
      
      setError(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
        status: errorStatus,
        duration: 7000,
        isClosable: true,
      });
      
      // Add additional debugging info to help troubleshoot
      console.log('Debug Information:');
      console.log('Broadcast recipients:', recipients.length);
      console.log('Broadcast type:', broadcastType);
      console.log('Backend URL:', broadcastQueueService.getBackendUrl?.() || 'Not available');
      console.log('Error details:', err);
      
      // Add a suggestion for fixing backend issues
      if (errorTitle === 'Connection Error' || errorTitle === 'Backend Configuration Error') {
        console.log('Suggestion: Try starting the backend server with proper environment variables. Check the .env file.');
        
        toast({
          title: 'Troubleshooting Tips',
          description: 'Check the console for detailed error information and troubleshooting steps.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestSMS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await broadcastQueueService.testScheduleSMS();
      console.log('Test SMS scheduled:', result);
      setError(`Test SMS scheduled successfully! Queue ID: ${result.queueId}. Will be sent in 2 minutes.`);
    } catch (err) {
      setError(`Failed to schedule test SMS: ${err.message}`);
      console.error('Test SMS error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  return (
    <Container>
      <Title>Schedule Your Broadcast</Title>
      <Subtitle>Choose when to send your message</Subtitle>
      
      <RecipientCount>
        <CountNumber>{recipients?.length || 0}</CountNumber> contacts will receive this message
      </RecipientCount>
      
      {error && (
        <Note style={{ backgroundColor: '#fff2f2', color: '#e53e3e' }}>
          <FaInfoCircle color="#e53e3e" />
          {error}
        </Note>
      )}
      
      {/* Show progress during batch processing */}
      {progress && (
        <ProgressContainer>
          <div>Processing Broadcast</div>
          <ProgressBar>
            <ProgressFill progress={progress.percentComplete || 0} />
          </ProgressBar>
          <ProgressStats>
            <StatusBadge status={progress.status}>
              {progress.status === 'processing' && 'Processing...'}
              {progress.status === 'retrying' && 'Retrying Failed Messages'}
              {progress.status === 'batch_complete' && 'Batch Complete'}
            </StatusBadge>
            <span>Batch {progress.currentBatch} of {progress.totalBatches}</span>
            <span>{progress.processedMessages} of {progress.totalMessages} messages</span>
          </ProgressStats>
          {progress.status === 'retrying' && (
            <div style={{ marginTop: 10, fontSize: 14, color: '#92400e' }}>
              Retrying message for {progress.retryingRecipient}
              ({progress.retriesRemaining} attempts remaining)
            </div>
          )}
        </ProgressContainer>
      )}
      
      <OptionsContainer>
        <OptionCard 
          selected={schedulingOption === 'now'} 
          onClick={() => handleOptionChange('now')}
        >
          <OptionHeader selected={schedulingOption === 'now'}>
            <RadioButton selected={schedulingOption === 'now'} />
            <IconContainer bgColor="#e5f8f6">
              <FaPaperPlane size={16} color="#38b2ac" />
            </IconContainer>
            <OptionTitle>Send immediately</OptionTitle>
          </OptionHeader>
          
          {schedulingOption === 'now' && (
            <OptionDescription>
              Your broadcast will be sent as soon as you confirm
            </OptionDescription>
          )}
        </OptionCard>
        
        <OptionCard 
          selected={schedulingOption === 'later'} 
          onClick={() => handleOptionChange('later')}
        >
          <OptionHeader selected={schedulingOption === 'later'}>
            <RadioButton selected={schedulingOption === 'later'} />
            <IconContainer bgColor="#e7effd">
              <FaClock size={16} color="#5b6af9" />
            </IconContainer>
            <OptionTitle>Schedule for later</OptionTitle>
          </OptionHeader>
          
          {schedulingOption === 'later' && (
            <>
              <OptionDescription>
                Set a specific date and time for your broadcast to be sent
              </OptionDescription>
              <DateTimeContainer>
                <InputField 
                  type="datetime-local" 
                  value={selectedDateTime}
                  min={getMinDateTime()}
                  onChange={handleDateTimeChange}
                />
              </DateTimeContainer>
            </>
          )}
        </OptionCard>
      </OptionsContainer>
      
      <Note>
        <FaInfoCircle size={16} color="#5b6af9" />
        <span>
          Note: Scheduled broadcasts can be viewed and edited in the Scheduled tab.
        </span>
      </Note>
      
      <ButtonContainer>
        <Button 
          primary 
          onClick={handleSend}
          disabled={isLoading || (schedulingOption === 'later' && !selectedDateTime)}
        >
          {isLoading ? (
            'Processing...'
          ) : schedulingOption === 'now' ? (
            <>
              <FaPaperPlane size={14} />
              Send Now
            </>
          ) : (
            <>
              <FaCalendarAlt size={14} />
              Schedule Broadcast
            </>
          )}
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default BroadcastScheduler;