import { Select } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const COMMON_TIMEZONES = [
  { value: "UTC", label: "Use Campaign Default" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska (US)" },
  { value: "America/Honolulu", label: "Hawaii (US)" },
  { value: "Europe/London", label: "London, Edinburgh" },
  { value: "Europe/Paris", label: "Paris, Berlin, Rome, Madrid" },
  { value: "Europe/Moscow", label: "Moscow, St. Petersburg" },
  { value: "Asia/Tokyo", label: "Tokyo, Osaka" },
  { value: "Asia/Shanghai", label: "Beijing, Shanghai" },
  { value: "Asia/Kolkata", label: "Mumbai, New Delhi" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland, Wellington" }
];

const NodeEditor = ({ node, updateNode, campaignId, workspaceId }) => {
  const [campaignTimezone, setCampaignTimezone] = useState('UTC');
  const [nodeSchedule, setNodeSchedule] = useState(node.schedule || { time: '09:00', type: 'fixed', timezone: 'UTC' });
  
  useEffect(() => {
    async function fetchCampaignTimezone() {
      if (campaignId && workspaceId) {
        try {
          const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('timezone')
            .eq('id', campaignId)
            .single();
            
          if (campaignError || !campaignData?.timezone) {
            const { data: workspaceData, error: workspaceError } = await supabase
              .from('workspaces')
              .select('timezone')
              .eq('id', workspaceId)
              .single();
              
            setCampaignTimezone(workspaceData?.timezone || 'UTC');
          } else {
            setCampaignTimezone(campaignData.timezone);
          }
        } catch (error) {
          console.error('Error fetching campaign timezone:', error);
        }
      }
    }
    
    fetchCampaignTimezone();
  }, [campaignId, workspaceId]);
  
  useEffect(() => {
    if (node.schedule) {
      setNodeSchedule(node.schedule);
    } else {
      setNodeSchedule({ time: '09:00', type: 'fixed', timezone: 'UTC' });
    }
  }, [node.schedule]);
  
  const handleScheduleUpdate = (field, value) => {
    const updatedSchedule = { ...nodeSchedule, [field]: value };
    setNodeSchedule(updatedSchedule);
    updateNode({ ...node, schedule: updatedSchedule });
  };

  return (
    <FormControl mt={4}>
      <FormLabel>Message Timezone</FormLabel>
      <Select
        value={nodeSchedule.timezone || 'UTC'}
        onChange={(e) => handleScheduleUpdate('timezone', e.target.value)}
      >
        {COMMON_TIMEZONES.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </Select>
      <FormHelperText>
        {nodeSchedule.timezone === 'UTC' 
          ? `Using campaign timezone: ${campaignTimezone}` 
          : `Using custom timezone: ${nodeSchedule.timezone}`}
      </FormHelperText>
    </FormControl>
  );
};

export default NodeEditor; 