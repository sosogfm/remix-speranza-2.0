import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ChevronLeft, ChevronRight, ShoppingBag, Heart, MessageCircle } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { Layout } from "@/components/Layout";
import { Seo, SITE_URL } from "@/components/Seo";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import {
  PersonalizationFields,
  buildPersonalizationValues,
  missingRequiredField,
} from "@/components/PersonalizationFields";
import {
  formatBRL,
  installmentLabel,
  activeSaleCents,
  effectivePriceCents,
  isLowStock,
} from "@/data/products";
import { useProductInfoBlocks } from "@/hooks/useSiteContent";
import { useSignedUrls } from "@/lib/storage";
import { useProduct, useProducts } from "@/hooks/useProducts";
import {
  usePersonalizationFields,
  totalExtraCents,
  sizeBaseCents,
  selectedOptionImages,
  optionImageList,
} from "@/hooks/usePersonalization";
import { site } from "@/data/site";

import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { data: fields = [] } = usePersonalizationFields(product?.id);
  const { data: infoBlocks = [] } = useProductInfoBlocks(product?.id);
  const optionImagePaths = fields.flatMap((f) =>
    (f.options ?? []).flatMap((o) => optionImageList(f.optionImages, o))
  );
  const galleryPaths = (product?.images ?? []).filter(
    (i) => !/^(https?:|data:|blob:|\/)/i.test(i)
  );
  const { data: signedImages = {} } = useSignedUrls([
    ...optionImagePaths,
    ...galleryPaths,
  ]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const { addItem: addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Layout>
        <div className="container-wide py-16 md:py-28 text-center text-muted-foreground">
          Carregando peça…
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-wide py-16 md:py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">Peça não encontrada</h1>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/produtos">Ver todas as peças</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const collection = product.collectionName
    ? { name: product.collectionName, slug: product.collection }
    : undefined;
  const relatedProducts = allProducts
    .filter((p) => p.collection === product.collection && p.id !== product.id)
    .slice(0, 3);
  const outOfStock = product.stock <= 0;
  const sale = activeSaleCents(product);
  const basePrice = effectivePriceCents(product);
  const sizePrice = sizeBaseCents(fields, values);
  const extraCents = totalExtraCents(fields, values);
  const unitCents = (sizePrice ?? basePrice) + extraCents;
  const compareAtCents =
    sizePrice != null ? null : sale != null ? product.priceCents : null;
  const parcelas = installmentLabel(unitCents, product.maxInstallments);
  const optionImages = selectedOptionImages(fields, values);
  const gallery = optionImages.length ? optionImages : product.images;
  const slideIndex = Math.min(currentImageIndex, Math.max(gallery.length - 1, 0));

  const quoteUrl = `${site.whatsapp}?text=${encodeURIComponent(
    `Oi Júlia! Gostaria de um orçamento para: ${product.name}`
  )}`;

  const handleAddToCart = () => {
    if (outOfStock) return;
    const missing = missingRequiredField(fields, values);
    if (missing) {
      toast({
        title: "Personalização obrigatória",
        description: `Preencha o campo "${missing.label}" para continuar.`,
        variant: "destructive",
      });
      return;
    }
    addToCart(product, quantity, buildPersonalizationValues(fields, values), unitCents);
    toast({ title: "Adicionado à sacola", description: `${quantity} × ${product.name}` });
    setQuantity(1);
    setValues({});
  };

  const handleWishlist = async () => {
    await toggle(product.id);
  };

  const nextImage = () =>
    setCurrentImageIndex((p) => (p + 1) % Math.max(gallery.length, 1));
  const prevImage = () =>
    setCurrentImageIndex(
      (p) => (p - 1 + Math.max(gallery.length, 1)) % Math.max(gallery.length, 1)
    );


  const seoImage = (product.images ?? []).find((i) => /^https?:/i.test(i)) ?? null;
  const seoPrice = ((effectivePriceCents(product) || product.priceCents) / 100).toFixed(2);

  return (
    <Layout>
      <Seo
        title={`${product.name} — Speranza Ateliê`}
        description={
          product.description ||
          `${product.name} em porcelana pintada à mão por Júlia Brandalise.`
        }
        path={`/produto/${product.slug}`}
        image={seoImage}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || product.longDescription || undefined,
          image: seoImage ? [seoImage] : undefined,
          brand: { "@type": "Brand", name: "Speranza Ateliê" },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/produto/${product.slug}`,
            price: seoPrice,
            priceCurrency: "BRL",
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }}
      />
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/produtos" className="hover:text-foreground transition-colors">
            Loja
          </Link>
          <span className="text-border">/</span>
          {collection && (
            <>
              <Link
                to={`/produtos?colecao=${collection.slug}`}
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
                <div
                  className="flex h-full w-full transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                >
                  {gallery.map((image, i) => (
                    <img
                      key={`${image}-${i}`}
                      src={signedImages[image] || image}
                      alt={`${product.name} — porcelana artesanal Speranza Ateliê`}
                      className="w-full h-full shrink-0 object-cover"
                    />
                  ))}
                </div>

                {gallery.length > 1 && (
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
                  {sale != null && (
                    <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary text-primary-foreground">
                      Oferta
                    </span>
                  )}
                  {isLowStock(product) && (
                    <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-background text-foreground border border-border">
                      Últimas unidades
                    </span>
                  )}
                  {outOfStock && (
                    <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground">
                      Esgotado
                    </span>
                  )}
                </div>
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {gallery.map((image, index) => (
                    <button
                      key={`${image}-thumb-${index}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden transition-all duration-300",
                        index === slideIndex ? "ring-2 ring-foreground" : "opacity-60"
                      )}
                    >
                      <SmartImage src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              {collection && (
                <Link
                  to={`/produtos?colecao=${collection.slug}`}
                  className="inline-block text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5"
                >
                  {collection.name}
                </Link>
              )}

              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-5 leading-[1.05]">
                {product.name}
              </h1>

              <p className="text-2xl font-serif mb-1 flex items-baseline gap-3">
                {product.isQuoteOnly && (
                  <span className="text-sm text-muted-foreground">A partir de</span>
                )}
                <span>{formatBRL(unitCents)}</span>
                {compareAtCents && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatBRL(compareAtCents)}
                  </span>
                )}
              </p>
              {sizePrice == null && extraCents > 0 && (
                <p className="text-xs text-muted-foreground mb-1">
                  Inclui {formatBRL(extraCents)} de personalização
                </p>
              )}
              {parcelas && !product.isQuoteOnly && (
                <p className="text-sm text-muted-foreground mb-8">{parcelas}</p>
              )}
              {product.isQuoteOnly && (
                <p className="text-sm text-muted-foreground mb-8">
                  O valor final depende da arte escolhida. Me chame no WhatsApp para
                  fazermos juntas o seu orçamento.
                </p>
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
                  <span>{outOfStock ? "Esgotado" : `${product.stock} disponível(is)`}</span>
                </div>
              </div>

              {!outOfStock && !product.isQuoteOnly && (
                <PersonalizationFields
                  fields={fields}
                  values={values}
                  onChange={(id, v) => setValues((s) => ({ ...s, [id]: v }))}
                />
              )}

              <div className="flex items-center gap-4">
                {product.isQuoteOnly ? (
                  <Button
                    asChild
                    className="flex-1 rounded-none h-12 text-sm tracking-[0.15em] uppercase"
                  >
                    <a href={quoteUrl} target="_blank" rel="noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Pedir orçamento
                    </a>
                  </Button>
                ) : (
                  <>
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
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={handleWishlist}
                  aria-label="Favoritar peça"
                  className="rounded-none h-12 w-12 p-0"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      isInWishlist(product.id) && "fill-primary text-primary"
                    )}
                  />
                </Button>
              </div>

              {infoBlocks.length > 0 && (
                <div className="mt-10 border-t border-border pt-6 space-y-3 text-xs text-muted-foreground leading-relaxed">
                  {infoBlocks.map((b) => (
                    <p key={b.id}>
                      <span className="font-semibold text-foreground">{b.title}:</span>{" "}
                      {b.body}
                    </p>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-14 md:py-20 border-t border-border">
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
