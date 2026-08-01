import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import {
  Product,
  formatBRL,
  installmentLabel,
  activeSaleCents,
  effectivePriceCents,
  isLowStock,
} from "@/data/products";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/SmartImage";

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: "default" | "large";
}

export const ProductCard = ({ product, index = 0, variant = "default" }: ProductCardProps) => {
  const { toggle, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(product.id);
  const collectionName = product.collectionName;
  const hasSecondImage = product.images.length > 1;
  const outOfStock = product.stock <= 0;
  const sale = activeSaleCents(product);
  const price = effectivePriceCents(product);
  const lowStock = isLowStock(product);
  const discountPct =
    sale != null && product.priceCents
      ? Math.round((1 - sale / product.priceCents) * 100)
      : null;


  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    toast({
      title: inWishlist ? "Removido dos favoritos" : "Salvo nos favoritos",
      description: product.name,
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group"
    >
      <Link to={`/produto/${product.slug}`} className="block">
        {/* Imagem */}
        <div
          className={cn(
            "relative overflow-hidden bg-muted/50 mb-5",
            variant === "large" ? "aspect-[3/4]" : "aspect-[4/5]"
          )}
        >
          <SmartImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 ease-out",
              hasSecondImage
                ? "group-hover:-translate-x-full"
                : "group-hover:scale-105"
            )}
          />

          {hasSecondImage && (
            <SmartImage
              src={product.images[1]}
              alt={`${product.name} — outra vista`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-0"
            />
          )}


          {/* Favoritar */}
          <button
            onClick={handleWishlistToggle}
            aria-label={inWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={cn(
              "absolute top-5 right-5 p-2.5 rounded-full transition-all duration-500",
              "bg-background/90 backdrop-blur-md hover:bg-background shadow-sm",
              "md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0",
              inWishlist && "md:opacity-100 md:translate-y-0"
            )}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all duration-300",
                inWishlist ? "fill-primary text-primary scale-110" : "text-foreground"
              )}
            />
          </button>

          {/* Selos */}
          <div className="absolute top-5 left-5 flex flex-col gap-2">
            {product.new && (
              <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-foreground text-background">
                Novidade
              </span>
            )}
            {product.isPersonalizable && (
              <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary text-primary-foreground">
                Personalizável
              </span>
            )}
            {sale != null && (
              <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary text-primary-foreground">
                Oferta
              </span>
            )}
            {lowStock && (
              <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-background text-foreground border border-border">
                Últimas unidades
              </span>
            )}
            {outOfStock && (
              <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-muted text-muted-foreground">
                Esgotada
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
            <span className="px-6 py-2.5 text-xs font-medium tracking-[0.15em] uppercase bg-background/95 backdrop-blur-md text-foreground shadow-lg">
              Ver peça
            </span>
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-2">
          {collection && (
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground/70 transition-colors duration-300 group-hover:text-primary">
              {collection.name}
            </p>
          )}

          <h3 className="font-serif text-xl text-foreground transition-colors duration-300 group-hover:text-primary leading-snug">
            {product.name}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
            {product.description}
          </p>

          <div className="pt-1">
            <p className="text-base font-medium text-foreground tracking-wide flex items-baseline gap-2">
              <span className={sale != null ? "text-primary" : undefined}>
                {formatBRL(price)}
              </span>
              {sale != null && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatBRL(product.priceCents)}
                </span>
              )}
            </p>
            {installmentLabel(price, product.maxInstallments) && (
              <p className="text-xs text-muted-foreground/70 tracking-wide mt-0.5">
                {installmentLabel(price, product.maxInstallments)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
