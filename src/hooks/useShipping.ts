import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingRate {
  id: string;
  regionName: string;
  priceCents: number;
  freeAboveCents: number | null;
  deliveryDays: number;
}

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const useShippingQuote = (cep: string, subtotalCents: number) => {
  const digits = onlyDigits(cep);
  return useQuery({
    queryKey: ["shipping", digits, subtotalCents],
    enabled: digits.length === 8,
    queryFn: async (): Promise<ShippingRate | null> => {
      const { data, error } = await supabase
        .from("shipping_rates")
        .select("*")
        .eq("is_active", true)
        .lte("cep_start", digits)
        .gte("cep_end", digits)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const free =
        data.free_above_cents != null && subtotalCents >= data.free_above_cents;

      return {
        id: data.id,
        regionName: data.region_name,
        priceCents: free ? 0 : data.price_cents,
        freeAboveCents: data.free_above_cents,
        deliveryDays: data.delivery_days,
      };
    },
  });
};
