/** SDK oficial do Mercado Pago (MercadoPago.js v2) para tokenizar o cartão */
const SDK_URL = "https://sdk.mercadopago.com/js/v2";

export const MP_PUBLIC_KEY: string =
  import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY ?? "";

/** Enquanto a credencial real não chega, o token é um placeholder */
export const mpCredentialsMissing = () =>
  !MP_PUBLIC_KEY || /TESTE|PLACEHOLDER|FAKE/i.test(MP_PUBLIC_KEY);

let sdkPromise: Promise<any> | null = null;

function loadSdk(): Promise<any> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if ((window as any).MercadoPago) return resolve((window as any).MercadoPago);
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve((window as any).MercadoPago);
    script.onerror = () => reject(new Error("Não foi possível carregar o Mercado Pago."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

let mpInstance: any = null;

export async function getMercadoPago(): Promise<any> {
  if (mpCredentialsMissing()) {
    throw new Error(
      "O pagamento por cartão ainda não está ativo: falta a credencial do Mercado Pago.",
    );
  }
  if (mpInstance) return mpInstance;
  const MercadoPago = await loadSdk();
  mpInstance = new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
  return mpInstance;
}

export interface CardData {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationNumber: string;
}

/** Gera o token do cartão — os dados nunca passam pelo nosso servidor */
export async function createCardToken(card: CardData): Promise<string> {
  const mp = await getMercadoPago();
  const digits = card.identificationNumber.replace(/\D/g, "");
  const result = await mp.createCardToken({
    cardNumber: card.cardNumber.replace(/\D/g, ""),
    cardholderName: card.cardholderName,
    cardExpirationMonth: card.expirationMonth,
    cardExpirationYear:
      card.expirationYear.length === 2 ? `20${card.expirationYear}` : card.expirationYear,
    securityCode: card.securityCode,
    identificationType: digits.length > 11 ? "CNPJ" : "CPF",
    identificationNumber: digits,
  });
  if (!result?.id) throw new Error("Confira os dados do cartão.");
  return result.id as string;
}
