import { Select } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const COMMON_TIMEZONES = [
  { value: "", label: "Use Workspace Default" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
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

const CampaignSettings = ({ campaign, updateCampaign }) => {
  const [workspaceTimezone, setWorkspaceTimezone] = useState('UTC');
  
  useEffect(() => {
    async function fetchWorkspaceTimezone() {
      if (campaign?.workspace_id) {
        try {
          const { data, error } = await supabase
            .from('workspaces')
            .select('timezone')
            .eq('id', campaign.workspace_id)
            .single();
            
          if (data && !error) {
            setWorkspaceTimezone(data.timezone || 'UTC');
          }
        } catch (error) {
          console.error('Error fetching workspace timezone:', error);
        }
      }
    }
    
    fetchWorkspaceTimezone();
  }, [campaign?.workspace_id]);

  return (
    <FormControl id="timezone" mt={4}>
      <FormLabel>Campaign Timezone</FormLabel>
      <Select
        value={campaign.timezone || ''}
        onChange={(e) => updateCampaign({ ...campaign, timezone: e.target.value })}
      >
        {COMMON_TIMEZONES.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </Select>
      <FormHelperText>
        {campaign.timezone 
          ? `Using custom timezone: ${campaign.timezone}` 
          : `Using workspace timezone: ${workspaceTimezone}`}
      </FormHelperText>
    </FormControl>
  );
};

export default CampaignSettings; 