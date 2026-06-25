import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { order_id, user_id: providedUserId } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400 });
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

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Check authorization
    const isBuyer = order.buyer_id === user_id;
    let isSeller = false;
    if (!isBuyer) {
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", order.business_id)
        .eq("owner_id", user_id)
        .maybeSingle();

      if (bizError) throw bizError;
      isSeller = !!business;
    }

    if (!isBuyer && !isSeller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    const { data: history, error: historyError } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", order_id)
      .order("created_at", { ascending: true });

    if (historyError) throw historyError;

    return new Response(JSON.stringify({
      success: true,
      order: order,
      history: history || [],
      is_buyer: isBuyer,
      is_seller: isSeller
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});