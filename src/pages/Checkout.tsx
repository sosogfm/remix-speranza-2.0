import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { GIFT_WRAP_CENTS } from "@/data/site";
import { Layout } from "@/components/Layout";
import { useCart } from "@/hooks/useCart";
import { useShippingQuote, onlyDigits } from "@/hooks/useShipping";
import { formatBRL, installmentLabel } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { saveGuestOrder } from "@/lib/guestOrders";

const paymentMethods = [
  { value: "pix", label: "Pix (QR Code)" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "boleto", label: "Boleto bancário" },
];

const Checkout = () => {
  const navigate = useNavigate();
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
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [installments, setInstallments] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const { data: shipping, isFetching: loadingShipping } = useShippingQuote(
    form.postalCode,
    subtotalCents
  );

  const shippingCents = shipping?.priceCents ?? 0;
  const giftWrapCents = isGift ? GIFT_WRAP_CENTS : 0;
  const totalCents = subtotalCents + shippingCents + giftWrapCents;

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onlyDigits(form.postalCode).length !== 8 || !shipping) {
      toast({
        title: "CEP inválido",
        description: "Informe um CEP válido para calcularmos o frete.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("place_guest_order", {
        _order: {
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_document: onlyDigits(form.document),
          address_line: form.addressLine,
          address_number: form.addressNumber,
          address_complement: form.complement || null,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
          postal_code: onlyDigits(form.postalCode),
          notes: form.notes || null,
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
          total_cents: totalCents,
          installments: Number(installments),
          payment_method: paymentMethod,
          is_gift: isGift,
          gift_message: isGift ? giftMessage || null : null,
          gift_wrap_cents: giftWrapCents,
        },
        _items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          unit_price_cents: i.product.priceCents + (i.extraCents || 0),
          quantity: i.quantity,
          personalization_text: i.personalization ?? null,
        })),
      });

      if (error) throw error;
      const order = Array.isArray(data) ? data[0] : (data as any);
      if (!order?.id) throw new Error("Pedido não criado");

      // Guarda uma cópia no aparelho para quem comprou sem conta
      saveGuestOrder({
        id: order.id,
        order_number: order.order_number,
        created_at: new Date().toISOString(),
        customer_name: form.name,
        address_line: form.addressLine,
        address_number: form.addressNumber,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        installments: Number(installments),
        payment_method: paymentMethod,
        order_items: items.map((i, idx) => ({
          id: `${order.id}-${idx}`,
          product_name: i.product.name,
          unit_price_cents: i.product.priceCents + (i.extraCents || 0),
          quantity: i.quantity,
          personalization_text: i.personalization ?? null,
        })),
      });

      clearCart();
      navigate(`/pedido/${order.id}`);
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

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-5">
                <h2 className="font-serif text-2xl">Seus dados</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" required className="rounded-none" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" required className="rounded-none" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input id="phone" required className="rounded-none" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF ou CNPJ</Label>
                    <Input id="document" required className="rounded-none" value={form.document} onChange={(e) => set("document", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h2 className="font-serif text-2xl">Entrega</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" required maxLength={9} className="rounded-none" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
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
                    <Input id="neighborhood" required className="rounded-none" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" required className="rounded-none" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" required className="rounded-none" value={form.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" className="rounded-none" value={form.complement} onChange={(e) => set("complement", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" required className="rounded-none" value={form.city} onChange={(e) => set("city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input id="state" required maxLength={2} className="rounded-none uppercase" value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações do pedido</Label>
                  <Textarea id="notes" className="rounded-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
              </div>

              <div className="space-y-5">
                <h2 className="font-serif text-2xl">Pagamento</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentMethod === "credit_card" && (
                    <div className="space-y-2">
                      <Label>Parcelamento</Label>
                      <Select value={installments} onValueChange={setInstallments}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {[1, 2, 3].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}x de {formatBRL(Math.round(totalCents / n))} sem juros
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  O pedido é registrado agora e as instruções de pagamento aparecem na
                  próxima tela.
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
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
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
                          (item.product.priceCents + (item.extraCents || 0)) *
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
                  {paymentMethod === "credit_card" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {installmentLabel(totalCents, Number(installments))}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Finalizar pedido
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
