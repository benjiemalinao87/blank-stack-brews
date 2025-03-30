export const LEADERBOARD_CATEGORIES = {
  TEXT_CHAMPIONS: {
    id: 'text_champions',
    title: 'Text Champions',
    description: 'Top performers in messaging and customer engagement',
    metrics: [
      { key: 'responses', label: 'Responses', format: 'number' },
      { key: 'contacts_handled', label: 'Contacts', format: 'number' },
      { key: 'conversations_closed', label: 'Closed', format: 'number' },
      { key: 'response_rate', label: 'Response Rate', format: 'percentage' },
      { key: 'avg_response_time', label: 'Avg Response', format: 'duration' }
    ]
  },
  CALL_MASTERS: {
    id: 'call_masters',
    title: 'Call Masters',
    description: 'Excellence in call handling and customer support',
    metrics: [
      { key: 'total_calls', label: 'Total Calls', format: 'number' },
      { key: 'inbound_calls', label: 'Inbound', format: 'number' },
      { key: 'outbound_calls', label: 'Outbound', format: 'number' },
      { key: 'call_success_rate', label: 'Success Rate', format: 'percentage' },
      { key: 'avg_duration', label: 'Avg Duration', format: 'duration' }
    ]
  }
};