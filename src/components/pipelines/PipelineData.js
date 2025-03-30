export const initialPipelineData = {
  stages: {
    new: {
      id: 'new',
      title: 'New Leads',
      cards: [
        {
          id: 'card-1',
          name: 'John Smith',
          phone: '+1234567890',
          lastMessage: 'Interested in premium plan',
          time: '2h ago',
          priority: 'high'
        },
        {
          id: 'card-2',
          name: 'Sarah Johnson',
          phone: '+1987654321',
          lastMessage: 'Requesting pricing information',
          time: '3h ago',
          priority: 'medium'
        }
      ]
    },
    contact: {
      id: 'contact',
      title: 'In Contact',
      cards: [
        {
          id: 'card-3',
          name: 'Mike Wilson',
          phone: '+1122334455',
          lastMessage: 'Following up on demo',
          time: '1h ago',
          priority: 'low'
        }
      ]
    },
    qualified: {
      id: 'qualified',
      title: 'Qualified',
      cards: []
    },
    proposal: {
      id: 'proposal',
      title: 'Proposal',
      cards: [
        {
          id: 'card-4',
          name: 'Emma Davis',
          phone: '+1555666777',
          lastMessage: 'Reviewing contract',
          time: '30m ago',
          priority: 'high'
        }
      ]
    },
    closed: {
      id: 'closed',
      title: 'Closed',
      cards: []
    }
  },
  stageOrder: ['new', 'contact', 'qualified', 'proposal', 'closed']
};
