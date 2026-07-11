export type LocationPreset = {
  label: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export const locationPresets: LocationPreset[] = [
  {
    label: "Delhi, India",
    placeName: "Delhi, India",
    latitude: 28.6139,
    longitude: 77.209,
    timeZone: "Asia/Kolkata",
  },
  {
    label: "Mumbai, India",
    placeName: "Mumbai, India",
    latitude: 19.076,
    longitude: 72.8777,
    timeZone: "Asia/Kolkata",
  },
  {
    label: "Kolkata, India",
    placeName: "Kolkata, India",
    latitude: 22.5726,
    longitude: 88.3639,
    timeZone: "Asia/Kolkata",
  },
  {
    label: "Chennai, India",
    placeName: "Chennai, India",
    latitude: 13.0827,
    longitude: 80.2707,
    timeZone: "Asia/Kolkata",
  },
  {
    label: "Bengaluru, India",
    placeName: "Bengaluru, India",
    latitude: 12.9716,
    longitude: 77.5946,
    timeZone: "Asia/Kolkata",
  },
  {
    label: "Kathmandu, Nepal",
    placeName: "Kathmandu, Nepal",
    latitude: 27.7172,
    longitude: 85.324,
    timeZone: "Asia/Kathmandu",
  },
  {
    label: "London, United Kingdom",
    placeName: "London, United Kingdom",
    latitude: 51.5072,
    longitude: -0.1276,
    timeZone: "Europe/London",
  },
  {
    label: "New York, United States",
    placeName: "New York, United States",
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: "America/New_York",
  },
  {
    label: "Los Angeles, United States",
    placeName: "Los Angeles, United States",
    latitude: 34.0522,
    longitude: -118.2437,
    timeZone: "America/Los_Angeles",
  },
  {
    label: "Dubai, United Arab Emirates",
    placeName: "Dubai, United Arab Emirates",
    latitude: 25.2048,
    longitude: 55.2708,
    timeZone: "Asia/Dubai",
  },
  {
    label: "Singapore",
    placeName: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    timeZone: "Asia/Singapore",
  },
  {
    label: "Tokyo, Japan",
    placeName: "Tokyo, Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    timeZone: "Asia/Tokyo",
  },
  {
    label: "Sydney, Australia",
    placeName: "Sydney, Australia",
    latitude: -33.8688,
    longitude: 151.2093,
    timeZone: "Australia/Sydney",
  },
];
