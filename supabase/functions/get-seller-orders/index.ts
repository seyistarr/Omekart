import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { user_id: providedUserId, limit = 50, offset = 0, status } = await req.json();

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

    // Get seller's business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user_id)
      .maybeSingle();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: "No business found for this user" }), { status: 404 });
    }

    let query = supabase
      .from("orders")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    const { count, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id);

    return new Response(JSON.stringify({
      success: true,
      orders: orders || [],
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