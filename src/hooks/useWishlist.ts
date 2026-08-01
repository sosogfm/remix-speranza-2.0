import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useWishlistIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id");
      if (error) throw error;
      return data.map((r) => r.product_id);
    },
  });
};

export const useWishlist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: ids = [] } = useWishlistIds();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wishlist"] });

  const isInWishlist = (productId: string) => ids.includes(productId);

  const addItem = async (productId: string) => {
    if (!user) return;
    await supabase
      .from("wishlists")
      .insert({ user_id: user.id, product_id: productId });
    invalidate();
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    await supabase.from("wishlists").delete().eq("product_id", productId);
    invalidate();
  };

  const toggle = async (productId: string) => {
    if (isInWishlist(productId)) await removeItem(productId);
    else await addItem(productId);
  };

  return { ids, isInWishlist, addItem, removeItem, toggle };
};

/** Peças favoritadas com todos os dados, para a página Minha conta */
export const useWishlistProducts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select(
          "product_id, products(id,name,slug,price_cents,max_installments,stock_quantity,product_images(image_url,position))"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
