// supabase/functions/paystack-init/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { checkout_session_id, user_id: providedUserId } = await req.json();

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
    let userEmail: string | null = null;

    // If user_id is provided in body, use Admin API to get user details
    if (user_id) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
      if (userError || !userData) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      }
      userEmail = userData.user.email;
    } else {
      // Otherwise, try to get user from JWT
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        // Check if token is the service role key
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (token === serviceRoleKey) {
          return new Response(JSON.stringify({
            error: "When using service role key, you must provide 'user_id' in the request body."
          }), { status: 400 });
        }
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
      }
      user_id = user.id;
      userEmail = user.email;
    }

    // 1. Fetch checkout session with cart items
    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select(`
        *,
        cart:cart_id (
          vertical,
          items:cart_items (
            catalog_item_id,
            quantity,
            unit_price,
            catalog_items: catalog_items (
              id, name, price, product_type, images, business_id
            )
          )
        )
      `)
      .eq("id", checkout_session_id)
      .eq("buyer_id", user_id)
      .eq("status", "active")
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Invalid or expired checkout session" }), { status: 404 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Checkout session expired" }), { status: 400 });
    }

    // 2. Build the snapshot
    const items = session.cart.items.map((item: any) => ({
      catalog_item_id: item.catalog_item_id,
      name: item.catalog_items.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.unit_price * item.quantity,
      images: item.catalog_items.images || []
    }));

    const snapshot = {
      items: items,
      subtotal: session.subtotal,
      delivery_fee: session.delivery_fee,
      total: session.total_amount,
      delivery_method: session.delivery_method,
      delivery_distance_km: session.delivery_distance_km,
      business_id: session.cart.items[0]?.catalog_items.business_id,
      quote_id: session.quote_id,
      created_at: new Date().toISOString()
    };

    // 3. Create a draft order (pending payment)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        checkout_session_id: session.id,
        buyer_id: user_id,
        business_id: snapshot.business_id,
        snapshot: snapshot,
        status: 'pending_payment',
        total_amount: session.total_amount,
        delivery_fee: session.delivery_fee,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Link order to checkout session
    await supabase
      .from("checkout_sessions")
      .update({ order_id: order.id })
      .eq("id", session.id);

    // 5. Initialize Paystack transaction
    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const reference = `OMK-${order.id}-${Date.now()}`;
    const amountInKobo = Math.round(session.total_amount * 100);

    const paystackPayload = {
      email: userEmail,
      amount: amountInKobo,
      reference: reference,
      callback_url: "https://omekart.com/payment/callback",
      metadata: {
        order_id: order.id,
        session_id: session.id,
        buyer_id: user_id
      }
    };

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paystackPayload)
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({
        error: "Payment initiation failed",
        details: paystackData.message
      }), { status: 500 });
    }

    // 6. Save payment reference
    await supabase
      .from("checkout_sessions")
      .update({
        payment_reference: reference,
        payment_status: 'pending'
      })
      .eq("id", session.id);

    // 7. Return payment link
    return new Response(JSON.stringify({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: reference,
      order_id: order.id,
      message: "Payment initiated. Redirect user to authorization_url."
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});