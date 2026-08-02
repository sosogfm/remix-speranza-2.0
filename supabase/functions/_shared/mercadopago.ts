const API = "https://api.mercadopago.com";

export function mpToken(): string {
  return Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";
}

/** Token de teste/placeholder — a API real ainda não vai responder */
export function isPlaceholderToken(token = mpToken()): boolean {
  return !token || /TESTE|PLACEHOLDER|FAKE/i.test(token);
}

export async function mpFetch(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<any> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${mpToken()}`);
  headers.set("Content-Type", "application/json");
  if (init.idempotencyKey) headers.set("X-Idempotency-Key", init.idempotencyKey);

  const res = await fetch(`${API}${path}`, { ...init, headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const message =
      json?.message ?? json?.error ?? `Mercado Pago respondeu ${res.status}`;
    throw new MercadoPagoError(message, res.status, json);
  }
  return json;
}

export class MercadoPagoError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "MercadoPagoError";
    this.status = status;
    this.payload = payload;
  }
}

/** Validação da assinatura x-signature enviada pelo Mercado Pago */
export async function verifyWebhookSignature(
  req: Request,
  dataId: string,
): Promise<boolean> {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET") ?? "";
  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!secret || !signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k.trim(), rest.join("=").trim()];
    }),
  ) as Record<string, string>;

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === v1;
}
