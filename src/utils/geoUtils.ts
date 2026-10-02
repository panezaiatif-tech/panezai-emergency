import { Coordinates } from '../types/emergency.ts';

// Known centroids for auto-detecting closest district/city
export const PAKISTAN_MAJOR_CITIES = [
  { city: 'Quetta', district: 'Quetta', province: 'Balochistan', lat: 30.1798, lng: 66.9750 },
  { city: 'Pishin', district: 'Pishin', province: 'Balochistan', lat: 30.5815, lng: 66.9961 },
  { city: 'Chaman', district: 'Chaman', province: 'Balochistan', lat: 30.9210, lng: 66.4597 },
  { city: 'Gwadar', district: 'Gwadar', province: 'Balochistan', lat: 25.1264, lng: 62.3226 },
  { city: 'Khuzdar', district: 'Khuzdar', province: 'Balochistan', lat: 27.8105, lng: 66.6178 },
  { city: 'Turbat', district: 'Turbat (Kech)', province: 'Balochistan', lat: 26.0031, lng: 63.0544 },
  { city: 'Hub', district: 'Hub', province: 'Balochistan', lat: 24.9982, lng: 66.8833 },
  { city: 'Zhob', district: 'Zhob', province: 'Balochistan', lat: 31.3411, lng: 69.4493 },
  { city: 'Ziarat', district: 'Ziarat', province: 'Balochistan', lat: 30.3824, lng: 67.7289 },
  { city: 'Karachi', district: 'Karachi South', province: 'Sindh', lat: 24.8607, lng: 67.0011 },
  { city: 'Hyderabad', district: 'Hyderabad', province: 'Sindh', lat: 25.3960, lng: 68.3578 },
  { city: 'Sukkur', district: 'Sukkur', province: 'Sindh', lat: 27.7052, lng: 68.8574 },
  { city: 'Larkana', district: 'Larkana', province: 'Sindh', lat: 27.5598, lng: 68.2120 },
  { city: 'Lahore', district: 'Lahore', province: 'Punjab', lat: 31.5204, lng: 74.3587 },
  { city: 'Rawalpindi', district: 'Rawalpindi', province: 'Punjab', lat: 33.5989, lng: 73.0441 },
  { city: 'Faisalabad', district: 'Faisalabad', province: 'Punjab', lat: 31.4504, lng: 73.1350 },
  { city: 'Multan', district: 'Multan', province: 'Punjab', lat: 30.1575, lng: 71.5249 },
  { city: 'Gujranwala', district: 'Gujranwala', province: 'Punjab', lat: 32.1877, lng: 74.1945 },
  { city: 'Sialkot', district: 'Sialkot', province: 'Punjab', lat: 32.4945, lng: 74.5229 },
  { city: 'Bahawalpur', district: 'Bahawalpur', province: 'Punjab', lat: 29.3956, lng: 71.6836 },
  { city: 'Dera Ghazi Khan', district: 'Dera Ghazi Khan', province: 'Punjab', lat: 30.0561, lng: 70.6348 },
  { city: 'Islamabad', district: 'Islamabad Capital', province: 'Islamabad Capital Territory', lat: 33.6844, lng: 73.0479 },
  { city: 'Peshawar', district: 'Peshawar', province: 'Khyber Pakhtunkhwa', lat: 34.0151, lng: 71.5249 },
  { city: 'Abbottabad', district: 'Abbottabad', province: 'Khyber Pakhtunkhwa', lat: 34.1688, lng: 73.2215 },
  { city: 'Swat', district: 'Swat', province: 'Khyber Pakhtunkhwa', lat: 34.7750, lng: 72.3620 },
  { city: 'Chitral', district: 'Chitral Upper', province: 'Khyber Pakhtunkhwa', lat: 35.8510, lng: 71.7860 },
  { city: 'Muzaffarabad', district: 'Muzaffarabad', province: 'Azad Jammu & Kashmir', lat: 34.3700, lng: 73.4700 },
  { city: 'Mirpur', district: 'Mirpur', province: 'Azad Jammu & Kashmir', lat: 33.1480, lng: 73.7510 },
  { city: 'Gilgit', district: 'Gilgit', province: 'Gilgit-Baltistan', lat: 35.9208, lng: 74.3144 },
  { city: 'Skardu', district: 'Skardu', province: 'Gilgit-Baltistan', lat: 35.2970, lng: 75.6330 },
  { city: 'Hunza', district: 'Hunza', province: 'Gilgit-Baltistan', lat: 36.3110, lng: 74.6190 },
];

/**
 * Calculates distance in kilometers between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Find closest city in Pakistan based on raw GPS coordinates
 */
export function findClosestPakistanCity(currentCoord: Coordinates) {
  let closest = PAKISTAN_MAJOR_CITIES[0];
  let minDistance = calculateHaversineDistance(currentCoord, {
    lat: closest.lat,
    lng: closest.lng,
  });

  for (let i = 1; i < PAKISTAN_MAJOR_CITIES.length; i++) {
    const city = PAKISTAN_MAJOR_CITIES[i];
    const dist = calculateHaversineDistance(currentCoord, {
      lat: city.lat,
      lng: city.lng,
    });
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return {
    ...closest,
    distanceKm: minDistance,
  };
}

/**
 * Format Google Maps Navigation URL
 */
export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Build emergency SMS / WhatsApp message with GPS location
 */
export function buildEmergencyLocationMessage(
  coords: Coordinates | null,
  detectedArea?: string
): string {
  const time = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  if (coords) {
    return `🚨 EMERGENCY ALERT! I need immediate help. My location is ${
      detectedArea ? detectedArea + ' - ' : ''
    }https://maps.google.com/?q=${coords.lat},${coords.lng} (Accuracy: GPS verified at ${time}). Sent via Panezai Emergency Network.`;
  }
  return `🚨 EMERGENCY ALERT! I need immediate help. Please contact emergency services (Rescue 1122 / Police 15) for me now! Sent via Panezai Emergency Network.`;
}
