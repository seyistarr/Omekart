// supabase/functions/get-seller-wallet/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { user_id: providedUserId, limit = 20, offset = 0 } = await req.json();

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

    // 1. Get seller's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, available_balance, pending_balance, updated_at")
      .eq("user_id", user_id)
      .eq("wallet_type", "seller")
      .maybeSingle();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), { status: 404 });
    }

    // 2. Get transaction history
    const { data: transactions, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) throw txError;

    // 3. Get total transaction count
    const { count, error: countError } = await supabase
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("wallet_id", wallet.id);

    return new Response(JSON.stringify({
      success: true,
      wallet: {
        available_balance: wallet.available_balance,
        pending_balance: wallet.pending_balance,
        updated_at: wallet.updated_at
      },
      transactions: transactions || [],
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