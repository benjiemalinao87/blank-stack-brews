# Inbound Lead Management

A comprehensive CRM queue management system for efficiently processing, tracking, and managing incoming leads.

## Features

- **Dashboard Metrics**: Real-time KPIs showing queue performance and conversion rates
- **Lead Table**: Sortable and filterable table of all leads in the system
- **Heat Map Visualization**: Visual representation of lead distribution by source and product
- **Search & Filter**: Advanced search and filtering capabilities

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- React (v17 or higher)
- Chakra UI

### Installation

The component is already integrated into the main application. No additional installation steps are required.

## Usage

The Inbound Lead Management dashboard appears automatically when the application loads. Users can:

1. View dashboard metrics at the top of the screen
2. Search and filter leads using the search bar and filter dropdown
3. Select leads by checking the checkbox next to each lead
4. View the heat map visualization by clicking the "Heat Map" button
5. Close the dashboard by clicking the X button in the top-right corner

## Component Structure

- `InboundLeadManagement.js`: Main dashboard component
- `HeatMapModal.js`: Visualization component for lead distribution
- `index.js`: Export file for the components

## Mock Data

Currently, the component uses mock data for demonstration purposes. The mock data is defined in the component files:

- `mockMetrics`: Dashboard metrics data
- `mockLeads`: Lead records data
- `mockHeatMapData`: Heat map visualization data

## Next Steps

### 1. Connect to Real Data

Replace the mock data with actual data from your API:

```javascript
// Example API integration
useEffect(() => {
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchLeads();
}, []);
```

### 2. Implement Lead Detail Sidebar

Create a new component for displaying detailed lead information:

```javascript
// LeadDetailSidebar.js
import React from 'react';
import { Box, VStack, Heading, Text } from '@chakra-ui/react';

const LeadDetailSidebar = ({ lead, onClose }) => {
  if (!lead) return null;
  
  return (
    <Box
      position="fixed"
      top={0}
      right={0}
      width="400px"
      height="100vh"
      bg="white"
      boxShadow="lg"
      zIndex={1000}
      p={4}
    >
      <Heading size="md">{lead.firstName} {lead.lastName}</Heading>
      {/* Add more lead details here */}
    </Box>
  );
};

export default LeadDetailSidebar;
```

### 3. Add Bulk Actions

Implement functionality for performing actions on multiple selected leads:

```javascript
// Example bulk action function
const handleBulkCheckout = () => {
  // API call to check out selected leads
  const selectedLeadRecords = leads.filter(lead => selectedLeads.includes(lead.id));
  // Update UI accordingly
};
```

### 4. Implement Real-time Updates

Add WebSocket connection for real-time updates:

```javascript
// Example WebSocket integration
useEffect(() => {
  const socket = new WebSocket('wss://your-api.com/leads');
  
  socket.onmessage = (event) => {
    const newLead = JSON.parse(event.data);
    setLeads(prevLeads => [newLead, ...prevLeads]);
  };
  
  return () => {
    socket.close();
  };
}, []);
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License. 