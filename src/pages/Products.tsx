import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { activeSaleCents, effectivePriceCents, isLowStock } from "@/data/products";
import { useProducts, useCollections } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCollection = searchParams.get("colecao") ?? "all";
  const [sort, setSort] = useState("featured");
  const [onlyPersonalizable, setOnlyPersonalizable] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlySale, setOnlySale] = useState(false);
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const { data: products = [], isLoading } = useProducts();
  const { data: collections = [] } = useCollections();

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCollection !== "all") {
      list = list.filter((p) => p.collection === activeCollection);
    }
    if (onlyPersonalizable) list = list.filter((p) => p.isPersonalizable);
    if (onlyInStock) list = list.filter((p) => p.stock > 0);
    if (onlySale) list = list.filter((p) => activeSaleCents(p) != null);
    if (onlyLowStock) list = list.filter((p) => isLowStock(p));

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => effectivePriceCents(a) - effectivePriceCents(b));
        break;
      case "price-desc":
        list.sort((a, b) => effectivePriceCents(b) - effectivePriceCents(a));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        break;
      case "new":
        list.sort((a, b) => Number(b.new) - Number(a.new));
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [products, activeCollection, sort, onlyPersonalizable, onlyInStock, onlySale, onlyLowStock]);

  const setCollection = (slug: string) => {
    if (slug === "all") setSearchParams({});
    else setSearchParams({ colecao: slug });
  };

  const current = collections.find((c) => c.slug === activeCollection);

  return (
    <Layout>
      <section className="py-14 md:py-20 border-b border-border">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">
              Speranza Ateliê
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
              {current ? current.name : "Todas as peças"}
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl">
              {current
                ? current.description
                : "Porcelana feita e pintada à mão, peça por peça, no nosso ateliê."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-full space-y-10">
          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCollection("all")}
              className={cn(
                "px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-colors",
                activeCollection === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              Todas
            </button>
            {collections.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCollection(c.slug)}
                className={cn(
                  "px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-colors",
                  activeCollection === c.slug
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-6 border-y border-border py-4">
            <div className="flex items-center gap-3">
              <Switch
                id="personalizable"
                checked={onlyPersonalizable}
                onCheckedChange={setOnlyPersonalizable}
              />
              <Label htmlFor="personalizable" className="text-sm">
                Somente personalizáveis
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="stock" checked={onlyInStock} onCheckedChange={setOnlyInStock} />
              <Label htmlFor="stock" className="text-sm">
                Somente disponíveis
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sale" checked={onlySale} onCheckedChange={setOnlySale} />
              <Label htmlFor="sale" className="text-sm">
                Com desconto
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="low-stock"
                checked={onlyLowStock}
                onCheckedChange={setOnlyLowStock}
              />
              <Label htmlFor="low-stock" className="text-sm">
                Últimas unidades
              </Label>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Ordenar</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-56 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="featured">Destaques</SelectItem>
                  <SelectItem value="new">Novidades</SelectItem>
                  <SelectItem value="price-asc">Preço: menor para maior</SelectItem>
                  <SelectItem value="price-desc">Preço: maior para menor</SelectItem>
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="py-20 text-center text-muted-foreground">Carregando peças…</p>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-5">
              <p className="text-muted-foreground">
                Nenhuma peça encontrada com esses filtros.
              </p>
              <Button asChild variant="outline" className="rounded-none">
                <Link to="/produtos">Ver todas as peças</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Products;
