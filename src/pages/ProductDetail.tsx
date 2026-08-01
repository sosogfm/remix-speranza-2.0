import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { collections, formatBRL, installmentLabel } from "@/data/products";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [personalization, setPersonalization] = useState("");
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Layout>
        <div className="container-wide py-28 text-center text-muted-foreground">
          Carregando peça…
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-wide py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">Peça não encontrada</h1>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/products">Ver todas as peças</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const collection = collections.find((c) => c.slug === product.collection);
  const relatedProducts = allProducts
    .filter((p) => p.collection === product.collection && p.id !== product.id)
    .slice(0, 3);
  const outOfStock = product.stock <= 0;
  const parcelas = installmentLabel(product.priceCents, product.maxInstallments);

  const handleAddToCart = () => {
    if (outOfStock) return;
    if (product.isPersonalizable && !personalization.trim()) {
      toast({
        title: "Personalização obrigatória",
        description: `Preencha o campo "${product.personalizationLabel}" para continuar.`,
        variant: "destructive",
      });
      return;
    }
    addToCart(product, quantity, product.isPersonalizable ? personalization.trim() : undefined);
    toast({
      title: "Adicionado à sacola",
      description: `${quantity} × ${product.name}`,
    });
    setQuantity(1);
    setPersonalization("");
  };

  const nextImage = () =>
    setCurrentImageIndex((p) => (p === product.images.length - 1 ? 0 : p + 1));
  const prevImage = () =>
    setCurrentImageIndex((p) => (p === 0 ? product.images.length - 1 : p - 1));

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition-colors">
            Loja
          </Link>
          <span className="text-border">/</span>
          {collection && (
            <>
              <Link
                to={`/products?collection=${collection.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {collection.name}
              </Link>
              <span className="text-border">/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted/30 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={product.images[currentImageIndex]}
                    alt={`${product.name} — porcelana artesanal Speranza Ateliê`}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-5 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-md"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-md"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute top-5 left-5 flex flex-col gap-2">
                  {product.new && (
                    <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-foreground text-background">
                      Novo
                    </span>
                  )}
                  {outOfStock && (
                    <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground">
                      Esgotado
                    </span>
                  )}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-24 h-24 overflow-hidden transition-all duration-300",
                        index === currentImageIndex ? "ring-2 ring-foreground" : "opacity-60"
                      )}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              {collection && (
                <Link
                  to={`/products?collection=${collection.slug}`}
                  className="inline-block text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5"
                >
                  {collection.name}
                </Link>
              )}

              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-5 leading-[1.05]">
                {product.name}
              </h1>

              <p className="text-2xl font-serif mb-1">{formatBRL(product.priceCents)}</p>
              {parcelas && (
                <p className="text-sm text-muted-foreground mb-8">{parcelas}</p>
              )}

              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.longDescription}
              </p>

              <div className="space-y-3 text-sm border-y border-border py-6 mb-8">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material</span>
                  <span>{product.materials}</span>
                </div>
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensões</span>
                    <span>{product.dimensions}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estoque</span>
                  <span>
                    {outOfStock ? "Esgotado" : `${product.stock} disponível(is)`}
                  </span>
                </div>
              </div>

              {product.isPersonalizable && !outOfStock && (
                <div className="mb-8 space-y-2">
                  <Label htmlFor="personalization" className="text-sm">
                    {product.personalizationLabel} (peça personalizável)
                  </Label>
                  <Input
                    id="personalization"
                    value={personalization}
                    maxLength={product.personalizationMaxLength}
                    onChange={(e) => setPersonalization(e.target.value)}
                    placeholder={`Até ${product.personalizationMaxLength} caracteres`}
                    className="rounded-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Peças personalizadas são feitas sob encomenda e não têm troca.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  max={Math.max(product.stock, 1)}
                />
                <Button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className="flex-1 rounded-none h-12 text-sm tracking-[0.15em] uppercase"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {outOfStock ? "Esgotado" : "Adicionar à sacola"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-20 border-t border-border">
          <div className="container-full">
            <h2 className="font-serif text-3xl mb-10">Você também pode gostar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetail;
