// supabase/functions/get-tickets/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { user_id: providedUserId, status, limit = 50, offset = 0 } = await req.json();

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

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle();
    const isAdmin = !!adminProfile;

    // ---- 1. Fetch tickets ----
    let query = supabase
      .from("support_tickets")
      .select("*");

    if (!isAdmin) {
      query = query.eq("user_id", user_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tickets, error: ticketsError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ticketsError) throw ticketsError;

    // ---- 2. Fetch messages for each ticket ----
    const ticketsWithMessages = await Promise.all((tickets || []).map(async (ticket) => {
      // Fetch messages
      const { data: messages, error: msgError } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Message fetch error:", msgError);
        return { ...ticket, messages: [] };
      }

      // Fetch sender email for each message
      const messagesWithSender = await Promise.all((messages || []).map(async (msg) => {
        const { data: sender } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", msg.sender_id)
          .maybeSingle();
        return {
          ...msg,
          sender_email: sender?.email || null
        };
      }));

      return {
        ...ticket,
        messages: messagesWithSender || []
      };
    }));

    // ---- 3. Total count ----
    let countQuery = supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true });
    if (!isAdmin) {
      countQuery = countQuery.eq("user_id", user_id);
    }
    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    const { count, error: countError } = await countQuery;

    return new Response(JSON.stringify({
      success: true,
      tickets: ticketsWithMessages,
      total: count || 0,
      limit,
      offset
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});