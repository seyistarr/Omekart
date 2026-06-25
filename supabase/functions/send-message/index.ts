// supabase/functions/send-message/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { ticket_id, message, is_internal, user_id: providedUserId } = await req.json();

    if (!ticket_id || !message) {
      return new Response(JSON.stringify({ error: "ticket_id and message required" }), { status: 400 });
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

    // 1. Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("user_id, assigned_to")
      .eq("id", ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404 });
    }

    // 2. Check if user is allowed to send message
    // Allow: Ticket owner, assigned admin, or any admin
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle();
    const isAdmin = !!adminProfile;

    if (ticket.user_id !== user_id && ticket.assigned_to !== user_id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    // 3. Insert message
    const { data: msg, error: msgError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id,
        sender_id: user_id,
        message,
        is_internal: is_internal || false
      })
      .select()
      .single();

    if (msgError) throw msgError;

    return new Response(JSON.stringify({
      success: true,
      message: msg
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});