// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const { device_id } = await req.json();

    await supabase.from("user_sessions").insert({
      user_id: user.id,
      device_id: device_id || "unknown",
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      user_agent: req.headers.get("user-agent"),
      is_active: true,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await supabase.from("security_events").insert({
      user_id: user.id,
      event_type: "LOGIN_SUCCESS",
      severity: "info",
      metadata: { device_id: device_id || "unknown" },
    });

    const { data: existing } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("device_id", device_id)
      .eq("is_active", true)
      .limit(1);

    const is_new_device = !existing || existing.length === 0;

    return new Response(JSON.stringify({
      success: true,
      is_new_device: is_new_device,
      message: is_new_device ? "New device detected. Consider verifying your phone." : "Session tracked.",
      phone_verified: is_new_device ? false : true
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});