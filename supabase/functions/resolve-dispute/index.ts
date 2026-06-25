// supabase/functions/resolve-dispute/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { dispute_id, decision, partial_amount, notes, user_id: providedUserId } = await req.json();

    if (!dispute_id || !decision) {
      return new Response(JSON.stringify({ error: "dispute_id and decision required" }), { status: 400 });
    }

    if (!["refund", "partial", "reject"].includes(decision)) {
      return new Response(JSON.stringify({ error: "Invalid decision" }), { status: 400 });
    }

    if (decision === "partial" && !partial_amount) {
      return new Response(JSON.stringify({ error: "partial_amount required for partial refund" }), { status: 400 });
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

    // 1. Check admin
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", admin_user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminProfile) {
      return new Response(JSON.stringify({ error: "Unauthorized admin" }), { status: 403 });
    }

    // 2. Get dispute (fix: remove join on orders.seller_id)
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select(`
        *,
        orders:order_id (
          id,
          total_amount,
          buyer_id,
          business_id
        )
      `)
      .eq("id", dispute_id)
      .maybeSingle();

    if (disputeError || !dispute) {
      console.error("Dispute fetch error:", disputeError);
      return new Response(JSON.stringify({ error: "Dispute not found" }), { status: 404 });
    }

    // 3. Process decision
    const now = new Date().toISOString();
    let refundAmount = 0;
    let newStatus = "";

    // Ensure we have order data
    if (!dispute.orders) {
      return new Response(JSON.stringify({ error: "Associated order not found" }), { status: 404 });
    }

    const orderTotal = parseFloat(dispute.orders.total_amount || 0);

    switch (decision) {
      case "refund":
        refundAmount = orderTotal;
        newStatus = "RESOLVED";
        break;
      case "partial":
        refundAmount = parseFloat(partial_amount);
        if (refundAmount > orderTotal) {
          return new Response(JSON.stringify({ error: "Partial refund amount cannot exceed order total" }), { status: 400 });
        }
        newStatus = "PARTIAL";
        break;
      case "reject":
        refundAmount = 0;
        newStatus = "REJECTED";
        break;
    }

    // 4. Update dispute
    const { error: updateError } = await supabase
      .from("disputes")
      .update({
        status: newStatus,
        resolution_notes: notes || null,
        resolved_by: admin_user_id,
        resolved_at: now
      })
      .eq("id", dispute_id);

    if (updateError) throw updateError;

    // 5. If refund, create refund record
    if (refundAmount > 0) {
      const { error: refundError } = await supabase
        .from("refunds")
        .insert({
          order_id: dispute.order_id,
          dispute_id: dispute_id,
          amount: refundAmount,
          reason: notes || `Dispute resolution: ${decision}`,
          status: "APPROVED",
          processed_by: admin_user_id,
          processed_at: now,
          refund_reference: `REF-${dispute.order_id}-${Date.now()}`
        });

      if (refundError) throw refundError;

      // TODO: Actually move money – we'll add this in Phase 9C
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Dispute ${newStatus}`,
      refund_amount: refundAmount
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});