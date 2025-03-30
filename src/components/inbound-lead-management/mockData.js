// Add a 'contacted' field to each lead
mockLeads.forEach((lead, index) => {
  // Mark every third lead as contacted
  lead.contacted = index % 3 === 0;
}); 