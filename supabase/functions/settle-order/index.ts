// supabase/functions/settle-order/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { order_id, user_id: providedUserId } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400 });
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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        business:business_id (
          id,
          name,
          business_type,
          owner_id
        )
      `)
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    if (order.business.owner_id !== user_id) {
      return new Response(JSON.stringify({ error: "You do not own this business" }), { status: 403 });
    }

    if (order.settled_at) {
      return new Response(JSON.stringify({
        error: "Order already settled",
        settled_at: order.settled_at,
        settled_amount: order.settled_amount
      }), { status: 400 });
    }

    if (order.status !== 'completed') {
      return new Response(JSON.stringify({
        error: `Order must be 'completed' to settle. Current status: ${order.status}`
      }), { status: 400 });
    }

    // DIRECT QUERY - NO MAPPING
    const vertical = order.business.business_type;

    const { data: commissionRate, error: rateError } = await supabase
      .from("commission_rates")
      .select("rate_percent")
      .eq("vertical", vertical)
      .eq("is_active", true)
      .maybeSingle();

    if (rateError || !commissionRate) {
      console.error("Commission error:", rateError);
      console.error("Vertical queried:", vertical);
      return new Response(JSON.stringify({
        error: `Commission rate not configured for vertical: '${vertical}'`
      }), { status: 500 });
    }

    const commissionPercent = commissionRate.rate_percent / 100;
    const totalAmount = parseFloat(order.total_amount);
    const platformCommission = Math.round((totalAmount * commissionPercent) * 100) / 100;
    const sellerPayout = Math.round((totalAmount - platformCommission) * 100) / 100;

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", user_id)
      .eq("wallet_type", "seller")
      .maybeSingle();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Seller wallet not found" }), { status: 404 });
    }

    await supabase.rpc('increment_wallet_balance', {
      p_wallet_id: wallet.id,
      p_amount: sellerPayout
    });

    await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        amount: sellerPayout,
        transaction_type: 'seller_credit',
        reference_id: order_id,
        description: `Order #${order_id.slice(0, 8)} settlement (${vertical})`
      });

    const settlementRef = `SET-${order_id}-${Date.now()}`;
    await supabase
      .from("orders")
      .update({
        settled_at: new Date().toISOString(),
        settled_amount: sellerPayout,
        platform_commission_deducted: platformCommission,
        settlement_reference: settlementRef,
        platform_commission: platformCommission
      })
      .eq("id", order_id);

    await supabase
      .from("notifications")
      .insert({
        user_id: user_id,
        title: `💰 Payment Received for Order #${order_id.slice(0, 8)}`,
        body: `₦${sellerPayout.toFixed(2)} has been added to your wallet. (Commission: ${commissionRate.rate_percent}%)`,
        data: { order_id, amount: sellerPayout, commission: platformCommission }
      });

    return new Response(JSON.stringify({
      success: true,
      message: "Order settled successfully",
      settlement: {
        order_id,
        total_amount: totalAmount,
        commission_rate: commissionRate.rate_percent,
        platform_commission: platformCommission,
        seller_payout: sellerPayout,
        settled_at: new Date().toISOString(),
        reference: settlementRef
      }
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Settle order error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});