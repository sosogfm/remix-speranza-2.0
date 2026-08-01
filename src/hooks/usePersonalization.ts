import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PersonalizationFieldType =
  | "initial"
  | "text"
  | "color"
  | "image"
  | "choice";

export interface PersonalizationField {
  id: string;
  productId: string;
  label: string;
  helpText: string | null;
  fieldType: PersonalizationFieldType;
  options: string[];
  maxLength: number;
  isRequired: boolean;
  extraPriceCents: number;
  position: number;
}

export const fieldTypeLabels: Record<PersonalizationFieldType, string> = {
  initial: "Inicial",
  text: "Texto / frase",
  color: "Cor",
  image: "Imagem / desenho",
  choice: "Escolha",
};

const map = (r: any): PersonalizationField => ({
  id: r.id,
  productId: r.product_id,
  label: r.label,
  helpText: r.help_text,
  fieldType: r.field_type,
  options: r.options ?? [],
  maxLength: r.max_length,
  isRequired: r.is_required,
  extraPriceCents: r.extra_price_cents,
  position: r.position,
});

export const usePersonalizationFields = (productId?: string) =>
  useQuery({
    queryKey: ["personalization-fields", productId],
    enabled: !!productId,
    queryFn: async (): Promise<PersonalizationField[]> => {
      const { data, error } = await supabase
        .from("product_personalization_fields")
        .select("*")
        .eq("product_id", productId!)
        .order("position");
      if (error) throw error;
      return data.map(map);
    },
  });
