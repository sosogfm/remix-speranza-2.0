import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AdminPersonalizationEditor,
  AdminWorkshops,
} from "@/components/admin/AdminPanels";
import { AdminPrivateEvents } from "@/components/admin/AdminWorkshopExtras";
import {
  AdminReviews,
  AdminInfoBlocks,
  AdminExperiences,
  AdminProductSale,
} from "@/components/admin/AdminCatalog";
import {
  AdminNewProduct,
  AdminProductImages,
  AdminProductCategories,
  AdminCategories,
} from "@/components/admin/AdminProductsExtras";
import { AdminAccess } from "@/components/admin/AdminAccess";



const orderStatuses = [
  { value: "pending", label: "Aguardando pagamento" },
  { value: "paid", label: "Pago" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];

const shippingStatuses = [
  { value: "pending", label: "A preparar" },
  { value: "preparing", label: "Em produção" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
];

const AdminProducts = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, patch: any) => {
    setSavingId(id);
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    setSavingId(null);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;

  return (
    <>
    <AdminNewProduct />
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Peça</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead className="w-28">Estoque</TableHead>
          <TableHead className="w-36">Personalizável</TableHead>
          <TableHead className="w-32">Sob orçamento</TableHead>
          <TableHead className="w-24">Ativa</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p: any) => (
          <TableRow key={p.id}>
            <TableCell className="align-top min-w-72">
              <div className="flex items-center gap-2">
                <Input
                  defaultValue={p.name}
                  className="rounded-none h-11 font-serif text-base w-full"
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== p.name)
                      update(p.id, { name: e.target.value.trim() });
                  }}
                />
                {savingId === p.id && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>

              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    Descrição curta (aparece na vitrine)
                  </p>
                  <Textarea
                    defaultValue={p.description ?? ""}
                    className="rounded-none min-h-16 text-base"
                    onBlur={(e) => {
                      if (e.target.value !== (p.description ?? ""))
                        update(p.id, { description: e.target.value.trim() || null });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    Descrição completa (página da peça)
                  </p>
                  <Textarea
                    defaultValue={p.long_description ?? ""}
                    className="rounded-none min-h-24 text-base"
                    onBlur={(e) => {
                      if (e.target.value !== (p.long_description ?? ""))
                        update(p.id, { long_description: e.target.value.trim() || null });
                    }}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    defaultValue={p.materials ?? ""}
                    placeholder="Material"
                    className="rounded-none h-11 text-base"
                    onBlur={(e) => {
                      if (e.target.value !== (p.materials ?? ""))
                        update(p.id, { materials: e.target.value.trim() || null });
                    }}
                  />
                  <Input
                    defaultValue={p.dimensions ?? ""}
                    placeholder="Medidas"
                    className="rounded-none h-11 text-base"
                    onBlur={(e) => {
                      if (e.target.value !== (p.dimensions ?? ""))
                        update(p.id, { dimensions: e.target.value.trim() || null });
                    }}
                  />
                </div>
              </div>

              <AdminProductImages productId={p.id} />
              <AdminProductCategories productId={p.id} primaryCategoryId={p.category_id} />
              {p.is_personalizable && <AdminPersonalizationEditor productId={p.id} />}
              <AdminProductSale product={p} />
              <details className="mt-3">
                <summary className="text-xs tracking-[0.15em] uppercase text-primary cursor-pointer">
                  Informações desta peça
                </summary>
                <div className="mt-3">
                  <AdminInfoBlocks productId={p.id} />
                </div>
              </details>

              <Button
                variant="outline"
                onClick={() => removeProduct(p.id, p.name)}
                className="mt-4 rounded-none h-9 text-xs tracking-[0.15em] uppercase text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Excluir peça
              </Button>
            </TableCell>

            <TableCell className="align-top">
              <Input
                type="number"
                step="0.01"
                defaultValue={(p.price_cents / 100).toFixed(2)}
                className="rounded-none h-11 w-36 text-base"
                onBlur={(e) => {
                  const v = Math.round(Number(e.target.value) * 100);
                  if (v && v !== p.price_cents) update(p.id, { price_cents: v });
                }}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min={0}
                defaultValue={p.stock_quantity}
                className="rounded-none h-11 w-28 text-base"
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== p.stock_quantity) update(p.id, { stock_quantity: v });
                }}
              />
            </TableCell>
            <TableCell>
              <Switch
                checked={p.is_personalizable}
                onCheckedChange={(v) => update(p.id, { is_personalizable: v })}
              />
            </TableCell>
            <TableCell>
              <Switch
                checked={p.is_quote_only}
                onCheckedChange={(v) => update(p.id, { is_quote_only: v })}
              />
            </TableCell>
            <TableCell>
              <Switch
                checked={p.is_active}
                onCheckedChange={(v) => update(p.id, { is_active: v })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </>
  );
};


