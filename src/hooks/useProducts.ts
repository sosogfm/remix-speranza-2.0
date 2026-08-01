import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, productPlaceholderImage } from "@/data/products";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  materials: string | null;
  dimensions: string | null;
  price_cents: number;
  stock_quantity: number;
  is_personalizable: boolean;
  personalization_label: string | null;
  personalization_max_length: number;
  max_installments: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_quote_only: boolean;
  categories: { slug: string; name: string } | null;
  product_images: { image_url: string; position: number }[] | null;
};

const SELECT =
  "id,name,slug,description,long_description,materials,dimensions,price_cents,stock_quantity,is_personalizable,personalization_label,personalization_max_length,max_installments,is_active,is_featured,is_new,is_quote_only,categories(slug,name),product_images(image_url,position)";

export const mapProduct = (row: Row): Product => {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.image_url);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    collection: row.categories?.slug ?? "",
    collectionName: row.categories?.name,
    price: row.price_cents / 100,
    priceCents: row.price_cents,
    description: row.description ?? "",
    longDescription: row.long_description ?? row.description ?? "",
    materials: row.materials ?? "Porcelana feita à mão",
    dimensions: row.dimensions ?? undefined,
    images: images.length ? images : [productPlaceholderImage],
    featured: row.is_featured,
    new: row.is_new,
    stock: row.stock_quantity,
    isPersonalizable: row.is_personalizable,
    personalizationLabel: row.personalization_label ?? "Personalização",
    personalizationMaxLength: row.personalization_max_length ?? 20,
    maxInstallments: row.max_installments ?? 1,
    isQuoteOnly: row.is_quote_only ?? false,
  };
};

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Row[]).map(mapProduct);
    },
  });

export const useProduct = (slug?: string) =>
  useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProduct(data as unknown as Row) : null;
    },
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,display_order")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
