// Geocoding via Nominatim (OpenStreetMap) + Haversine distance

interface Coordinates {
  lat: number;
  lon: number;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=br&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartMenuApp/1.0" },
    });
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function getZoneFee(
  distanceKm: number,
  zone1Fee: number,
  zone2Fee: number,
  zone3Fee: number
): { zone: number; fee: number } {
  if (distanceKm <= 3) return { zone: 1, fee: zone1Fee };
  if (distanceKm <= 6) return { zone: 2, fee: zone2Fee };
  return { zone: 3, fee: zone3Fee };
}
