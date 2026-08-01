import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/products";
import { Button } from "@/components/ui/button";

const methodLabels: Record<string, string> = {
  pix: "Pix (QR Code)",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  boleto: "Boleto bancário",
};

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return order;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center text-muted-foreground">
          Carregando pedido…
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center space-y-6">
          <h1 className="font-serif text-4xl">Pedido não encontrado</h1>
          <Button asChild className="rounded-none">
            <Link to="/produtos">Voltar à loja</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container-narrow space-y-10">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h1 className="font-serif text-4xl md:text-5xl">Pedido recebido</h1>
            <p className="text-muted-foreground">
              Pedido <span className="text-foreground">{data.order_number}</span> —
              enviaremos as instruções de pagamento por e-mail e WhatsApp.
            </p>
          </div>

          <div className="border border-border p-8 space-y-6">
            <div className="space-y-4">
              {data.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-serif text-base">{item.product_name}</p>
                    {item.personalization_text && (
                      <p className="text-muted-foreground">
                        Personalização: {item.personalization_text}
                      </p>
                    )}
                    <p className="text-muted-foreground">Qtd: {item.quantity}</p>
                  </div>
                  <span>{formatBRL(item.unit_price_cents * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBRL(data.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>
                  {data.shipping_cents === 0 ? "Grátis" : formatBRL(data.shipping_cents)}
                </span>
              </div>
              <div className="flex justify-between font-serif text-xl pt-3">
                <span>Total</span>
                <span>{formatBRL(data.total_cents)}</span>
              </div>
            </div>

            <div className="border-t border-border pt-5 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Pagamento: </span>
                {methodLabels[data.payment_method] ?? data.payment_method}
                {data.payment_method === "credit_card" && ` em ${data.installments}x`}
              </p>
              <p>
                <span className="text-muted-foreground">Entrega: </span>
                {data.address_line}, {data.address_number} — {data.neighborhood},{" "}
                {data.city}/{data.state}
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button asChild variant="outline" className="rounded-none px-8">
              <Link to="/produtos">Continuar comprando</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderConfirmation;
