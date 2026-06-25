// supabase/functions/admin-get-users/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { 
      email, 
      role, 
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

    // 1. Get admin profile to check role
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

    // 2. Use Admin API to list users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      perPage: limit,
      page: Math.floor(offset / limit) + 1
    });

    if (listError) throw listError;

    // 3. Filter by email if provided
    let filteredUsers = users || [];
    if (email) {
      filteredUsers = filteredUsers.filter(u => u.email?.toLowerCase().includes(email.toLowerCase()));
    }

    // 4. If role filter applied, we need to fetch user_roles for these users
    if (role) {
      const userIds = filteredUsers.map(u => u.id);
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map();
      rolesData?.forEach(r => {
        if (!roleMap.has(r.user_id)) {
          roleMap.set(r.user_id, []);
        }
        roleMap.get(r.user_id).push(r.role);
      });

      filteredUsers = filteredUsers.filter(u => {
        const roles = roleMap.get(u.id) || [];
        return roles.includes(role);
      });
    }

    // 5. Apply region/country scoping (only if not Supreme Admin)
    if (adminRole !== 'supreme_admin') {
      let userIds = filteredUsers.map(u => u.id);
      let scopedUserIds: string[] = [];

      if (adminRole === 'regional_manager' || adminRole === 'customer_care') {
        // Get region from helper
        const { data: regionId } = await supabase
          .rpc('get_admin_assigned_region', { admin_user_id })
          .maybeSingle();

        if (regionId) {
          // We need to filter users by region via profiles table
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("region_id", regionId)
            .in("user_id", userIds);
          scopedUserIds = profiles?.map(p => p.user_id) || [];
        } else {
          // If no region assigned, return empty (or throw error)
          return new Response(JSON.stringify({ success: true, users: [], total: 0 }), { status: 200 });
        }
      } else if (adminRole === 'country_manager') {
        const { data: countryIds } = await supabase
          .rpc('get_admin_assigned_countries', { admin_user_id });
        if (countryIds && countryIds.length > 0) {
          const countryIdList = countryIds.map(c => c.country_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id")
            .in("country_id", countryIdList)
            .in("user_id", userIds);
          scopedUserIds = profiles?.map(p => p.user_id) || [];
        } else {
          return new Response(JSON.stringify({ success: true, users: [], total: 0 }), { status: 200 });
        }
      }

      // Apply scope
      filteredUsers = filteredUsers.filter(u => scopedUserIds.includes(u.id));
    }

    // 6. Get total count (simplified, use the original count from listUsers)
    const total = filteredUsers.length;

    // 7. Return users with their roles and profile data
    const userIdsFinal = filteredUsers.map(u => u.id);
    const { data: rolesDataFinal } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIdsFinal);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone, avatar_url")
      .in("user_id", userIdsFinal);

    const roleMapFinal = new Map();
    rolesDataFinal?.forEach(r => {
      if (!roleMapFinal.has(r.user_id)) {
        roleMapFinal.set(r.user_id, []);
      }
      roleMapFinal.get(r.user_id).push(r.role);
    });

    const profileMap = new Map();
    profilesData?.forEach(p => profileMap.set(p.user_id, p));

    const enrichedUsers = filteredUsers.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      banned_until: u.banned_until,
      roles: roleMapFinal.get(u.id) || [],
      profile: profileMap.get(u.id) || null
    }));

    return new Response(JSON.stringify({
      success: true,
      users: enrichedUsers,
      total: total,
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