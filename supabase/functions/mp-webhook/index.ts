import { createClient } from "npm:@supabase/supabase-js@2";
import { isPlaceholderToken, mpFetch, verifyWebhookSignature } from "../_shared/mercadopago.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function commitStock(orderId: string) {
  const { data: items } = await supabase
    .from("order_items").select("product_id, quantity").eq("order_id", orderId);

  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const { data: product } = await supabase
      .from("products").select("id, stock_quantity").eq("id", item.product_id).maybeSingle();
    if (!product) continue;
    await supabase
      .from("products")
      .update({ stock_quantity: Math.max((product.stock_quantity ?? 0) - item.quantity, 0) })
      .eq("id", product.id);
  }
}

async function approve(orderId: string, payment: any) {
  const { data: order } = await supabase
    .from("orders").select("id, stock_committed").eq("id", orderId).maybeSingle();
  if (!order) return;

  if (!order.stock_committed) await commitStock(orderId);

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      stock_committed: true,
      shipping_status: "preparing",
      payment_payload: payment,
    })
    .eq("id", orderId);

  // Confirma vagas de oficina associadas ao pedido
  await supabase
    .from("workshop_registrations")
    .update({ status: "confirmed" })
    .eq("order_id", orderId)
    .eq("status", "pending");
}

async function cancel(orderId: string, payment: any) {
  await supabase
    .from("orders")
    .update({ payment_status: "cancelled", payment_payload: payment })
    .eq("id", orderId);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const paymentId =
      body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
    const topic = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (!paymentId || (topic && topic !== "payment")) {
      return new Response(JSON.stringify({ received: true, ignored: topic ?? "sem id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const valid = await verifyWebhookSignature(req, String(paymentId));
    if (!valid) {
      console.error("Assinatura do webhook inválida para o pagamento", paymentId);
      return new Response("Invalid signature", { status: 401 });
    }

    if (isPlaceholderToken()) {
      console.log("Credencial do Mercado Pago ainda é placeholder — evento ignorado");
      return new Response(JSON.stringify({ received: true, ignored: "sem credencial" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payment = await mpFetch(`/v1/payments/${paymentId}`);
    const orderId = payment?.metadata?.order_id ?? payment?.external_reference;
    if (!orderId) {
      return new Response(JSON.stringify({ received: true, ignored: "sem pedido" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    switch (payment.status) {
      case "approved":
ುcase_approved:
        await approve(orderId, payment);
        break;
      case "rejected":
      case "cancelled":
      case "charged_back":
        await cancel(orderId, payment);
        break;
      default:
        await supabase
          .from("orders")
          .update({ payment_status: "pending", payment_payload: payment })
          .eq("id", orderId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mp-webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
