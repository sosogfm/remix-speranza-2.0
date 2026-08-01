export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  heroImage?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  collection: string; // category slug
  collectionName?: string;
  /** todas as categorias da peça (pode estar em mais de uma) */
  collectionSlugs?: string[];
  price: number; // BRL, in reais
  priceCents: number;
  description: string;
  longDescription: string;
  materials: string;
  dimensions?: string;
  images: string[];
  featured?: boolean;
  new?: boolean;
  stock: number;
  isPersonalizable: boolean;
  personalizationLabel: string;
  personalizationMaxLength: number;
  maxInstallments: number;
  /** peça sob orçamento: mostra "a partir de" e leva para o WhatsApp */
  isQuoteOnly?: boolean;
  /** promoção */
  salePriceCents?: number | null;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
  lowStockThreshold?: number;
}

/** Preço promocional válido agora (ou null quando não há promoção ativa) */
export const activeSaleCents = (p: Product): number | null => {
  if (p.salePriceCents == null || p.salePriceCents <= 0) return null;
  if (p.salePriceCents >= p.priceCents) return null;
  const now = Date.now();
  if (p.saleStartsAt && new Date(p.saleStartsAt).getTime() > now) return null;
  if (p.saleEndsAt && new Date(p.saleEndsAt).getTime() < now) return null;
  return p.salePriceCents;
};

/** Preço que a cliente realmente paga pela peça (sem personalização) */
export const effectivePriceCents = (p: Product) => activeSaleCents(p) ?? p.priceCents;

export const isLowStock = (p: Product) =>
  p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 3);


const PLACEHOLDER =
  "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80";

export const productPlaceholderImage = PLACEHOLDER;

/** Categorias da Speranza Ateliê (espelham os slugs do banco de dados) */
export const collections: Collection[] = [
  { id: "arte-sacra", name: "Arte Sacra", slug: "arte-sacra", description: "Peças de fé feitas à mão", image: PLACEHOLDER },
  { id: "boleiras", name: "Boleiras", slug: "boleiras", description: "Para celebrar cada doce momento", image: PLACEHOLDER },
  { id: "canecas", name: "Canecas", slug: "canecas", description: "O seu café com afeto", image: PLACEHOLDER },
  { id: "cozinha", name: "Cozinha", slug: "cozinha", description: "Porcelana para o dia a dia", image: PLACEHOLDER },
  { id: "cuias", name: "Cuias", slug: "cuias", description: "Cuias de porcelana artesanal", image: PLACEHOLDER },
  { id: "home-decor", name: "Home Decor", slug: "home-decor", description: "Detalhes que completam a casa", image: PLACEHOLDER },
  { id: "kits-para-presente", name: "Kits para Presente", slug: "kits-para-presente", description: "Presentes preparados com carinho", image: PLACEHOLDER },
  { id: "natal", name: "Natal", slug: "natal", description: "Coleção de fim de ano", image: PLACEHOLDER },
  { id: "porta-joias", name: "Porta Joias", slug: "porta-joias", description: "Guarde o que é precioso", image: PLACEHOLDER },
  { id: "urso-petit-poa", name: "Urso Petit Poá", slug: "urso-petit-poa", description: "A linha mais querida do ateliê", image: PLACEHOLDER },
  { id: "xicaras", name: "Xícaras", slug: "xicaras", description: "Xícaras pintadas à mão", image: PLACEHOLDER },
  { id: "colecao-colo", name: "Coleção Colo", slug: "colecao-colo", description: "Aconchego em porcelana", image: PLACEHOLDER },
];

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const installmentLabel = (cents: number, installments: number) => {
  if (!installments || installments < 2) return null;
  return `${installments}x de ${formatBRL(Math.round(cents / installments))} sem juros`;
};
