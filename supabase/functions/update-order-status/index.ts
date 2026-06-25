import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { order_id, new_status, reason, user_id: providedUserId } = await req.json();

    if (!order_id || !new_status) {
      return new Response(JSON.stringify({ error: "order_id and new_status required" }), { status: 400 });
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

    // Get order and verify seller
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, buyer_id, business_id")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Check if user owns the business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", order.business_id)
      .eq("owner_id", user_id)
      .maybeSingle();

    if (bizError || !business) {
      return new Response(JSON.stringify({ error: "You do not own this business" }), { status: 403 });
    }

    // Validate transition (pre-check for UX)
    const validTransitions: Record<string, string[]> = {
      'payment_confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'ready_for_pickup', 'cancelled'],
      'shipped': ['completed'],
      'ready_for_pickup': ['completed'],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(new_status)) {
      return new Response(JSON.stringify({
        error: `Invalid transition from '${order.status}' to '${new_status}'. Allowed: ${allowed.join(', ')}`
      }), { status: 400 });
    }

    // Update (DB trigger will enforce and log)
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: new_status })
      .eq("id", order_id)
      .select()
      .single();

    if (updateError) {
      if (updateError.message.includes("Invalid order status transition")) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400 });
      }
      throw updateError;
    }

    // Notify buyer (in-app)
    const statusDisplay = {
      'processing': 'is being prepared',
      'shipped': 'has been shipped',
      'ready_for_pickup': 'is ready for pickup',
      'completed': 'has been completed',
      'cancelled': 'has been cancelled'
    }[new_status] || 'has been updated';

    await supabase
      .from("notifications")
      .insert({
        user_id: order.buyer_id,
        title: `Order #${order_id.slice(0, 8)} ${new_status.replace('_', ' ')}`,
        body: `Your order ${statusDisplay}.`,
        data: {
          order_id,
          status: new_status,
          old_status: order.status
        }
      });

    // Also notify seller (optional)
    await supabase
      .from("notifications")
      .insert({
        user_id: user_id,
        title: `Order #${order_id.slice(0, 8)} updated`,
        body: `Order status changed from ${order.status} to ${new_status}.`,
        data: {
          order_id,
          status: new_status
        }
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Order status updated to '${new_status}'`,
      order: updated
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});