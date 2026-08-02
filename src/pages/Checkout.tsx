import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { GIFT_WRAP_CENTS } from "@/data/site";
import { SmartImage } from "@/components/SmartImage";
import { Layout } from "@/components/Layout";
import { useCart, unitPriceCents } from "@/hooks/useCart";
import { useShippingQuote, onlyDigits } from "@/hooks/useShipping";
import { formatBRL } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { saveGuestOrder } from "@/lib/guestOrders";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PaymentTabs, type PaymentMethod } from "@/components/checkout/PaymentTabs";
import { emptyCardForm, type CardFormState } from "@/components/checkout/CardPanel";
import { PixPanel } from "@/components/checkout/PixPanel";
import { BoletoPanel } from "@/components/checkout/BoletoPanel";
import { createCardToken, mpCredentialsMissing } from "@/lib/mercadopago";


const Checkout = () => {
  const { toast } = useToast();
  const { items, getSubtotalCents, clearCart, isGift, giftMessage } = useCart();
  const subtotalCents = getSubtotalCents();


  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    postalCode: "",
    addressLine: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  const { data: shipping, isFetching: loadingShipping } = useShippingQuote(
    form.postalCode,
    subtotalCents
  );

  const shippingCents = shipping?.priceCents ?? 0;
  const giftWrapCents = isGift ? GIFT_WRAP_CENTS : 0;
  const totalCents = subtotalCents + shippingCents + giftWrapCents;

  const errorKeyOf: Record<string, string> = {
    postalCode: "cep",
    addressLine: "address",
    addressNumber: "number",
  };

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    const key = errorKeyOf[field] ?? field;
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const errClass = (key: string) =>
    errors[key] ? "border-destructive focus-visible:ring-destructive" : "";

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="text-xs text-destructive">{errors[name]}</p>
    ) : null;


  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center space-y-6">
          <h1 className="font-serif text-4xl">Sua sacola está vazia</h1>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/produtos">Ver peças</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    const digits = (v: string) => onlyDigits(v);

    if (form.name.trim().length < 3) e.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      e.email = "E-mail inválido. Exemplo: nome@email.com";
    if (digits(form.phone).length < 10)
      e.phone = "Telefone inválido. Inclua o DDD, ex.: (49) 99999-9999";
    const doc = digits(form.document);
    if (doc.length !== 11 && doc.length !== 14)
      e.document = "CPF deve ter 11 dígitos e CNPJ, 14.";
    if (digits(form.postalCode).length !== 8)
      e.cep = "CEP inválido. Use 8 dígitos, ex.: 89560-000";
    else if (!shipping)
      e.cep = "Ainda não conseguimos calcular o frete para este CEP.";
    if (!form.neighborhood.trim()) e.neighborhood = "Informe o bairro.";
    if (!form.addressLine.trim()) e.address = "Informe a rua/avenida.";
    if (!form.addressNumber.trim()) e.number = "Informe o número.";
    if (!form.city.trim()) e.city = "Informe a cidade.";
    if (!/^[A-Z]{2}$/.test(form.state.trim())) e.state = "Use a sigla do estado, ex.: SC";

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      const el = document.getElementById(firstKey);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      toast({
        title: "Confira os dados destacados",
        description: found[firstKey],
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          environment: getStripeEnvironment(),
          origin: window.location.origin,
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            document: onlyDigits(form.document),
            postalCode: onlyDigits(form.postalCode),
            addressLine: form.addressLine,
            addressNumber: form.addressNumber,
            complement: form.complement || null,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            notes: form.notes || null,
          },
          isGift,
          giftMessage: isGift ? giftMessage || null : null,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            values: Object.fromEntries(
              (i.personalizationValues ?? []).map((v) => [v.fieldId, v.value])
            ),
          })),
        },
      });

      if (error) throw error;
      if (!data?.clientSecret) throw new Error(data?.error ?? "Pagamento indisponível");

      // Guarda uma cópia no aparelho para quem comprou sem conta
      saveGuestOrder({
        id: data.orderId,
        order_number: data.orderNumber,
        created_at: new Date().toISOString(),
        customer_name: form.name,
        address_line: form.addressLine,
        address_number: form.addressNumber,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        subtotal_cents: data.subtotalCents,
        shipping_cents: data.shippingCents,
        total_cents: data.totalCents,
        installments: 1,
        payment_method: "card",
        order_items: items.map((i, idx) => ({
          id: `${data.orderId}-${idx}`,
          product_name: i.product.name,
          unit_price_cents: unitPriceCents(i),
          quantity: i.quantity,
          personalization_text: i.personalization ?? null,
        })),
      });

      clearCart();
      setClientSecret(data.clientSecret);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não foi possível finalizar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (clientSecret) {
    return (
      <Layout>
        <PaymentTestModeBanner />
        <section className="py-12 md:py-16">
          <div className="container-narrow space-y-8">
            <h1 className="font-serif text-4xl md:text-5xl">Pagamento</h1>
            <StripeEmbeddedCheckout clientSecret={clientSecret} />
          </div>
        </section>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <Link
          to="/sacola"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a sacola
        </Link>
      </div>

      <section className="py-12 md:py-16">
        <div className="container-full">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-5xl mb-12"
          >
            Finalizar pedido
          </motion.h1>

          <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-5">
                <h2 className="font-serif text-2xl">Seus dados</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" className={`rounded-none ${errClass("name")}`} value={form.name} onChange={(e) => set("name", e.target.value)} />
                    <FieldError name="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" className={`rounded-none ${errClass("email")}`} value={form.email} onChange={(e) => set("email", e.target.value)} />
                    <FieldError name="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input id="phone" className={`rounded-none ${errClass("phone")}`} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    <FieldError name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF ou CNPJ</Label>
                    <Input id="document" className={`rounded-none ${errClass("document")}`} value={form.document} onChange={(e) => set("document", e.target.value)} />
                    <FieldError name="document" />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h2 className="font-serif text-2xl">Entrega</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" maxLength={9} className={`rounded-none ${errClass("cep")}`} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
                    <FieldError name="cep" />
                    {loadingShipping && (
                      <p className="text-xs text-muted-foreground">Calculando frete…</p>
                    )}
                    {shipping && (
                      <p className="text-xs text-muted-foreground">
                        {shipping.regionName} — entrega em até {shipping.deliveryDays} dias úteis
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" className={`rounded-none ${errClass("neighborhood")}`} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
                    <FieldError name="neighborhood" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" className={`rounded-none ${errClass("address")}`} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
                    <FieldError name="address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" className={`rounded-none ${errClass("number")}`} value={form.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
                    <FieldError name="number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" className="rounded-none" value={form.complement} onChange={(e) => set("complement", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" className={`rounded-none ${errClass("city")}`} value={form.city} onChange={(e) => set("city", e.target.value)} />
                    <FieldError name="city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input id="state" maxLength={2} className={`rounded-none uppercase ${errClass("state")}`} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
                    <FieldError name="state" />
                  </div>

                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações do pedido</Label>
                  <Textarea id="notes" className="rounded-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-2xl">Pagamento</h2>
                <p className="text-sm text-muted-foreground">
                  O pagamento é feito aqui mesmo, na próxima etapa, com cartão em
                  ambiente seguro. Nada é cobrado antes de você confirmar.
                </p>
              </div>
            </div>


            <div className="lg:col-span-5">
              <div className="bg-linen p-8 lg:sticky lg:top-28 space-y-6">
                <h2 className="font-serif text-2xl">Resumo</h2>

                <div className="space-y-5">
                  {items.map((item) => (
                    <div key={item.key} className="flex gap-4">
                      <div className="w-16 h-20 flex-shrink-0 overflow-hidden bg-muted/30">
                        <SmartImage src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-serif text-base">{item.product.name}</p>
                        {item.personalization && (
                          <p className="text-muted-foreground">“{item.personalization}”</p>
                        )}
                        <p className="text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="text-sm">
                        {formatBRL(
                          unitPriceCents(item) *
                            item.quantity
                        )}
                      </p>

                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatBRL(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>
                      {!shipping
                        ? "Informe o CEP"
                        : shippingCents === 0
                        ? "Grátis"
                        : formatBRL(shippingCents)}
                    </span>
                  </div>
                  {isGift && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Caixa para presente
                      </span>
                      <span>
                        {giftWrapCents > 0 ? formatBRL(giftWrapCents) : "Cortesia"}
                      </span>
                    </div>
                  )}
                </div>


                <div className="border-t border-border pt-5">
                  <div className="flex justify-between font-serif text-xl">
                    <span>Total</span>
                    <span>{formatBRL(totalCents)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Parcelamento disponível conforme o seu cartão.
                  </p>

                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Ir para o pagamento

                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
