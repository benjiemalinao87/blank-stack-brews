/**
 * List of common timezones with their UTC offsets
 */

const timezones = [
  { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island', offset: -11 },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii', offset: -10 },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska', offset: -9 },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)', offset: -8 },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)', offset: -7 },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)', offset: -6 },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)', offset: -5 },
  { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)', offset: -4 },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires', offset: -3 },
  { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) Mid-Atlantic', offset: -2 },
  { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores', offset: -1 },
  { value: 'Europe/London', label: '(UTC+00:00) London, Dublin', offset: 0 },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Amsterdam', offset: 1 },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki', offset: 2 },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow', offset: 3 },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai', offset: 4 },
  { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi', offset: 5 },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka', offset: 6 },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok', offset: 7 },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore', offset: 8 },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo', offset: 9 },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney', offset: 10 },
  { value: 'Pacific/Noumea', label: '(UTC+11:00) Noumea', offset: 11 },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland', offset: 12 }
];

export default timezones;
