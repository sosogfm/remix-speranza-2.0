import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function fulfillOrder(session: any) {
  const orderId = session?.metadata?.order_id;
  if (!orderId) {
    console.log("Sessão sem order_id no metadata — ignorando");
    return;
  }
  const supabase = getSupabase();

  const { data: order } = await supabase
    .from("orders")
    .select("id, stock_committed, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  // Idempotência: só dá baixa de estoque uma única vez
  if (order.stock_committed) {
    await supabase.from("orders").update({ payment_status: "paid" }).eq("id", orderId);
    return;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const { data: product } = await supabase
      .from("products")
      .select("id, stock_quantity")
      .eq("id", item.product_id)
      .maybeSingle();
    if (!product) continue;
    await supabase
      .from("products")
      .update({ stock_quantity: Math.max((product.stock_quantity ?? 0) - item.quantity, 0) })
      .eq("id", product.id);
  }

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      stock_committed: true,
      shipping_status: "preparing",
      payment_payload: session,
    })
    .eq("id", orderId);
}

async function markFailed(session: any) {
  const orderId = session?.metadata?.order_id;
  if (!orderId) return;
  await getSupabase()
    .from("orders")
    .update({ payment_status: "cancelled" })
    .eq("id", orderId);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook com env inválido:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status !== "unpaid") await fulfillOrder(session);
        break;
      }
      case "checkout.session.async_payment_succeeded":
        await fulfillOrder(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
        await markFailed(event.data.object);
        break;
      default:
        console.log("Evento não tratado:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
