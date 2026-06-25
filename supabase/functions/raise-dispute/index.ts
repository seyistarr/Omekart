// supabase/functions/raise-dispute/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { order_id, reason, ticket_id, user_id: providedUserId } = await req.json();

    if (!order_id || !reason) {
      return new Response(JSON.stringify({ error: "order_id and reason required" }), { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401 });
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

    // 1. Check order exists and is completed
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, business_id, status")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    if (order.status !== "completed") {
      return new Response(JSON.stringify({ error: "Only completed orders can be disputed" }), { status: 400 });
    }

    // 2. Verify user is the buyer
    if (order.buyer_id !== user_id) {
      return new Response(JSON.stringify({ error: "Only the buyer can raise a dispute" }), { status: 403 });
    }

    // 3. Check if dispute already exists
    const { data: existing } = await supabase
      .from("disputes")
      .select("id, status")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        error: "A dispute already exists for this order",
        dispute_id: existing.id,
        status: existing.status
      }), { status: 400 });
    }

    // 4. Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .insert({
        order_id,
        ticket_id: ticket_id || null,
        raised_by: user_id,
        reason,
        status: "OPEN"
      })
      .select()
      .single();

    if (disputeError) throw disputeError;

    // 5. Notify admins (insert into notifications table – we'll implement later)
    // For now, just log the event

    return new Response(JSON.stringify({
      success: true,
      dispute
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});