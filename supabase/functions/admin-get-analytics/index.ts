// supabase/functions/admin-get-analytics/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { user_id: providedUserId } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let admin_user_id = providedUserId;
    if (!admin_user_id) {
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
      admin_user_id = user.id;
    }

    // Check admin role
    const { data: adminProfile, error: adminError } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", admin_user_id)
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .maybeSingle();

    if (adminError || !adminProfile) {
      return new Response(JSON.stringify({ error: "Unauthorized admin" }), { status: 403 });
    }

    // Get stats
    const { data: orderStats } = await supabase
      .from("orders")
      .select("status, total_amount, created_at", { count: "exact" })
      .eq("payment_status", "paid");

    const totalOrders = orderStats?.length || 0;
    const totalRevenue = orderStats?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0;

    const { data: sellerStats } = await supabase
      .from("businesses")
      .select("id", { count: "exact" });

    const totalSellers = sellerStats?.length || 0;

    const { data: userStats } = await supabase
      .from("users")
      .select("id", { count: "exact" });

    const totalUsers = userStats?.length || 0;

    return new Response(JSON.stringify({
      success: true,
      analytics: {
        total_users: totalUsers,
        total_sellers: totalSellers,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        admin_role: adminProfile.role
      }
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});