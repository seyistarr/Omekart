// supabase/functions/admin-get-orders/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { 
      status, 
      vertical,
      date_from,
      date_to,
      limit = 50,
      offset = 0,
      user_id: providedUserId
    } = await req.json();

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

    // Get admin profile
    const { data: adminProfile, error: adminError } = await supabase
      .from("admin_profiles")
      .select("role, region_id, country_id")
      .eq("user_id", admin_user_id)
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .maybeSingle();

    if (adminError || !adminProfile) {
      return new Response(JSON.stringify({ error: "Unauthorized admin" }), { status: 403 });
    }

    const { role: adminRole } = adminProfile;

    // Build base query
    let query = supabase
      .from("orders")
      .select(`
        *,
        business:business_id (
          id,
          name,
          business_type,
          owner_id,
          region_id,
          country_id
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (vertical) {
      query = query.eq("business.business_type", vertical);
    }

    if (date_from) {
      query = query.gte("created_at", date_from);
    }

    if (date_to) {
      query = query.lte("created_at", date_to);
    }

    // Role-based scoping (now uses business.region_id and business.country_id)
    if (adminRole !== 'supreme_admin') {
      if (adminRole === 'regional_manager' || adminRole === 'customer_care') {
        // Get the admin's region
        const { data: regionId } = await supabase
          .rpc('get_admin_assigned_region', { admin_user_id })
          .maybeSingle();

        if (regionId) {
          query = query.eq("business.region_id", regionId);
        } else {
          return new Response(JSON.stringify({ success: true, orders: [], total: 0 }), { status: 200 });
        }
      } else if (adminRole === 'country_manager') {
        const { data: countryIds } = await supabase
          .rpc('get_admin_assigned_countries', { admin_user_id });
        if (countryIds && countryIds.length > 0) {
          const countryIdList = countryIds.map(c => c.country_id);
          query = query.in("business.country_id", countryIdList);
        } else {
          return new Response(JSON.stringify({ success: true, orders: [], total: 0 }), { status: 200 });
        }
      }
    }

    // Pagination
    query = query.order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    // Get total count
    const { count, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    // Fetch buyer emails separately
    const ordersWithBuyer = await Promise.all((orders || []).map(async (order) => {
      const { data: buyer } = await supabase
        .from("auth.users")
        .select("email")
        .eq("id", order.buyer_id)
        .maybeSingle();
      return {
        ...order,
        buyer_email: buyer?.email || null
      };
    }));

    return new Response(JSON.stringify({
      success: true,
      orders: ordersWithBuyer || [],
      total: count || 0,
      limit,
      offset,
      admin_role: adminRole
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});