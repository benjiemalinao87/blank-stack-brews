import React, { useState } from 'react';
import styled from 'styled-components';
import { FaEnvelope, FaComment, FaArrowRight, FaFilter, FaPlus, FaPen, FaEye, FaChevronDown } from 'react-icons/fa';

const Container = styled.div`
  padding: 24px;
  background-color: #f9fafb;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const SubHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SearchFilterContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  width: 280px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  min-width: 160px;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  svg {
    margin-left: 8px;
  }
`;

const NewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background-color: #6366f1;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #4f46e5;
  }
  
  svg {
    font-size: 16px;
  }
`;

const Table = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr 1fr 0.8fr;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
`;

const TableHeaderCell = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr 1fr 0.8fr;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const CampaignName = styled.div`
  display: flex;
  flex-direction: column;
`;

const CampaignTitle = styled.div`
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
`;

const CampaignDescription = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => {
    switch(props.status) {
      case 'ACTIVE':
        return `
          background-color: #d1fae5;
          color: #065f46;
        `;
      case 'DRAFT':
        return `
          background-color: #e5e7eb;
          color: #4b5563;
        `;
      case 'COMPLETED':
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      default:
        return `
          background-color: #e5e7eb;
          color: #4b5563;
        `;
    }
  }}
`;

const Type = styled.div`
  color: #374151;
  font-size: 14px;
`;

const Count = styled.div`
  color: #374151;
  font-size: 14px;
  font-weight: 500;
`;

const Rate = styled.div`
  color: #374151;
  font-weight: 500;
`;

const Date = styled.div`
  color: #374151;
  font-size: 14px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #6b7280;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
    color: #4b5563;
  }
`;

const TypeSelectorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const TypeSelectorModal = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 8px;
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
`;

const TypeCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const TypeCard = styled.div`
  border: 1px solid ${props => props.selected ? '#6366f1' : '#e5e7eb'};
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  background-color: ${props => props.selected ? 'rgba(237, 233, 254, 0.5)' : 'white'};
  box-shadow: ${props => props.selected ? '0 0 0 2px rgba(99, 102, 241, 0.3)' : 'none'};
  
  &:hover {
    border-color: #6366f1;
  }
`;

const IconCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background-color: ${props => props.bgColor};
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  margin-top: 8px;
`;

const SecondaryButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  margin-right: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const PrimaryButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #6366f1;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #4f46e5;
  }
  
  &:disabled {
    background-color: #a5a6f6;
    cursor: not-allowed;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  gap: 8px;
`;

const PageIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => props.active ? '#6366f1' : '#e5e7eb'};
`;

const BroadcastTypeSelector = ({ selectedType, onSelect, onContinue }) => {
  const [showModal, setShowModal] = useState(false);
  
  const sampleCampaigns = [
    {
      id: 1,
      name: 'Welcome Series',
      description: 'A 3-day welcome series for new customers',
      status: 'ACTIVE',
      type: 'Sequence',
      recipients: 152,
      openRate: '78%',
      created: '24/03/2025'
    },
    {
      id: 2,
      name: 'Product Announcement',
      description: 'New product feature announcement to all users',
      status: 'DRAFT',
      type: 'Single Broadcast',
      recipients: 0,
      openRate: '0%',
      created: '23/03/2025'
    },
    {
      id: 3,
      name: 'Special Offer - March',
      description: 'Limited time offer for premium customers',
      status: 'COMPLETED',
      type: 'Single Broadcast',
      recipients: 250,
      openRate: '62%',
      created: '15/03/2025'
    }
  ];
  
  const handleNewCampaign = () => {
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  const handleContinue = () => {
    onContinue();
    setShowModal(false);
  };

  return (
    <Container>
      <Header>
        <Title>Campaigns</Title>
      </Header>
      
      <SubHeader>
        <SearchFilterContainer>
          <SearchInput placeholder="Search campaigns..." />
          <FilterButton>
            All Statuses
            <FaChevronDown size={12} />
          </FilterButton>
        </SearchFilterContainer>
        
        <NewButton onClick={handleNewCampaign}>
          <FaPlus />
          New Campaign
        </NewButton>
      </SubHeader>
      
      <Table>
        <TableHeader>
          <TableHeaderCell>NAME</TableHeaderCell>
          <TableHeaderCell>STATUS</TableHeaderCell>
          <TableHeaderCell>TYPE</TableHeaderCell>
          <TableHeaderCell>RECIPIENTS</TableHeaderCell>
          <TableHeaderCell>OPEN RATE</TableHeaderCell>
          <TableHeaderCell>CREATED</TableHeaderCell>
          <TableHeaderCell>ACTIONS</TableHeaderCell>
        </TableHeader>
        
        {sampleCampaigns.map(campaign => (
          <TableRow key={campaign.id}>
            <CampaignName>
              <CampaignTitle>{campaign.name}</CampaignTitle>
              <CampaignDescription>{campaign.description}</CampaignDescription>
            </CampaignName>
            <Status status={campaign.status}>{campaign.status}</Status>
            <Type>{campaign.type}</Type>
            <Count>{campaign.recipients}</Count>
            <Rate>{campaign.openRate}</Rate>
            <Date>{campaign.created}</Date>
            <ActionButtons>
              <ActionButton>
                <FaPen size={14} />
              </ActionButton>
              <ActionButton>
                <FaEye size={14} />
              </ActionButton>
            </ActionButtons>
          </TableRow>
        ))}
      </Table>
      
      {showModal && (
        <TypeSelectorOverlay>
          <TypeSelectorModal>
            <ModalHeader>Select Broadcast Type</ModalHeader>
            <ModalSubtitle>Choose the type of message you want to send to your audience</ModalSubtitle>
            
            <TypeCardsContainer>
              <TypeCard 
                selected={selectedType === 'email'} 
                onClick={() => onSelect('email')}
              >
                <IconCircle bgColor="#e7effd">
                  <FaEnvelope size={20} color="#4f46e5" />
                </IconCircle>
                <CardTitle>Email Campaign</CardTitle>
                <CardDescription>
                  Rich content with images, links, and formatting options
                </CardDescription>
              </TypeCard>
              
              <TypeCard 
                selected={selectedType === 'sms'} 
                onClick={() => onSelect('sms')}
              >
                <IconCircle bgColor="#d1fae5">
                  <FaComment size={20} color="#059669" />
                </IconCircle>
                <CardTitle>SMS Campaign</CardTitle>
                <CardDescription>
                  Direct text messages with character limits and high open rates
                </CardDescription>
              </TypeCard>
            </TypeCardsContainer>
            
            <ButtonContainer>
              <SecondaryButton onClick={handleCloseModal}>
                Cancel
              </SecondaryButton>
              <PrimaryButton 
                onClick={handleContinue}
                disabled={!selectedType}
              >
                Continue
                <FaArrowRight size={12} />
              </PrimaryButton>
            </ButtonContainer>
          </TypeSelectorModal>
        </TypeSelectorOverlay>
      )}
      
      <PaginationContainer>
        <PageIndicator active />
        <PageIndicator />
        <PageIndicator />
        <PageIndicator />
        <PageIndicator />
        <PageIndicator />
      </PaginationContainer>
    </Container>
  );
};

export default BroadcastTypeSelector; 