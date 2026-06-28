// lib/helpers/location.ts

// --- Existing functions ---
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// --- Updated Geocoding function (returns address + coordinates) ---
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; address?: string } | null> {
  try {
    // Try OpenStreetMap first (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Omekart-MVP/1.0' }
    })
    if (!response.ok) return null
    const data = await response.json()
    if (data && data.length > 0) {
      const result = data[0]
      const displayName = result.display_name || [result.name, result.city, result.state].filter(Boolean).join(', ')
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: displayName
      }
    }

    // Fallback to Mapbox if available
    const mapboxKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    if (mapboxKey) {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxKey}&limit=1`
      const mapboxResponse = await fetch(mapboxUrl)
      if (mapboxResponse.ok) {
        const mapboxData = await mapboxResponse.json()
        if (mapboxData.features && mapboxData.features.length > 0) {
          const feature = mapboxData.features[0]
          const [lng, lat] = feature.center
          return {
            lat,
            lng,
            address: feature.place_name || address
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding failed:', error)
    return null
  }
}