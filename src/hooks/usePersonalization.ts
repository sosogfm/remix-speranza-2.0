import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PersonalizationFieldType =
  | "initial"
  | "text"
  | "color"
  | "image"
  | "choice"
  | "addon"
  | "size";

export interface PersonalizationField {
  id: string;
  productId: string;
  label: string;
  helpText: string | null;
  fieldType: PersonalizationFieldType;
  options: string[];
  /** preço adicional por opção, em centavos (usado em "addon" e "size") */
  optionPrices: Record<string, number>;
  /** imagens por opção (uma ou várias, caminhos no bucket site-images) */
  optionImages: Record<string, string | string[]>;
  maxLength: number;
  isRequired: boolean;
  extraPriceCents: number;
  position: number;
}

/** normaliza o valor guardado (string antiga ou lista nova) em lista */
export const optionImageList = (
  images: Record<string, string | string[]> | undefined,
  option: string
): string[] => {
  const v = images?.[option];
  if (!v) return [];
  return Array.isArray(v) ? v.filter(Boolean) : [v];
};


export const fieldTypeLabels: Record<PersonalizationFieldType, string> = {
  initial: "Inicial",
  text: "Texto / frase",
  color: "Cor",
  image: "Imagem / desenho",
  choice: "Escolha",
  addon: "Extras (marcar vários, com preço)",
  size: "Tamanho (escolher um, com preço)",
};

/** tipos em que cada opção tem o seu próprio preço */
export const isPricedOptionType = (t: PersonalizationFieldType) =>
  t === "addon" || t === "size";

/** separador usado para guardar várias opções marcadas em um só campo */
export const ADDON_SEPARATOR = " + ";

export const splitAddonValue = (value: string) =>
  value
    .split(ADDON_SEPARATOR)
    .map((v) => v.trim())
    .filter(Boolean);

/** acréscimo em centavos de um campo, conforme o que foi preenchido/escolhido */
export const fieldExtraCents = (
  field: PersonalizationField,
  value: string
): number => {
  const filled = (value ?? "").trim();
  if (!filled) return 0;
  // "size" define o preço total da peça, não um acréscimo
  if (field.fieldType === "size") return 0;
  if (isPricedOptionType(field.fieldType)) {
    return splitAddonValue(filled).reduce(
      (t, opt) => t + (field.optionPrices[opt] ?? 0),
      0
    );
  }
  return field.extraPriceCents;
};

export const totalExtraCents = (
  fields: PersonalizationField[],
  values: Record<string, string>
) => fields.reduce((t, f) => t + fieldExtraCents(f, values[f.id] ?? ""), 0);

/** Preço total definido pelo tamanho escolhido (substitui o preço da peça) */
export const sizeBaseCents = (
  fields: PersonalizationField[],
  values: Record<string, string>
): number | null => {
  for (const f of fields) {
    if (f.fieldType !== "size") continue;
    const v = (values[f.id] ?? "").trim();
    if (v && f.optionPrices[v] != null) return f.optionPrices[v];
  }
  return null;
};

/** Imagens associadas às opções escolhidas (primeira opção com imagens) */
export const selectedOptionImages = (
  fields: PersonalizationField[],
  values: Record<string, string>
): string[] => {
  for (const f of fields) {
    const v = (values[f.id] ?? "").trim();
    const list = optionImageList(f.optionImages, v);
    if (v && list.length) return list;
  }
  return [];
};

const map = (r: any): PersonalizationField => ({
  id: r.id,
  productId: r.product_id,
  label: r.label,
  helpText: r.help_text,
  fieldType: r.field_type,
  options: r.options ?? [],
  optionPrices: (r.option_prices ?? {}) as Record<string, number>,
  optionImages: (r.option_images ?? {}) as Record<string, string | string[]>,

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
