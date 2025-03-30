import React, { useState } from 'react';
import styled from 'styled-components';
import { FaUserFriends, FaCheck, FaEye, FaMousePointer, FaTimes, FaClock, FaInfoCircle, FaRedo } from 'react-icons/fa';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
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

const StatTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #555;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
`;

const StatSubtext = styled.div`
  font-size: 13px;
  color: ${props => props.color || '#666'};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 5px;
  }
`;

const DeliveryStatusContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #5b6af9;
  background: none;
  border: none;
  cursor: pointer;
  
  svg {
    margin-right: 5px;
  }
`;

const UpdateText = styled.span`
  font-size: 13px;
  color: #888;
  font-weight: normal;
`;

const StatusRow = styled.div`
  display: flex;
  margin-bottom: 10px;
  align-items: center;
`;

const StatusLabel = styled.div`
  width: 100px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
`;

const ProgressBarContainer = styled.div`
  flex: 1;
  height: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  margin-right: 15px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background-color: ${props => props.color};
  width: ${props => props.percentage}%;
  border-radius: 6px;
`;

const StatusCount = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  width: 60px;
  text-align: right;
`;

const ActivityContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
`;

const ActivityList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityBadge = styled.div`
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 15px;
  background-color: ${props => {
    switch(props.type) {
      case 'success': return '#e5f8f6';
      case 'info': return '#e7effd';
      case 'error': return '#fee';
      default: return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'success': return '#38b2ac';
      case 'info': return '#5b6af9';
      case 'error': return '#e53e3e';
      default: return '#666';
    }
  }};
  width: 80px;
  text-align: center;
`;

const ActivityText = styled.div`
  font-size: 14px;
  color: #444;
  flex: 1;
`;

const ActivityTime = styled.div`
  font-size: 13px;
  color: #999;
  margin-left: 15px;
`;

const Tip = styled.div`
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

const BroadcastTracking = ({ broadcastData }) => {
  const [lastUpdated, setLastUpdated] = useState('2 minutes ago');
  
  // Dummy data for UI demonstration
  const trackingData = {
    recipients: 1248,
    recipientsChange: 23,
    delivered: 1143,
    deliveredRate: 91.6,
    opens: 876,
    openRate: 76.6,
    clicks: 342,
    clickRate: 39.0,
    status: {
      delivered: 1143,
      failed: 87,
      pending: 18
    },
    activity: [
      { type: 'success', text: 'Delivery complete', time: '2 minutes ago' },
      { type: 'info', text: 'First responses received', time: '5 minutes ago' },
      { type: 'info', text: 'Broadcast started', time: '7 minutes ago' },
      { type: 'info', text: 'Broadcast scheduled', time: '10 minutes ago' }
    ]
  };
  
  const handleRefresh = () => {
    // In a real implementation, this would refresh data from API
    setLastUpdated('Just now');
  };
  
  return (
    <Container>
      <Title>Delivery Tracking</Title>
      <Subtitle>Monitor the performance of your broadcast</Subtitle>
      
      <StatsContainer>
        <StatCard>
          <StatHeader>
            <IconContainer bgColor="#e7effd">
              <FaUserFriends size={18} color="#5b6af9" />
            </IconContainer>
            <StatTitle>Recipients</StatTitle>
          </StatHeader>
          <StatValue>{trackingData.recipients.toLocaleString()}</StatValue>
          <StatSubtext color="#4caf50">
            ▲ {trackingData.recipientsChange}%
          </StatSubtext>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <IconContainer bgColor="#e5f8f6">
              <FaCheck size={18} color="#38b2ac" />
            </IconContainer>
            <StatTitle>Delivered</StatTitle>
          </StatHeader>
          <StatValue>{trackingData.delivered.toLocaleString()}</StatValue>
          <StatSubtext>
            {trackingData.deliveredRate}% success rate
          </StatSubtext>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <IconContainer bgColor="#edf2ff">
              <FaEye size={18} color="#667eea" />
            </IconContainer>
            <StatTitle>Opens</StatTitle>
          </StatHeader>
          <StatValue>{trackingData.opens.toLocaleString()}</StatValue>
          <StatSubtext>
            {trackingData.openRate}% open rate
          </StatSubtext>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <IconContainer bgColor="#fff5f5">
              <FaMousePointer size={18} color="#f56565" />
            </IconContainer>
            <StatTitle>Clicks</StatTitle>
          </StatHeader>
          <StatValue>{trackingData.clicks.toLocaleString()}</StatValue>
          <StatSubtext>
            {trackingData.clickRate}% click rate
          </StatSubtext>
        </StatCard>
      </StatsContainer>
      
      <DeliveryStatusContainer>
        <SectionTitle>
          Delivery Status
          <UpdateText>Updated {lastUpdated} <RefreshButton onClick={handleRefresh}><FaRedo size={12} /> Refresh</RefreshButton></UpdateText>
        </SectionTitle>
        
        <StatusRow>
          <StatusLabel>
            <FaCheck size={14} color="#38b2ac" /> Delivered
          </StatusLabel>
          <ProgressBarContainer>
            <ProgressBar percentage={(trackingData.status.delivered / trackingData.recipients) * 100} color="#38b2ac" />
          </ProgressBarContainer>
          <StatusCount>{trackingData.status.delivered}</StatusCount>
        </StatusRow>
        
        <StatusRow>
          <StatusLabel>
            <FaTimes size={14} color="#e53e3e" /> Failed
          </StatusLabel>
          <ProgressBarContainer>
            <ProgressBar percentage={(trackingData.status.failed / trackingData.recipients) * 100} color="#e53e3e" />
          </ProgressBarContainer>
          <StatusCount>{trackingData.status.failed}</StatusCount>
        </StatusRow>
        
        <StatusRow>
          <StatusLabel>
            <FaClock size={14} color="#ed8936" /> Pending
          </StatusLabel>
          <ProgressBarContainer>
            <ProgressBar percentage={(trackingData.status.pending / trackingData.recipients) * 100} color="#ed8936" />
          </ProgressBarContainer>
          <StatusCount>{trackingData.status.pending}</StatusCount>
        </StatusRow>
      </DeliveryStatusContainer>
      
      <ActivityContainer>
        <SectionTitle>Recent Activity</SectionTitle>
        <ActivityList>
          {trackingData.activity.map((activity, index) => (
            <ActivityItem key={index}>
              <ActivityBadge type={activity.type}>
                {activity.type}
              </ActivityBadge>
              <ActivityText>{activity.text}</ActivityText>
              <ActivityTime>{activity.time}</ActivityTime>
            </ActivityItem>
          ))}
        </ActivityList>
      </ActivityContainer>
      
      <Tip>
        <FaInfoCircle size={16} color="#5b6af9" />
        <span>
          Pro tip: Check back in 24 hours to see complete engagement metrics.
        </span>
      </Tip>
    </Container>
  );
};

export default BroadcastTracking; 