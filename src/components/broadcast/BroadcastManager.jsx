import React, { useState } from 'react';
import styled from 'styled-components';
import BroadcastTypeSelector from './BroadcastTypeSelector';
import AudienceSegmentImplementation from './AudienceSegmentImplementation';
import BroadcastComposer from './BroadcastComposer';
import BroadcastPreview from './BroadcastPreview';
import BroadcastScheduler from './BroadcastScheduler';
import BroadcastTracking from './BroadcastTracking';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const StepContainer = styled.div`
  margin-bottom: 30px;
  flex-grow: 1;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
`;

const NavButton = styled.button`
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.primary ? `
    background-color: #6366f1;
    color: white;
    border: none;
    
    &:hover {
      background-color: #4f46e5;
    }

    &:disabled {
      background-color: rgba(99, 102, 241, 0.5);
      cursor: not-allowed;
    }
  ` : `
    background-color: #f5f5f7;
    color: #374151;
    border: none;
    
    &:hover {
      background-color: #e8e8ed;
    }
  `}
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const StepDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#6366f1' : '#e0e0e0'};
  margin: 0 5px;
  
  ${props => props.active && `
    width: 20px;
    border-radius: 10px;
    transition: width 0.3s ease;
  `}
`;

const STEPS = {
  DASHBOARD: 0,
  AUDIENCE: 1,
  COMPOSE: 2,
  PREVIEW: 3,
  SCHEDULE: 4,
  TRACKING: 5
};

const BroadcastManager = () => {
  const [currentStep, setCurrentStep] = useState(STEPS.DASHBOARD);
  const [broadcastData, setBroadcastData] = useState({
    type: null,          // 'sms' or 'email'
    audience: {
      filters: [],       // Array of filter conditions
      estimatedRecipients: 0,
      recipients: []     // Full recipient data from Supabase
    },
    content: {           // Message content
      subject: '',       // For email only
      body: ''
    },
    scheduling: {
      option: 'now',     // 'now' or 'later'
      dateTime: null     // For scheduled broadcasts
    }
  });
  
  const updateBroadcastData = (key, value) => {
    setBroadcastData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case STEPS.DASHBOARD:
        return !!broadcastData.type;
      case STEPS.AUDIENCE:
        return broadcastData.audience && broadcastData.audience.recipients && broadcastData.audience.recipients.length > 0;
      case STEPS.COMPOSE:
        if (broadcastData.type === 'email') {
          return broadcastData.content.subject && broadcastData.content.body;
        }
        return !!broadcastData.content.body;
      case STEPS.PREVIEW:
        return true; // Can always proceed from preview
      case STEPS.SCHEDULE:
        return true; // Validation handled in scheduler component
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSelectType = (type) => {
    updateBroadcastData('type', type);
  };
  
  const handleStartNewCampaign = () => {
    if (broadcastData.type) {
      setCurrentStep(STEPS.AUDIENCE);
    }
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.DASHBOARD:
        return (
          <BroadcastTypeSelector
            selectedType={broadcastData.type}
            onSelect={handleSelectType}
            onContinue={handleStartNewCampaign}
          />
        );
      case STEPS.AUDIENCE:
        return (
          <AudienceSegmentImplementation
            onAudienceChange={(audienceData) => {
              updateBroadcastData('audience', {
                filters: audienceData.filters,
                estimatedRecipients: audienceData.estimatedRecipients,
                recipients: audienceData.recipients
              });
            }}
          />
        );
      case STEPS.COMPOSE:
        return (
          <BroadcastComposer
            type={broadcastData.type}
            content={broadcastData.content}
            onContentChange={(content) => updateBroadcastData('content', content)}
            recipientCount={broadcastData.audience.estimatedRecipients}
          />
        );
      case STEPS.PREVIEW:
        return (
          <BroadcastPreview
            type={broadcastData.type}
            content={broadcastData.content}
            audience={broadcastData.audience.recipients}
          />
        );
      case STEPS.SCHEDULE:
        return (
          <BroadcastScheduler
            broadcastType={broadcastData.type}
            broadcastContent={broadcastData.content}
            recipients={broadcastData.audience.recipients}
            workspaceId="66338" // TODO: Get from context/props
            scheduledDate={broadcastData.scheduling.dateTime}
            onScheduleChange={(dateTime) => 
              updateBroadcastData('scheduling', { ...broadcastData.scheduling, dateTime })
            }
            onSendNow={(response) => {
              updateBroadcastData('queueResponse', response);
              setCurrentStep(STEPS.TRACKING);
            }}
            onSchedule={(dateTime, response) => {
              updateBroadcastData('scheduling', { 
                ...broadcastData.scheduling, 
                dateTime,
                queueResponse: response 
              });
              setCurrentStep(STEPS.TRACKING);
            }}
          />
        );
      case STEPS.TRACKING:
        return (
          <BroadcastTracking
            broadcastData={broadcastData}
          />
        );
      default:
        return null;
    }
  };

  // Don't show navigation for dashboard step
  const showNavigation = currentStep !== STEPS.DASHBOARD && currentStep !== STEPS.TRACKING;

  return (
    <Container>
      {currentStep !== STEPS.DASHBOARD && (
        <StepIndicator>
          {Object.values(STEPS).slice(1).map((step, index) => (
            <StepDot key={step} active={currentStep === step} />
          ))}
        </StepIndicator>
      )}
      
      <StepContainer>
        {renderCurrentStep()}
      </StepContainer>
      
      {showNavigation && (
        <NavigationContainer>
          {currentStep > STEPS.AUDIENCE && (
            <NavButton onClick={handleBack}>
              Back
            </NavButton>
          )}
          
          {currentStep !== STEPS.SCHEDULE && (
            <NavButton 
              primary
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
            >
              Next
            </NavButton>
          )}
        </NavigationContainer>
      )}
    </Container>
  );
};

export default BroadcastManager; 