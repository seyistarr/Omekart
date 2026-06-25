// supabase/functions/create-checkout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Omekart-MVP/1.0' }
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
    console.error('Geocoding failed:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const { 
      vertical,
      buyer_address, 
      buyer_lat, 
      buyer_lng,
      user_id: providedUserId,
      delivery_method = 'home_delivery'
    } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let user_id = providedUserId;
    if (!user_id) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (token === serviceRoleKey) {
          return new Response(JSON.stringify({ 
            error: "When using service role key, you must provide 'user_id' in the request body." 
          }), { status: 400 });
        }
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
      }
      user_id = user.id;
    }

    // --- 1. Get the user's cart ---
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id, vertical")
      .eq("buyer_id", user_id)
      .eq("vertical", vertical)
      .maybeSingle();

    if (cartError || !cart) {
      return new Response(JSON.stringify({ error: "Cart not found" }), { status: 404 });
    }

    // --- 2. Get cart items with product details ---
    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select("*, catalog_items!inner(id, name, price, product_type, business_id, images, stock_quantity)")
      .eq("cart_id", cart.id);

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400 });
    }

    // --- 3. Validate stock availability BEFORE creating checkout ---
    for (const item of items) {
      const stockQty = item.catalog_items.stock_quantity || 0;
      if (stockQty < item.quantity) {
        return new Response(JSON.stringify({
          error: `Insufficient stock for "${item.catalog_items.name}". Available: ${stockQty}, Requested: ${item.quantity}.`
        }), { status: 400 });
      }
    }

    // --- 4. Validate all items belong to the same business ---
    const businessIds = [...new Set(items.map(item => item.catalog_items.business_id))];
    if (businessIds.length > 1) {
      return new Response(JSON.stringify({
        error: "Your cart contains items from multiple sellers. Please checkout each seller separately."
      }), { status: 400 });
    }
    const businessId = businessIds[0];

    // --- 5. Get business details ---
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, store_lat, store_lng, delivery_config")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: "Business not found" }), { status: 404 });
    }

    // --- 6. Get buyer location ---
    let buyerCoords: { lat: number; lng: number } | null = null;

    if (buyer_lat !== undefined && buyer_lng !== undefined) {
      buyerCoords = { lat: buyer_lat, lng: buyer_lng };
    } else if (buyer_address) {
      buyerCoords = await geocodeAddress(buyer_address);
    }

    if (!buyerCoords) {
      return new Response(JSON.stringify({ 
        error: "Buyer location not provided or could not be geocoded."
      }), { status: 400 });
    }

    // --- 7. Calculate distance and delivery fee ---
    let deliveryFee = 0;
    let distanceKm = 0;
    let eligible = true;

    const config = business.delivery_config || { fee_type: "fixed", base_fee: 1500, radius_km: 10 };
    const radiusKm = config.radius_km || 10;
    const feeType = config.fee_type || "fixed";
    const baseFee = config.base_fee || 0;
    const feePerKm = config.fee_per_km || 0;

    if (business.store_lat && business.store_lng) {
      distanceKm = haversineDistance(
        buyerCoords.lat,
        buyerCoords.lng,
        business.store_lat,
        business.store_lng
      );
      eligible = distanceKm <= radiusKm;

      if (eligible && delivery_method === 'home_delivery') {
        switch (feeType) {
          case "fixed": deliveryFee = baseFee; break;
          case "distance": deliveryFee = baseFee + (feePerKm * distanceKm); break;
          case "free": deliveryFee = 0; break;
          default: deliveryFee = baseFee;
        }
      } else if (delivery_method === 'pickup') {
        deliveryFee = 0;
      }
    }

    if (!eligible) {
      return new Response(JSON.stringify({
        error: "Outside delivery radius",
        distance_km: Math.round(distanceKm * 100) / 100,
        radius_km: radiusKm
      }), { status: 400 });
    }

    // --- 8. Calculate subtotal and total ---
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalAmount = subtotal + deliveryFee;

    // --- 9. Create checkout session ---
    const { data: checkout, error: checkoutError } = await supabase
      .from("checkout_sessions")
      .insert({
        buyer_id: user_id,
        cart_id: cart.id,
        status: 'active',
        quote_valid_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        delivery_distance_km: Math.round(distanceKm * 100) / 100,
        delivery_method: delivery_method,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (checkoutError) throw checkoutError;

    // --- 10. RESERVE STOCK for each item (Engine Section 5) ---
    // This is the CRITICAL step that prevents overselling
    const reservations = [];
    for (const item of items) {
      const { data: reserveResult, error: reserveError } = await supabase.rpc(
        'reserve_stock',
        {
          p_item_id: item.catalog_item_id,
          p_quantity: item.quantity,
          p_session_id: checkout.id
        }
      );

      if (reserveError || !reserveResult) {
        // If stock reservation fails, we need to rollback all previous reservations.
        // Since we're in an Edge Function, we need to manually release what we reserved.
        // For simplicity, we'll call the release function and return an error.
        if (reservations.length > 0) {
          // Release all previously reserved stock for this session
          await supabase.rpc('release_stock_for_session', { p_session_id: checkout.id });
        }
        // Delete the checkout session
        await supabase.from("checkout_sessions").delete().eq("id", checkout.id);
        return new Response(JSON.stringify({
          error: `Failed to reserve stock for "${item.catalog_items.name}". Please try again.`
        }), { status: 400 });
      }
      reservations.push({ item_id: item.catalog_item_id, quantity: item.quantity });
    }

    // --- 11. Return response ---
    return new Response(JSON.stringify({
      success: true,
      message: "Checkout session created. Stock reserved for 15 minutes.",
      checkout: checkout,
      breakdown: {
        items: items.map(item => ({
          id: item.catalog_items.id,
          name: item.catalog_items.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.unit_price * item.quantity,
          images: item.catalog_items.images
        })),
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: totalAmount,
        distance_km: Math.round(distanceKm * 100) / 100,
        business_name: business.name,
        delivery_method: delivery_method
      }
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});