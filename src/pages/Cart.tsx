import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2, Gift } from "lucide-react";
import { GIFT_WRAP_CENTS } from "@/data/site";
import { SmartImage } from "@/components/SmartImage";
import { Layout } from "@/components/Layout";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart, unitPriceCents, useCartCleanup } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/data/products";

const Cart = () => {
  useCartCleanup();
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotalCents,
    isGift,
    setGift,
    giftMessage,
    setGiftMessage,
  } = useCart();
  const subtotalCents = getSubtotalCents();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-narrow py-16 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
            <h1 className="font-serif text-4xl mb-4">Sua sacola está vazia</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Conheça as porcelanas pintadas à mão do ateliê e encontre a peça
              que combina com você.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
            >
              <Link to="/produtos">
                Ver a loja
                <ArrowRight className="ml-3 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/produtos" className="hover:text-foreground transition-colors">
            Loja
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground">Sacola</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl md:text-5xl mb-12"
          >
            Sua sacola
          </motion.h1>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="space-y-0">
                {items.map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex gap-6 py-8 border-b border-border"
                  >
                    <Link
                      to={`/produto/${item.product.slug}`}
                      className="w-28 h-32 md:w-36 md:h-44 flex-shrink-0 overflow-hidden bg-muted/30 group"
                    >
                      <SmartImage
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <Link
                          to={`/produto/${item.product.slug}`}
                          className="font-serif text-lg md:text-xl hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.product.description}
                        </p>
                        {item.personalization && (
                          <p className="text-sm mt-2">
                            <span className="text-muted-foreground">
                              Personalização:{" "}
                            </span>
                            {item.personalization}
                          </p>
                        )}
                        <p className="font-serif text-lg mt-3">
                          {formatBRL(unitPriceCents(item))}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <QuantitySelector
                          quantity={item.quantity}
                          max={Math.max(item.product.stock, 1)}
                          onQuantityChange={(qty) => updateQuantity(item.key, qty)}
                        />
                        <button
                          onClick={() => removeItem(item.key)}
                          aria-label="Remover peça"
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/produtos"
                className="inline-flex items-center gap-2 mt-8 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Continuar comprando
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="bg-linen p-8 lg:sticky lg:top-28 space-y-8">
                <h2 className="font-serif text-2xl">Resumo do pedido</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatBRL(subtotalCents)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O frete é calculado na próxima etapa, depois que você
                    informar o seu CEP e endereço.
                  </p>
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={isGift}
                      onCheckedChange={(v) => setGift(Boolean(v))}
                      className="mt-0.5"
                    />
                    <span className="text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Gift className="w-4 h-4 text-primary" />
                        É um presente
                      </span>
                      <span className="text-muted-foreground">
                        Caixa cartonada com as cores da marca + fita de cetim
                        {" "}(+{formatBRL(GIFT_WRAP_CENTS)}), sem mostrar o valor.
                      </span>
                    </span>
                  </label>

                  {isGift && (
                    <Textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Mensagem do cartãozinho (opcional)"
                      maxLength={300}
                      className="rounded-none min-h-24 bg-background"
                    />
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-serif text-xl">
                    <span>Total parcial</span>
                    <span>
                      {formatBRL(subtotalCents + (isGift ? GIFT_WRAP_CENTS : 0))}
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
                >
                  <Link to="/finalizar">
                    Finalizar compra
                    <ArrowRight className="ml-3 w-4 h-4" />
                  </Link>
                </Button>

                <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-1">
                      Envio
                    </p>
                    <p className="text-xs text-muted-foreground">
                      De Videira/SC para todo o Brasil
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-1">
                      Feito à mão
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Peças únicas, sob encomenda
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
