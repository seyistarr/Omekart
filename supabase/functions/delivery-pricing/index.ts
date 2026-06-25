// supabase/functions/delivery-pricing/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ------------------------------------------------------------------
// 1. HAVERSINE FORMULA (Calculate distance in km between two points)
// ------------------------------------------------------------------
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// ------------------------------------------------------------------
// 2. GEOCODING: Nominatim (Primary, Free)
// ------------------------------------------------------------------
async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Omekart-MVP/1.0' // Be polite to OSM servers
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Nominatim geocoding failed:', error);
    return null;
  }
}

// ------------------------------------------------------------------
// 3. GEOCODING: Mapbox (Fallback, requires API key)
// ------------------------------------------------------------------
async function geocodeWithMapbox(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Mapbox geocoding failed:', error);
    return null;
  }
}

// ------------------------------------------------------------------
// 4. MAIN EDGE FUNCTION HANDLER
// ------------------------------------------------------------------
Deno.serve(async (req) => {
  try {
    // --- Parse request body ---
    const { business_id, buyer_address, buyer_lat, buyer_lng } = await req.json();

    // Validate input
    if (!business_id) {
      return new Response(JSON.stringify({ error: "business_id is required" }), { status: 400 });
    }

    let buyerCoords: { lat: number; lng: number } | null = null;

    // If coordinates are provided directly, use them
    if (buyer_lat !== undefined && buyer_lng !== undefined) {
      buyerCoords = { lat: buyer_lat, lng: buyer_lng };
    } 
    // Otherwise, geocode the address
    else if (buyer_address) {
      // Try Nominatim first
      buyerCoords = await geocodeWithNominatim(buyer_address);
      
      // If Nominatim fails, fallback to Mapbox
      if (!buyerCoords) {
        const mapboxKey = Deno.env.get("MAPBOX_API_KEY");
        if (mapboxKey) {
          buyerCoords = await geocodeWithMapbox(buyer_address, mapboxKey);
        }
      }

      if (!buyerCoords) {
        return new Response(JSON.stringify({
          error: "Could not geocode the buyer's address. Please provide coordinates or check the address."
        }), { status: 400 });
      }
    } else {
      return new Response(JSON.stringify({
        error: "Either buyer_address or (buyer_lat + buyer_lng) must be provided."
      }), { status: 400 });
    }

    // --- Initialize Supabase client ---
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Fetch business details (store location + delivery config) ---
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, store_lat, store_lng, delivery_config")
      .eq("id", business_id)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: "Business not found" }), { status: 404 });
    }

    // Validate that the store has coordinates set
    if (!business.store_lat || !business.store_lng) {
      return new Response(JSON.stringify({
        error: "Store location not configured. Seller must set their store location first."
      }), { status: 400 });
    }

    // --- Calculate distance ---
    const distanceKm = haversineDistance(
      buyerCoords.lat,
      buyerCoords.lng,
      business.store_lat,
      business.store_lng
    );

    // --- Parse delivery config ---
    const config = business.delivery_config || { fee_type: "fixed", base_fee: 1500, radius_km: 10 };
    const radiusKm = config.radius_km || 10;
    const feeType = config.fee_type || "fixed";
    const baseFee = config.base_fee || 0;
    const feePerKm = config.fee_per_km || 0;

    // --- Check eligibility (within radius) ---
    const eligible = distanceKm <= radiusKm;

    // --- Calculate fee ---
    let fee = 0;
    if (eligible) {
      switch (feeType) {
        case "fixed":
          fee = baseFee;
          break;
        case "distance":
          fee = baseFee + (feePerKm * distanceKm);
          break;
        case "free":
          fee = 0;
          break;
        default:
          fee = baseFee;
      }
    }

    // --- Return response ---
    return new Response(JSON.stringify({
      success: true,
      distance_km: Math.round(distanceKm * 100) / 100,
      eligible: eligible,
      radius_km: radiusKm,
      fee_type: feeType,
      delivery_fee: Math.round(fee * 100) / 100,
      store_location: {
        lat: business.store_lat,
        lng: business.store_lng
      },
      buyer_location: buyerCoords,
      message: eligible ? "Delivery available" : "Outside delivery radius"
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});