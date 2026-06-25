// supabase/functions/process-refund/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { refund_id, user_id: providedUserId } = await req.json();

    if (!refund_id) {
      return new Response(JSON.stringify({ error: "refund_id required" }), { status: 400 });
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

    // 2. Get refund with order and buyer/seller
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .select(`
        *,
        order:order_id (
          id,
          buyer_id,
          business_id,
          total_amount,
          status,
          settled_at,
          settled_amount,
          seller:businesses(owner_id)
        )
      `)
      .eq("id", refund_id)
      .maybeSingle();

    if (refundError || !refund) {
      return new Response(JSON.stringify({ error: "Refund not found" }), { status: 404 });
    }

    if (refund.status === "PROCESSED") {
      return new Response(JSON.stringify({ error: "Refund already processed" }), { status: 400 });
    }

    const order = refund.order;
    const buyerId = order.buyer_id;
    const sellerId = order.seller.owner_id;
    const amount = refund.amount;

    // 3. Get wallets
    const { data: sellerWallet, error: sellerWalletError } = await supabase
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", sellerId)
      .eq("wallet_type", "seller")
      .maybeSingle();

    if (sellerWalletError || !sellerWallet) {
      return new Response(JSON.stringify({ error: "Seller wallet not found" }), { status: 404 });
    }

    const { data: buyerWallet, error: buyerWalletError } = await supabase
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", buyerId)
      .eq("wallet_type", "buyer")
      .maybeSingle();

    if (buyerWalletError || !buyerWallet) {
      return new Response(JSON.stringify({ error: "Buyer wallet not found" }), { status: 404 });
    }

    // 4. Check seller balance
    if (sellerWallet.available_balance < amount) {
      return new Response(JSON.stringify({
        error: "Insufficient seller balance for refund. Available: " + sellerWallet.available_balance
      }), { status: 400 });
    }

    // 5. Perform refund: Debit seller, Credit buyer
    // Use the increment function to update balances
    await supabase.rpc('increment_wallet_balance', {
      p_wallet_id: sellerWallet.id,
      p_amount: -amount
    });

    await supabase.rpc('increment_wallet_balance', {
      p_wallet_id: buyerWallet.id,
      p_amount: amount
    });

    // 6. Record wallet transactions
    await supabase
      .from("wallet_transactions")
      .insert([
        {
          wallet_id: sellerWallet.id,
          amount: -amount,
          transaction_type: "refund",
          reference_id: order.id,
          description: `Refund for order #${order.id.slice(0, 8)} (dispute)`
        },
        {
          wallet_id: buyerWallet.id,
          amount: amount,
          transaction_type: "refund",
          reference_id: order.id,
          description: `Refund for order #${order.id.slice(0, 8)}`
        }
      ]);

    // 7. Update refund status
    const now = new Date().toISOString();
    await supabase
      .from("refunds")
      .update({
        status: "PROCESSED",
        processed_by: admin_user_id,
        processed_at: now
      })
      .eq("id", refund_id);

    // 8. Update order status to refunded
    await supabase
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id);

    // 9. Create notification for buyer and seller
    await supabase
      .from("notifications")
      .insert([
        {
          user_id: buyerId,
          title: `Refund processed for order #${order.id.slice(0, 8)}`,
          body: `₦${amount} has been credited to your wallet.`,
          data: { order_id: order.id, amount }
        },
        {
          user_id: sellerId,
          title: `Refund processed for order #${order.id.slice(0, 8)}`,
          body: `₦${amount} has been debited from your wallet.`,
          data: { order_id: order.id, amount }
        }
      ]);

    return new Response(JSON.stringify({
      success: true,
      message: "Refund processed successfully",
      refund_amount: amount,
      buyer_balance: buyerWallet.available_balance + amount,
      seller_balance: sellerWallet.available_balance - amount
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});