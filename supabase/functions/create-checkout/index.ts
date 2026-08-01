import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const GIFT_WRAP_CENTS = 3500;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]),
  origin: z.string().url(),
  customer: z.object({
    name: z.string().trim().min(3).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional().nullable(),
    document: z.string().trim().max(20).optional().nullable(),
    postalCode: z.string().trim().max(12),
    addressLine: z.string().trim().max(200),
    addressNumber: z.string().trim().max(20),
    complement: z.string().trim().max(120).optional().nullable(),
    neighborhood: z.string().trim().max(120),
    city: z.string().trim().max(120),
    state: z.string().trim().max(2),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
  isGift: z.boolean().default(false),
  giftMessage: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
        values: z.record(z.string()).default({}),
      }),
    )
    .min(1)
    .max(50),
});

const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");

const activeSalePrice = (p: any): number => {
  if (p.sale_price_cents == null) return p.price_cents;
  const now = Date.now();
  if (p.sale_starts_at && new Date(p.sale_starts_at).getTime() > now) return p.price_cents;
  if (p.sale_ends_at && new Date(p.sale_ends_at).getTime() < now) return p.price_cents;
  return p.sale_price_cents;
};

const splitAddon = (v: string) => v.split(" + ").map((s) => s.trim()).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = parsed.data;
    const env = body.environment as StripeEnv;

    // Cliente logado (opcional) — pedido de convidado quando não houver token
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    const ids = [...new Set(body.items.map((i) => i.productId))];
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .in("id", ids);
    if (prodErr) throw prodErr;

    const { data: fields, error: fieldErr } = await supabase
      .from("product_personalization_fields")
      .select("*")
      .in("product_id", ids);
    if (fieldErr) throw fieldErr;

    let subtotalCents = 0;
    const orderItems: any[] = [];
    const lineItems: any[] = [];

    for (const item of body.items) {
      const product = products?.find((p: any) => p.id === item.productId);
      if (!product || !product.is_active) {
        return new Response(
          JSON.stringify({ error: `Peça indisponível no momento.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (product.is_quote_only) {
        return new Response(
          JSON.stringify({ error: `${product.name} é sob orçamento.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Estoque insuficiente para ${product.name}.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const productFields = (fields ?? []).filter((f: any) => f.product_id === product.id);
      let sizeBase: number | null = null;
      let extras = 0;
      const summary: string[] = [];

      for (const f of productFields) {
        const value = (item.values[f.id] ?? "").trim();
        if (f.is_required && !value) {
          return new Response(
            JSON.stringify({ error: `Complete a personalização de ${product.name}.` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (!value) continue;
        const optionPrices = (f.option_prices ?? {}) as Record<string, number>;
        if (f.field_type === "size") {
          if (optionPrices[value] != null) sizeBase = optionPrices[value];
        } else if (f.field_type === "addon") {
          extras += splitAddon(value).reduce((t, o) => t + (optionPrices[o] ?? 0), 0);
        } else if (f.field_type === "choice") {
          extras += optionPrices[value] ?? f.extra_price_cents ?? 0;
        } else {
          extras += f.extra_price_cents ?? 0;
        }
        summary.push(`${f.label}: ${value}`);
      }

      const unitCents = (sizeBase ?? activeSalePrice(product)) + extras;
      subtotalCents += unitCents * item.quantity;

      const personalizationText = summary.length ? summary.join(" · ") : null;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price_cents: unitCents,
        quantity: item.quantity,
        personalization_text: personalizationText,
      });

      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: product.name,
            ...(personalizationText && { description: personalizationText.slice(0, 300) }),
          },
          unit_amount: unitCents,
        },
        quantity: item.quantity,
      });
    }

    // Frete pela tabela de CEP do ateliê
    const cep = onlyDigits(body.customer.postalCode);
    const { data: rate } = await supabase
      .from("shipping_rates")
      .select("*")
      .eq("is_active", true)
      .lte("cep_start", cep)
      .gte("cep_end", cep)
      .limit(1)
      .maybeSingle();

    if (!rate) {
      return new Response(
        JSON.stringify({ error: "Não conseguimos calcular o frete para este CEP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const freeShipping =
      rate.free_above_cents != null && subtotalCents >= rate.free_above_cents;
    const shippingCents = freeShipping ? 0 : rate.price_cents;
    const giftWrapCents = body.isGift ? GIFT_WRAP_CENTS : 0;
    const totalCents = subtotalCents + shippingCents + giftWrapCents;

    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: `Frete — ${rate.region_name}` },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }
    if (giftWrapCents > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: "Caixa para presente" },
          unit_amount: giftWrapCents,
        },
        quantity: 1,
      });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone ?? null,
        customer_document: onlyDigits(body.customer.document ?? ""),
        address_line: body.customer.addressLine,
        address_number: body.customer.addressNumber,
        address_complement: body.customer.complement ?? null,
        neighborhood: body.customer.neighborhood,
        city: body.customer.city,
        state: body.customer.state,
        postal_code: cep,
        notes: body.customer.notes ?? null,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        installments: 1,
        payment_method: "card",
        payment_status: "pending",
        is_gift: body.isGift,
        gift_message: body.isGift ? body.giftMessage ?? null : null,
        gift_wrap_cents: giftWrapCents,
      })
      .select("id, order_number")
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) throw itemsErr;

    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: `${body.origin}/pedido/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: body.customer.email,
      payment_intent_data: { description: `Pedido ${order.order_number}` },
      metadata: { order_id: order.id, order_number: order.order_number },
    });

    await supabase
      .from("orders")
      .update({ payment_provider_id: session.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
        orderId: order.id,
        orderNumber: order.order_number,
        subtotalCents,
        shippingCents,
        giftWrapCents,
        totalCents,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
