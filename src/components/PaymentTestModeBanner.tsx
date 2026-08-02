import { mpCredentialsMissing } from "@/lib/mercadopago";

export function PaymentTestModeBanner() {
  if (mpCredentialsMissing()) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
        Estamos finalizando a ativação do pagamento — em instantes tudo estará no ar.
      </div>
    );
  }
  return null;
}
