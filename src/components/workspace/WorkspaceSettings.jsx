import { Select } from '@chakra-ui/react';

const COMMON_TIMEZONES = [
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

<FormControl id="timezone" mb={4}>
  <FormLabel>Timezone</FormLabel>
  <Select
    value={formData.timezone || 'UTC'}
    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
  >
    {COMMON_TIMEZONES.map(tz => (
      <option key={tz.value} value={tz.value}>
        {tz.label}
      </option>
    ))}
  </Select>
  <FormHelperText>
    This timezone will be used for scheduling all campaign messages
  </FormHelperText>
</FormControl> 