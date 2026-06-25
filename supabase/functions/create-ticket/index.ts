// supabase/functions/create-ticket/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { order_id, subject, message, user_id: providedUserId } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401 });

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

    // 1. Validate Order ownership (user must be buyer OR seller)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("buyer_id, business_id")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", order.business_id)
      .maybeSingle();

    const isBuyer = order.buyer_id === user_id;
    const isSeller = business?.owner_id === user_id;

    if (!isBuyer && !isSeller) {
      return new Response(JSON.stringify({ error: "You are not involved in this order" }), { status: 403 });
    }

    // 2. Insert Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        order_id,
        user_id,
        subject,
        status: "OPEN"
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // 3. Insert initial message
    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: user_id,
      message: message,
      is_internal: false
    });

    return new Response(JSON.stringify({
      success: true,
      ticket
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});