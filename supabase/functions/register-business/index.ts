// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // Parse request body
    const { business_type, name, delivery_config, user_id: providedUserId } = await req.json();
    
    // Get Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let user_id = providedUserId; // default from body

    // If user_id is not provided in body, try to get it from JWT
    if (!user_id) {
      // Verify JWT normally
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        // If JWT verification fails, check if token is the service role key
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (token === serviceRoleKey) {
          // Service role key used, but user_id was not provided
          return new Response(JSON.stringify({ 
            error: "When using service role key, you must provide 'user_id' in the request body." 
          }), { status: 400 });
        }
        // Otherwise, invalid token
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
      }
      user_id = user.id;
    }

    // Validate business_type
    if (!['products', 'food', 'services'].includes(business_type)) {
      return new Response(JSON.stringify({
        error: "Invalid business_type. Must be 'products', 'food', or 'services'."
      }), { status: 400 });
    }

    // Check if user already has a business (ONE SELLER, ONE VERTICAL)
    const { data: existing } = await supabase
      .from("businesses")
      .select("id, business_type")
      .eq("owner_id", user_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({
        error: `You already have a ${existing[0].business_type} business. One seller, one vertical.`,
        existing_business: existing[0]
      }), { status: 400 });
    }

    // Auto-verify phone for MVP
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, phone_verified_at")
      .eq("user_id", user_id)
      .single();

    if (!profile?.phone_verified_at) {
      if (!profile?.phone) {
        await supabase
          .from("profiles")
          .update({ 
            phone: "0000000000",
            phone_verified_at: new Date().toISOString(),
            phone_verification_reason: "mvp_auto_verified"
          })
          .eq("user_id", user_id);
      } else {
        await supabase
          .from("profiles")
          .update({ 
            phone_verified_at: new Date().toISOString(),
            phone_verification_reason: "mvp_auto_verified"
          })
          .eq("user_id", user_id);
      }
    }

    // Create the business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user_id,
        business_type: business_type,
        name: name || `${user_id}'s ${business_type} Store`,
        delivery_config: delivery_config || { fee_type: "fixed", base_fee: 1500, radius_km: 10 },
        setup_progress: {
          business_info: true,
          delivery: false,
          first_item: false
        }
      })
      .select()
      .single();

    if (businessError) throw businessError;

    // Create default subscription
    await supabase.from("seller_subscriptions").insert({
      business_id: business.id,
      plan_type: "free",
      featured_credits_balance: 0,
      is_active: true
    });

    // Log security event
    await supabase.from("security_events").insert({
      user_id: user_id,
      event_type: "BUSINESS_REGISTERED",
      severity: "info",
      metadata: {
        business_id: business.id,
        business_type: business_type,
        business_name: business.name,
        mvp_phone_auto_verified: true
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Your ${business_type} business has been created. Phone verification was auto-verified for MVP.`,
      business: business,
      vertical_locked: true,
      mvp_mode: true,
      phone_auto_verified: true,
      next_steps: [
        "Configure delivery settings",
        "Add your first catalog item"
      ]
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});