const AdminOrders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;
  if (orders.length === 0)
    return <p className="text-muted-foreground py-10">Nenhum pedido ainda.</p>;

  return (
    <div className="space-y-6">
      {orders.map((o: any) => (
        <div key={o.id} className="border border-border p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-serif text-xl">{o.order_number}</p>
              <p className="text-sm text-muted-foreground">
                {o.customer_name} — {o.customer_email} — {o.customer_phone}
              </p>
              <p className="text-sm text-muted-foreground">
                {o.address_line}, {o.address_number} — {o.neighborhood}, {o.city}/
                {o.state} — CEP {o.postal_code}
              </p>
            </div>
            <p className="font-serif text-xl">{formatBRL(o.total_cents)}</p>
          </div>

          <ul className="text-sm space-y-1">
            {o.order_items?.map((i: any) => (
              <li key={i.id}>
                {i.quantity}× {i.product_name}
                {i.personalization_text && ` — “${i.personalization_text}”`}
              </li>
            ))}
          </ul>

          <div className="grid sm:grid-cols-3 gap-4">
            <Select
              value={o.payment_status}
              onValueChange={(v) => update(o.id, { payment_status: v })}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {orderStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={o.shipping_status}
              onValueChange={(v) => update(o.id, { shipping_status: v })}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {shippingStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Código de rastreio"
              defaultValue={o.tracking_code ?? ""}
              className="rounded-none"
              onBlur={(e) => {
                if (e.target.value !== (o.tracking_code ?? ""))
                  update(o.id, { tracking_code: e.target.value || null });
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminShipping = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_rates")
        .select("*")
        .order("cep_start");
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("shipping_rates").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-shipping"] });
  };

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Região</TableHead>
          <TableHead>Faixa de CEP</TableHead>
          <TableHead className="w-36">Frete (R$)</TableHead>
          <TableHead className="w-40">Grátis acima de (R$)</TableHead>
          <TableHead className="w-28">Prazo (dias)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rates.map((r: any) => (
          <TableRow key={r.id}>
            <TableCell>{r.region_name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {r.cep_start} – {r.cep_end}
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                defaultValue={(r.price_cents / 100).toFixed(2)}
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(r.id, { price_cents: Math.round(Number(e.target.value) * 100) })
                }
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                defaultValue={
                  r.free_above_cents != null ? (r.free_above_cents / 100).toFixed(2) : ""
                }
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(r.id, {
                    free_above_cents: e.target.value
                      ? Math.round(Number(e.target.value) * 100)
                      : null,
                  })
                }
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                defaultValue={r.delivery_days}
                className="rounded-none h-9"
                onBlur={(e) => update(r.id, { delivery_days: Number(e.target.value) })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="container-full py-28 text-center text-muted-foreground">
          Carregando…
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center space-y-5">
          <h1 className="font-serif text-4xl">Acesso restrito</h1>
          <p className="text-muted-foreground">
            Esta área é exclusiva da administração do ateliê.
          </p>
          <Button asChild variant="outline" className="rounded-none">
            <Link to="/">Voltar à loja</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8 md:py-10">
        <div className="container-full space-y-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-2">
              Speranza Ateliê
            </p>
            <h1 className="font-serif text-4xl md:text-5xl">Administração</h1>
          </div>

          <Tabs defaultValue="products">
            <TabsList className="rounded-none">
              <TabsTrigger value="products" className="rounded-none">Peças e estoque</TabsTrigger>
              <TabsTrigger value="categories" className="rounded-none">Categorias</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-none">Pedidos</TabsTrigger>
              <TabsTrigger value="workshops" className="rounded-none">Oficinas</TabsTrigger>
              <TabsTrigger value="events" className="rounded-none">Eventos privativos</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none">Avaliações</TabsTrigger>
              <TabsTrigger value="site" className="rounded-none">Informações</TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none">Frete</TabsTrigger>
              <TabsTrigger value="access" className="rounded-none">Acessos</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="pt-4">
              <AdminProducts />
            </TabsContent>
            <TabsContent value="categories" className="pt-4">
              <AdminCategories />
            </TabsContent>

            <TabsContent value="orders" className="pt-4">
              <AdminOrders />
            </TabsContent>
            <TabsContent value="workshops" className="pt-4">
              <AdminWorkshops />
            </TabsContent>
            <TabsContent value="events" className="pt-4">
              <AdminPrivateEvents />
            </TabsContent>
            <TabsContent value="reviews" className="pt-4">
              <AdminReviews />
            </TabsContent>
            <TabsContent value="site" className="pt-4 space-y-6">
              <AdminInfoBlocks />
              <AdminExperiences />
            </TabsContent>
            <TabsContent value="shipping" className="pt-4">
              <AdminShipping />
            </TabsContent>
            <TabsContent value="access" className="pt-4">
              <AdminAccess />
            </TabsContent>

          </Tabs>

        </div>
      </section>
    </Layout>
  );
};

export default Admin;
