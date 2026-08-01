import { Link } from "react-router-dom";
import { Heart, Package, CalendarDays, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useWishlistProducts, useWishlist } from "@/hooks/useWishlist";
import { useMyRegistrations, formatWorkshopDateLong } from "@/hooks/useWorkshops";
import { formatBRL, productPlaceholderImage } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGuestOrders, getGuestRegistrations } from "@/lib/guestOrders";

const statusLabels: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  waitlist: "Lista de espera",
  confirmed: "Confirmada",
};

const Favoritos = () => {
  const { data: rows = [], isLoading } = useWishlistProducts();
  const { removeItem } = useWishlist();

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;
  if (rows.length === 0)
    return (
      <div className="py-10 space-y-4">
        <p className="text-muted-foreground">Você ainda não favoritou nenhuma peça.</p>
        <Button asChild variant="outline" className="rounded-none">
          <Link to="/produtos">Ver a loja</Link>
        </Button>
      </div>
    );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {rows.map((row: any) => {
        const p = row.products;
        if (!p) return null;
        const image =
          p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]
            ?.image_url ?? productPlaceholderImage;
        return (
          <div key={row.product_id} className="group">
            <Link to={`/produto/${p.slug}`} className="block">
              <div className="aspect-[4/5] overflow-hidden bg-muted/40 mb-4">
                <img
                  src={image}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-lg">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{formatBRL(p.price_cents)}</p>
            </Link>
            <button
              onClick={() => removeItem(p.id)}
              className="mt-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-destructive transition-colors"
            >
              Remover dos favoritos
            </button>
          </div>
        );
      })}
    </div>
  );
};

const Pedidos = () => {
  const { user } = useAuth();
  const guestOrders = getGuestOrders();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allOrders: any[] = user ? orders : guestOrders;

  if (user && isLoading)
    return <p className="text-muted-foreground py-10">Carregando…</p>;
  if (allOrders.length === 0)
    return <p className="text-muted-foreground py-10">Você ainda não fez pedidos.</p>;

  return (
    <div className="space-y-5">
      {allOrders.map((o: any) => (
        <Link
          key={o.id}
          to={`/pedido/${o.id}`}
          className="block border border-border p-6 hover:border-foreground transition-colors"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-serif text-xl">{o.order_number}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("pt-BR")} ·{" "}
                {statusLabels[o.payment_status ?? "pending"] ?? o.payment_status}
              </p>
            </div>
            <p className="font-serif text-xl">{formatBRL(o.total_cents)}</p>
          </div>
          <ul className="text-sm text-muted-foreground mt-3 space-y-1">
            {o.order_items?.map((i: any) => (
              <li key={i.id}>
                {i.quantity}× {i.product_name}
                {i.personalization_text && ` — ${i.personalization_text}`}
              </li>
            ))}
          </ul>
        </Link>
      ))}
    </div>
  );
};

const Inscricoes = () => {
  const { user } = useAuth();
  const { data: remoteRegs = [], isLoading } = useMyRegistrations();
  const guestRegs = getGuestRegistrations().map((r) => ({
    id: r.id,
    status: r.is_waitlist ? "waitlist" : "pending",
    wants_glazing: false,
    dietary_restriction: "—",
    workshops: { title: r.workshop_title, event_date: r.workshop_date },
  }));
  const regs: any[] = user ? remoteRegs : guestRegs;

  if (user && isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;
  if (regs.length === 0)
    return (
      <div className="py-10 space-y-4">
        <p className="text-muted-foreground">Você ainda não se inscreveu em oficinas.</p>
        <Button asChild variant="outline" className="rounded-none">
          <Link to="/oficinas">Ver oficinas</Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-5">
      {regs.map((r: any) => (
        <div key={r.id} className="border border-border p-6">
          <p className="font-serif text-xl">{r.workshops?.title}</p>
          <p className="text-sm text-muted-foreground">
            {r.workshops?.event_date && formatWorkshopDateLong(r.workshops.event_date)} ·{" "}
            {statusLabels[r.status] ?? r.status}
          </p>
          {r.wants_glazing && (
            <p className="text-sm text-muted-foreground mt-1">Com esmaltação</p>
          )}
          <p className="text-sm text-muted-foreground">
            Restrição alimentar: {r.dietary_restriction}
          </p>
        </div>
      ))}
    </div>
  );
};

const Account = () => {
  const { user, loading, signOut } = useAuth();

  if (loading)
    return (
      <Layout>
        <div className="container-full py-28 text-center text-muted-foreground">
          Carregando…
        </div>
      </Layout>
    );

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container-full space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
                Speranza Ateliê
              </p>
              <h1 className="font-serif text-4xl md:text-5xl">Minha conta</h1>
              <p className="text-muted-foreground mt-2">
                {user
                  ? user.email
                  : "Você está navegando sem conta — favoritos, pedidos e inscrições ficam salvos neste aparelho."}
              </p>
            </div>
            {user ? (
              <Button variant="outline" className="rounded-none" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            ) : (
              <Button asChild variant="outline" className="rounded-none">
                <Link to="/auth?redirect=%2Fminha-conta">Entrar / criar conta</Link>
              </Button>
            )}
          </div>

          <Tabs defaultValue="favoritos">
            <TabsList className="rounded-none">
              <TabsTrigger value="favoritos" className="rounded-none">
                <Heart className="w-4 h-4 mr-2" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="pedidos" className="rounded-none">
                <Package className="w-4 h-4 mr-2" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="oficinas" className="rounded-none">
                <CalendarDays className="w-4 h-4 mr-2" />
                Oficinas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="favoritos" className="pt-8">
              <Favoritos />
            </TabsContent>
            <TabsContent value="pedidos" className="pt-8">
              <Pedidos />
            </TabsContent>
            <TabsContent value="oficinas" className="pt-8">
              <Inscricoes />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Account;
