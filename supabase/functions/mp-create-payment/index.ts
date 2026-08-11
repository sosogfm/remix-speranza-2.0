import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { isPlaceholderToken, mpFetch } from "../_shared/mercadopago.ts";

const GIFT_WRAP_CENTS = 3500;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BodySchema = z.object({
  origin: z.string().url(),
  method: z.enum(["pix", "boleto", "card"]),
  card: z
    .object({
      token: z.string().trim().min(4).max(200),
      installments: z.number().int().min(1).max(12).default(1),
      paymentMethodId: z.string().trim().max(40).optional().nullable(),
      issuerId: z.string().trim().max(40).optional().nullable(),
    })
    .optional()
    .nullable(),
  customer: z.object({
    name: z.string().trim().min(3).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional().nullable(),
    document: z.string().trim().max(20),
    postalCode: z.string().trim().max(12).default(""),
    addressLine: z.string().trim().max(200).default(""),
    addressNumber: z.string().trim().max(20).default(""),
    complement: z.string().trim().max(120).optional().nullable(),
    neighborhood: z.string().trim().max(120).default(""),
    city: z.string().trim().max(120).default(""),
    state: z.string().trim().max(2).default(""),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
  isGift: z.boolean().default(false),
  giftMessage: z.string().trim().max(500).optional().nullable(),
  /** pagamento de vaga(s) de oficina — nesse caso items vem vazio */
  workshopRegistrationId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
        values: z.record(z.string()).default({}),
      }),
    )
    .max(50)
    .default([]),
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

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: "Confira os dados enviados.", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const body = parsed.data;

    if (body.method === "card" && !body.card?.token) {
      return json({ error: "Dados do cartão incompletos." }, 400);
    }

    // Cliente logada (opcional) — pedido de convidada quando não houver token
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    const ids = [...new Set(body.items.map((i) => i.productId))];
    const { data: products, error: prodErr } = await supabase
      .from("products").select("*").in("id", ids);
    if (prodErr) throw prodErr;

    const { data: fields, error: fieldErr } = await supabase
      .from("product_personalization_fields").select("*").in("product_id", ids);
    if (fieldErr) throw fieldErr;

    let subtotalCents = 0;
    const orderItems: any[] = [];

    let workshopReg: any = null;

    if (body.workshopRegistrationId) {
      const { data: reg } = await supabase
        .from("workshop_registrations")
        .select("*, workshops(*)")
        .eq("id", body.workshopRegistrationId)
        .maybeSingle();
      if (!reg) return json({ error: "Inscrição não encontrada." }, 400);
      if (reg.order_id && reg.status === "paid") {
        return json({ error: "Esta inscrição já foi paga." }, 400);
      }
      const w = reg.workshops;
      if (!w) return json({ error: "Oficina não encontrada." }, 400);

      const spots = Math.max(reg.spots ?? 1, 1);
      const unitCents =
        activeSalePrice({
          price_cents: w.price_cents,
          sale_price_cents: w.sale_price_cents,
          sale_starts_at: w.sale_starts_at,
          sale_ends_at: w.sale_ends_at,
        }) + Math.max(reg.extra_cents ?? 0, 0);

      subtotalCents = unitCents * spots;
      orderItems.push({
        product_id: null,
        product_name: `Oficina: ${w.title}`,
        unit_price_cents: unitCents,
        quantity: spots,
        personalization_text: `Inscrição de ${reg.full_name}`,
      });
      workshopReg = reg;
    } else {
      if (!body.items.length) return json({ error: "Sua sacola está vazia." }, 400);

      for (const item of body.items) {
        const product = products?.find((p: any) => p.id === item.productId);
        if (!product || !product.is_active) return json({ error: "Peça indisponível no momento." }, 400);
        if (product.is_quote_only) return json({ error: `${product.name} é sob orçamento.` }, 400);
        if (product.stock_quantity < item.quantity) {
          return json({ error: `Estoque insuficiente para ${product.name}.` }, 400);
        }

        const productFields = (fields ?? []).filter((f: any) => f.product_id === product.id);
        let sizeBase: number | null = null;
        let extras = 0;
        const summary: string[] = [];

        for (const f of productFields) {
          const value = (item.values[f.id] ?? "").trim();
          if (f.is_required && !value) {
            return json({ error: `Complete a personalização de ${product.name}.` }, 400);
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

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          unit_price_cents: unitCents,
          quantity: item.quantity,
          personalization_text: summary.length ? summary.join(" · ") : null,
        });
      }
    }

    // Frete pela tabela de CEP do ateliê (oficina é presencial: sem frete)
    const cep = onlyDigits(body.customer.postalCode);
    let shippingCents = 0;
    if (!workshopReg) {
      const { data: rate } = await supabase
        .from("shipping_rates").select("*").eq("is_active", true)
        .lte("cep_start", cep).gte("cep_end", cep).limit(1).maybeSingle();
      if (!rate) return json({ error: "Não conseguimos calcular o frete para este CEP." }, 400);

      const freeShipping = rate.free_above_cents != null && subtotalCents >= rate.free_above_cents;
      shippingCents = freeShipping ? 0 : rate.price_cents;
    }

    const giftWrapCents = body.isGift && !workshopReg ? GIFT_WRAP_CENTS : 0;
    const totalCents = subtotalCents + shippingCents + giftWrapCents;

    const methodColumn =
      body.method === "card" ? "credit_card" : body.method === "pix" ? "pix" : "boleto";

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone ?? null,
        customer_document: onlyDigits(body.customer.document),
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
        installments: body.method === "card" ? body.card?.installments ?? 1 : 1,
        payment_method: methodColumn,
        payment_status: "pending",
        is_gift: body.isGift,
        gift_message: body.isGift ? body.giftMessage ?? null : null,
        gift_wrap_cents: giftWrapCents,
      })
      .select("id, order_number")
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase
      .from("order_items").insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) throw itemsErr;

    const totals = {
      orderId: order.id,
      orderNumber: order.order_number,
      subtotalCents,
      shippingCents,
      giftWrapCents,
      totalCents,
    };

    if (isPlaceholderToken()) {
      return json(
        {
          ...totals,
          error:
            "O pagamento ainda não está ativo: falta a credencial real do Mercado Pago. Seu pedido foi registrado como aguardando pagamento.",
          credentialsMissing: true,
        },
        503,
      );
    }

    const doc = onlyDigits(body.customer.document);
    const [firstName, ...rest] = body.customer.name.trim().split(/\s+/);
    const payer: any = {
      email: body.customer.email,
      first_name: firstName,
      last_name: rest.join(" ") || firstName,
      identification: { type: doc.length > 11 ? "CNPJ" : "CPF", number: doc },
      address: {
        zip_code: cep,
        street_name: body.customer.addressLine,
        street_number: body.customer.addressNumber,
        neighborhood: body.customer.neighborhood,
        city: body.customer.city,
        federal_unit: body.customer.state,
      },
    };

    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`;
    const base: any = {
      transaction_amount: Number((totalCents / 100).toFixed(2)),
      description: `Pedido ${order.order_number} — Speranza Ateliê`,
      external_reference: order.id,
      notification_url: notificationUrl,
      metadata: { order_id: order.id, order_number: order.order_number },
      payer,
    };

    let payload: any;
    if (body.method === "pix") {
      payload = {
        ...base,
        payment_method_id: "pix",
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    } else if (body.method === "boleto") {
      payload = { ...base, payment_method_id: "bolbradesco" };
    } else {
      payload = {
        ...base,
        token: body.card!.token,
        installments: body.card!.installments,
        payment_method_id: body.card!.paymentMethodId ?? undefined,
        issuer_id: body.card!.issuerId ?? undefined,
        capture: true,
      };
    }

    let payment: any;
    try {
      payment = await mpFetch("/v1/payments", {
        method: "POST",
        body: JSON.stringify(payload),
        idempotencyKey: `${order.id}-${body.method}`,
      });
    } catch (e: any) {
      console.error("Mercado Pago recusou o pagamento:", e?.message, e?.payload);
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return json({ ...totals, error: e?.message ?? "Não foi possível criar o pagamento." }, 400);
    }

    await supabase
      .from("orders")
      .update({ payment_provider_id: String(payment.id), payment_payload: payment })
      .eq("id", order.id);

    const tx = payment.point_of_interaction?.transaction_data ?? {};
    return json({
      ...totals,
      paymentId: String(payment.id),
      status: payment.status,
      statusDetail: payment.status_detail,
      pix: body.method === "pix"
        ? {
            qrCodeBase64: tx.qr_code_base64 ?? null,
            qrCode: tx.qr_code ?? null,
            expiresAt: payment.date_of_expiration ?? null,
          }
        : null,
      boleto: body.method === "boleto"
        ? {
            url: payment.transaction_details?.external_resource_url ?? null,
            barcode: payment.barcode?.content ?? null,
            expiresAt: payment.date_of_expiration ?? null,
          }
        : null,
    });
  } catch (e) {
    console.error("mp-create-payment error:", e);
    return json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, 500);
  }
});
