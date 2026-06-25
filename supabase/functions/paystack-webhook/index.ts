// supabase/functions/paystack-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

Deno.serve(async (req) => {
  try {
    // 1. Get the raw request body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 401 });
    }

    // 2. Verify webhook signature (Paystack uses HMAC SHA-512)
    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const expectedSignature = createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    // 3. Only handle successful charge events
    if (event !== "charge.success") {
      return new Response(JSON.stringify({ message: "Ignored event" }), { status: 200 });
    }

    const { reference, metadata } = data;

    // 4. Verify transaction with Paystack (for extra security)
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );
    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      // Mark as failed
      await markPaymentFailed(reference);
      return new Response(JSON.stringify({ message: "Transaction verification failed" }), { status: 400 });
    }

    // 5. Find the checkout session and order
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("id, order_id, buyer_id, total_amount")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }

    // 6. Update checkout session
    await supabase
      .from("checkout_sessions")
      .update({
        payment_status: 'paid',
        status: 'converted'
      })
      .eq("id", session.id);

    // 7. Update order
    await supabase
      .from("orders")
      .update({
        status: 'payment_confirmed',
        payment_status: 'paid',
        payment_reference: reference
      })
      .eq("id", session.order_id);

    // 8. Commit stock (sale)
    await supabase.rpc('commit_stock_for_order', {
      p_session_id: session.id,
      p_order_id: session.order_id
    });

    // 9. Log security event
    await supabase.from("security_events").insert({
      user_id: session.buyer_id,
      event_type: "PAYMENT_SUCCESS",
      severity: "info",
      metadata: {
        order_id: session.order_id,
        reference: reference,
        amount: verifyData.data.amount / 100,
        currency: verifyData.data.currency
      }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ------------------------------------------------------------------
// Helper function to mark payment as failed
// ------------------------------------------------------------------
async function markPaymentFailed(reference: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("checkout_sessions")
    .select("id, order_id")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (session) {
    await supabase
      .from("checkout_sessions")
      .update({ payment_status: 'failed', status: 'failed' })
      .eq("id", session.id);

    if (session.order_id) {
      await supabase
        .from("orders")
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq("id", session.order_id);
    }
  }
}