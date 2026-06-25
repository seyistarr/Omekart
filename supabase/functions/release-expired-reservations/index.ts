// supabase/functions/release-expired-reservations/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ------------------------------------------------------------------
// Core release function
// ------------------------------------------------------------------
async function releaseExpiredReservations() {
  console.log("Running release-expired-reservations...");
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find active checkout sessions that have expired
  const { data: expired, error: findError } = await supabase
    .from("checkout_sessions")
    .select("id")
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (findError) {
    console.error("Find error:", findError);
    return { error: findError.message };
  }

  if (!expired || expired.length === 0) {
    console.log("No expired sessions found.");
    return { message: "No expired sessions", count: 0 };
  }

  // Update them to 'expired' status
  const expiredIds = expired.map(s => s.id);
  console.log(`Expiring ${expiredIds.length} sessions...`);

  const { error: updateError } = await supabase
    .from("checkout_sessions")
    .update({ status: "expired" })
    .in("id", expiredIds);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: updateError.message };
  }

  console.log(`Successfully expired ${expiredIds.length} sessions.`);
  return { message: `Released ${expiredIds.length} expired reservations`, count: expiredIds.length };
}

// ------------------------------------------------------------------
// HTTP Handler (manual invocation)
// ------------------------------------------------------------------
Deno.serve(async () => {
  try {
    const result = await releaseExpiredReservations();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ------------------------------------------------------------------
// CRON: Runs automatically every minute
// ------------------------------------------------------------------
Deno.cron("release-expired-reservations", "* * * * *", async () => {
  console.log(" Cron triggered at:", new Date().toISOString());
  await releaseExpiredReservations();
});