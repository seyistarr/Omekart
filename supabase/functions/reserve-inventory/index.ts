// supabase/functions/reserve-inventory/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { checkout_session_id, user_id: providedUserId } = await req.json();

    if (!checkout_session_id) {
      return new Response(JSON.stringify({ error: "checkout_session_id is required" }), { status: 400 });
    }

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

    // --- 1. Get the checkout session ---
    const { data: checkout, error: checkoutError } = await supabase
      .from("checkout_sessions")
      .select("*, carts(buyer_id, vertical)")
      .eq("id", checkout_session_id)
      .single();

    if (checkoutError || !checkout) {
      return new Response(JSON.stringify({ error: "Checkout session not found" }), { status: 404 });
    }

    // --- 2. Validate the checkout is active ---
    if (checkout.status !== 'active') {
      return new Response(JSON.stringify({ error: "Checkout session is not active" }), { status: 400 });
    }

    // --- 3. Get cart items with product details ---
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("*, catalog_items(id, name, stock_quantity, reserved_quantity)")
      .eq("cart_id", checkout.cart_id);

    if (cartError) throw cartError;

    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400 });
    }

    // --- 4. Use a database transaction to reserve stock (SELECT FOR UPDATE) ---
    // We'll do this in a single query using a SQL function
    const itemIds = cartItems.map(item => item.catalog_item_id);
    
    // Build the reservation query
    let allReserved = true;
    const reservationErrors = [];

    for (const item of cartItems) {
      const { data: updatedItem, error: updateError } = await supabase.rpc('reserve_stock', {
        p_item_id: item.catalog_item_id,
        p_quantity: item.quantity,
        p_checkout_session_id: checkout_session_id,
        p_user_id: user_id
      });

      if (updateError || !updatedItem) {
        allReserved = false;
        reservationErrors.push({
          item_id: item.catalog_item_id,
          name: item.catalog_items.name,
          error: updateError?.message || 'Stock reservation failed'
        });
      }
    }

    // If any reservation failed, rollback entire transaction
    if (!allReserved) {
      // Release any reservations that were made
      await supabase.rpc('release_reservations', {
        p_checkout_session_id: checkout_session_id
      });

      return new Response(JSON.stringify({
        success: false,
        message: "Insufficient stock for some items",
        errors: reservationErrors
      }), { status: 400 });
    }

    // --- 5. Update checkout session status to reserved ---
    await supabase
      .from("checkout_sessions")
      .update({ status: 'reserved' })
      .eq("id", checkout_session_id);

    return new Response(JSON.stringify({
      success: true,
      message: "Inventory reserved successfully. Proceed to payment.",
      reserved_items: cartItems.map(item => ({
        name: item.catalog_items.name,
        quantity: item.quantity
      }))
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});