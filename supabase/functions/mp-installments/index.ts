import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { isPlaceholderToken, mpFetch } from "../_shared/mercadopago.ts";

const MAX_INSTALLMENTS = 12;
const MIN_INSTALLMENT_CENTS = 500; // R$ 5,00 por parcela

const BodySchema = z.object({
  bin: z.string().trim().regex(/^\d{6,8}$/),
  amountCents: z.number().int().min(100).max(100_000_00),
});

export interface InstallmentOption {
  installments: number;
  installmentAmountCents: number;
  totalAmountCents: number;
  interestFree: boolean;
  label: string;
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Fallback usado enquanto a credencial real do Mercado Pago não está ativa */
export function localInstallments(amountCents: number): InstallmentOption[] {
  const options: InstallmentOption[] = [];
  for (let n = 1; n <= MAX_INSTALLMENTS; n++) {
    const each = Math.round(amountCents / n);
    if (n > 1 && each < MIN_INSTALLMENT_CENTS) break;
    options.push({
      installments: n,
      installmentAmountCents: each,
      totalAmountCents: amountCents,
      interestFree: true,
      label: `${n}x de ${brl(each)} sem juros`,
    });
  }
  return options;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { bin, amountCents } = parsed.data;
  const amount = amountCents / 100;

  const respond = (options: InstallmentOption[], source: string, method?: any) =>
    new Response(JSON.stringify({ options, source, paymentMethod: method ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (isPlaceholderToken()) {
    return respond(localInstallments(amountCents), "local");
  }

  try {
    const data = await mpFetch(
      `/v1/payment_methods/installments?bin=${bin}&amount=${amount}&payment_type_id=credit_card`,
    );
    const first = Array.isArray(data) ? data[0] : null;
    const payerCosts = first?.payer_costs ?? [];
    if (!payerCosts.length) return respond(localInstallments(amountCents), "local");

    const options: InstallmentOption[] = payerCosts
      .filter((c: any) => c.installments <= MAX_INSTALLMENTS)
      .map((c: any) => {
        const each = Math.round(c.installment_amount * 100);
        const total = Math.round(c.total_amount * 100);
        const free = (c.installment_rate ?? 0) === 0;
        return {
          installments: c.installments,
          installmentAmountCents: each,
          totalAmountCents: total,
          interestFree: free,
          label: `${c.installments}x de ${brl(each)} ${
            free ? "sem juros" : `com juros — total ${brl(total)}`
          }`,
        };
      });

    return respond(options, "mercadopago", {
      id: first?.payment_method_id ?? null,
      issuerId: first?.issuer?.id ?? null,
      thumbnail: first?.issuer?.secure_thumbnail ?? null,
    });
  } catch (e) {
    console.error("mp-installments error:", e);
    return respond(localInstallments(amountCents), "local");
  }
});
