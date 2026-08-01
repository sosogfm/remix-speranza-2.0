import { useCallback } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

interface Props {
  clientSecret: string;
}

/** Formulário de pagamento embutido na própria página */
export function StripeEmbeddedCheckout({ clientSecret }: Props) {
  const fetchClientSecret = useCallback(async () => clientSecret, [clientSecret]);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
