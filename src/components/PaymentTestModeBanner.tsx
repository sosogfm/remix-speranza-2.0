const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
        O pagamento ainda não está ativo para receber de verdade.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-muted border-b border-border px-4 py-2 text-center text-sm text-muted-foreground">
        Ambiente de teste: nenhum pagamento real é cobrado por aqui.
      </div>
    );
  }
  return null;
}
