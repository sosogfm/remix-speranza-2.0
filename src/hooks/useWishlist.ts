import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Favoritos salvos no aparelho — funcionam sem login */
interface LocalWishlistState {
  ids: string[];
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useLocalWishlist = create<LocalWishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (productId) =>
        set({ ids: Array.from(new Set([...get().ids, productId])) }),
      remove: (productId) =>
        set({ ids: get().ids.filter((id) => id !== productId) }),
      toggle: (productId) =>
        get().ids.includes(productId)
          ? get().remove(productId)
          : get().add(productId),
      clear: () => set({ ids: [] }),
    }),
    { name: "speranza-favoritos" }
  )
);

const fetchRemoteIds = async (): Promise<string[]> => {
  const { data, error } = await supabase.from("wishlists").select("product_id");
  if (error) throw error;
  return data.map((r) => r.product_id);
};

export const useWishlistIds = () => {
  const { user } = useAuth();
  const localIds = useLocalWishlist((s) => s.ids);

  const remote = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: fetchRemoteIds,
  });

  if (!user) return { ...remote, data: localIds } as typeof remote;
  return {
    ...remote,
    data: Array.from(new Set([...(remote.data ?? []), ...localIds])),
  } as typeof remote;
};

export const useWishlist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: ids = [] } = useWishlistIds();
  const local = useLocalWishlist();
  const { toast } = useToast();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["wishlist"] });
    qc.invalidateQueries({ queryKey: ["wishlist-products"] });
  };

  const isInWishlist = (productId: string) => ids.includes(productId);

  const addItem = async (productId: string) => {
    local.add(productId);
    if (!user) return;
    await supabase
      .from("wishlists")
      .insert({ user_id: user.id, product_id: productId });
    invalidate();
  };

  const removeItem = async (productId: string) => {
    local.remove(productId);

    // some da lista na hora, sem esperar o servidor
    qc.setQueriesData({ queryKey: ["wishlist-products"] }, (old: any) =>
      Array.isArray(old)
        ? old.filter((row: any) => row.product_id !== productId)
        : old
    );
    qc.setQueriesData({ queryKey: ["wishlist"] }, (old: any) =>
      Array.isArray(old) ? old.filter((id: string) => id !== productId) : old
    );

    toast({
      title: "Removido dos favoritos",
      description: "A peça saiu da sua lista de favoritos.",
    });

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


/** Ao entrar na conta, leva os favoritos do aparelho para a conta */
export const useSyncWishlistOnLogin = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const localIds = useLocalWishlist((s) => s.ids);
  const clear = useLocalWishlist((s) => s.clear);

  const sync = useCallback(async () => {
    if (!user || localIds.length === 0) return;
    const remote = await fetchRemoteIds().catch(() => [] as string[]);
    const missing = localIds.filter((id) => !remote.includes(id));
    if (missing.length > 0) {
      await supabase
        .from("wishlists")
        .insert(missing.map((product_id) => ({ user_id: user.id, product_id })));
    }
    clear();
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  }, [user, localIds, clear, qc]);

  useEffect(() => {
    void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
};

/** Peças favoritadas com todos os dados, para a página Minha conta */
export const useWishlistProducts = () => {
  const { user } = useAuth();
  const localIds = useLocalWishlist((s) => s.ids);

  return useQuery({
    queryKey: ["wishlist-products", user?.id, localIds.join(",")],
    queryFn: async () => {
      const select =
        "id,name,slug,price_cents,max_installments,stock_quantity,is_active,product_images(image_url,position)";

      if (user) {
        const { data, error } = await supabase
          .from("wishlists")
          .select(`product_id, products(${select})`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        // peças inativas ou excluídas não aparecem nos favoritos
        return (data ?? []).filter((r: any) => r.products?.is_active);
      }

      if (localIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select(select)
        .in("id", localIds)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []).map((p) => ({ product_id: p.id, products: p }));
    },

  });
};
