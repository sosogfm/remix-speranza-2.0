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

  const update = async (id: string, patch: Record<string, unknown>) => {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Peça</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead className="w-28">Estoque</TableHead>
          <TableHead className="w-36">Personalizável</TableHead>
          <TableHead className="w-24">Ativa</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p: any) => (
          <TableRow key={p.id}>
            <TableCell className="font-serif text-base">
              {p.name}
              {savingId === p.id && (
                <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />
              )}
            </TableCell>
            <TableCell>{formatBRL(p.price_cents)}</TableCell>
            <TableCell>
              <Input
                type="number"
                min={0}
                defaultValue={p.stock}
                className="rounded-none h-9 w-24"
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== p.stock) update(p.id, { stock: v });
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
                checked={p.is_active}
                onCheckedChange={(v) => update(p.id, { is_active: v })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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

  const update = async (id: string, patch: Record<string, unknown>) => {
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

  const update = async (id: string, patch: Record<string, unknown>) => {
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
      <section className="py-12 md:py-16">
        <div className="container-full space-y-10">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
              Speranza Ateliê
            </p>
            <h1 className="font-serif text-4xl md:text-5xl">Administração</h1>
          </div>

          <Tabs defaultValue="products">
            <TabsList className="rounded-none">
              <TabsTrigger value="products" className="rounded-none">Peças e estoque</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-none">Pedidos</TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none">Frete</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="pt-8">
              <AdminProducts />
            </TabsContent>
            <TabsContent value="orders" className="pt-8">
              <AdminOrders />
            </TabsContent>
            <TabsContent value="shipping" className="pt-8">
              <AdminShipping />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
