import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { onlyDigits } from "@/hooks/useShipping";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PaymentTabs, type PaymentMethod } from "@/components/checkout/PaymentTabs";
import { emptyCardForm, type CardFormState } from "@/components/checkout/CardPanel";
import { PixPanel } from "@/components/checkout/PixPanel";
import { createCardToken, mpCredentialsMissing } from "@/lib/mercadopago";

interface LocationState {
  workshopTitle?: string;
  totalCents?: number;
  spots?: number;
  fullName?: string;
  phone?: string;
}

/** Pagamento das vagas de oficina — a vaga só é garantida após o pagamento */
const WorkshopCheckout = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const { state } = useLocation() as { state: LocationState | null };
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: state?.fullName ?? "",
    email: "",
    phone: state?.phone ?? "",
    document: "",
  });
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [card, setCard] = useState<CardFormState>(emptyCardForm);
  const [result, setResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalCents = state?.totalCents ?? 0;
  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (!registrationId) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center space-y-6">
          <h1 className="font-serif text-4xl">Inscrição não encontrada</h1>
          <Button asChild className="rounded-none px-8">
            <Link to="/oficinas">Ver oficinas</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const doc = onlyDigits(form.document);
    if (form.name.trim().length < 3)
      return toast({ title: "Informe seu nome completo", variant: "destructive" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      return toast({ title: "E-mail inválido", variant: "destructive" });
    if (doc.length !== 11 && doc.length !== 14)
      return toast({ title: "CPF inválido", variant: "destructive" });

    setSubmitting(true);
    try {
      let cardPayload: any = null;
      if (method === "card") {
        if (mpCredentialsMissing())
          throw new Error("O pagamento com cartão ainda não está ativo.");
        const token = await createCardToken({
          cardNumber: card.cardNumber,
          cardholderName: card.cardholderName,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear,
          securityCode: card.securityCode,
          identificationNumber: card.identificationNumber || form.document,
        });
        cardPayload = {
          token,
          installments: card.installments,
          paymentMethodId: card.paymentMethodId,
          issuerId: card.issuerId,
        };
      }

      const { data, error } = await supabase.functions.invoke("mp-create-payment", {
        body: {
          origin: window.location.origin,
          method,
          card: cardPayload,
          workshopRegistrationId: registrationId,
          items: [],
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            document: doc,
          },
        },
      });

      if (error && !data) throw error;
      if (data?.error) throw new Error(data.error);

      if (method === "card") {
        navigate(`/pedido/${data.orderId}`);
        return;
      }
      setResult({ ...data, method });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast({
        title: "Não foi possível iniciar o pagamento",
        description: err?.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Layout>
        <PaymentTestModeBanner />
        <section className="py-12 md:py-16">
          <div className="container-narrow space-y-8">
            <h1 className="font-serif text-4xl md:text-5xl">Pague com Pix</h1>
            <p className="text-sm text-muted-foreground">
              Pedido {result.orderNumber} — total {formatBRL(result.totalCents)}. Sua vaga
              é confirmada automaticamente assim que o Pix cair.
            </p>
            <PixPanel
              qrCodeBase64={result.pix?.qrCodeBase64 ?? null}
              qrCode={result.pix?.qrCode ?? null}
              expiresAt={result.pix?.expiresAt}
            />
            <div className="text-center">
              <Button asChild variant="outline" className="rounded-none px-8">
                <Link to={`/pedido/${result.orderId}`}>Ver meu pedido</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <Link
          to="/oficinas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para as oficinas
        </Link>
      </div>

      <section className="py-12 md:py-16">
        <div className="container-narrow space-y-8">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl">Pagamento da oficina</h1>
            {state?.workshopTitle && (
              <p className="text-muted-foreground mt-3">
                {state.workshopTitle} · {state?.spots ?? 1}{" "}
                {(state?.spots ?? 1) === 1 ? "vaga" : "vagas"}
              </p>
            )}
            {totalCents > 0 && (
              <p className="font-serif text-3xl mt-4">{formatBRL(totalCents)}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              A vaga só fica reservada depois que o pagamento for confirmado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CPF *</Label>
                <Input
                  id="document"
                  value={form.document}
                  onChange={(e) => set("document", e.target.value)}
                  className="rounded-none"
                />
              </div>
            </div>

            <PaymentTabs
              method={method}
              onMethodChange={setMethod}
              card={card}
              onCardChange={setCard}
              totalCents={totalCents}
              methods={["pix", "card"]}
            />

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase"
            >
              {submitting ? "Processando…" : "Pagar e garantir minha vaga"}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default WorkshopCheckout;
