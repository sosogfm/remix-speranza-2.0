import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  imageUrl: string;
  authorName: string | null;
  position: number;
}

export const useReviews = () =>
  useQuery({
    queryKey: ["reviews"],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,image_url,author_name,position")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        imageUrl: r.image_url,
        authorName: r.author_name,
        position: r.position,
      }));
    },
  });

export interface InfoBlock {
  id: string;
  title: string;
  body: string;
  position: number;
}

/** Blocos de informação (prazo, envio, retirada…). product_id nulo = padrão da loja */
export const useProductInfoBlocks = (productId?: string) =>
  useQuery({
    queryKey: ["product-info-blocks", productId ?? "default"],
    queryFn: async (): Promise<InfoBlock[]> => {
      const { data, error } = await supabase
        .from("product_info_blocks")
        .select("id,title,body,position,product_id")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const specific = rows.filter((r) => r.product_id === productId);
      const list = specific.length ? specific : rows.filter((r) => !r.product_id);
      return list.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        position: r.position,
      }));
    },
  });

export interface ExperienceOption {
  id: string;
  value: string;
  label: string;
  description: string | null;
  priceCents: number | null;
}

export const usePrivateEventExperiences = () =>
  useQuery({
    queryKey: ["private-event-experiences"],
    queryFn: async (): Promise<ExperienceOption[]> => {
      const { data, error } = await supabase
        .from("private_event_experiences")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        value: r.value,
        label: r.label,
        description: r.description,
        priceCents: r.price_cents ?? null,
      }));
    },
  });
