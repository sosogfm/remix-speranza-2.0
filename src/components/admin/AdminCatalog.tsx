import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/products";
import { uploadSiteImage, useSignedUrls } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

/* ---------------------------------------------------------------- Avaliações */

export const AdminReviews = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [author, setAuthor] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: signed = {} } = useSignedUrls(reviews.map((r: any) => r.image_url));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  const upload = async (files: FileList) => {
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const path = await uploadSiteImage(files[i], "reviews");
        const { error } = await supabase.from("reviews").insert({
          image_url: path,
          author_name: author.trim() || null,
          position: reviews.length + i,
        });
        if (error) throw error;
      }
      setAuthor("");
      invalidate();
      toast({ title: "Avaliação adicionada" });
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("reviews").update(patch).eq("id", id);
    invalidate();
  };

  const remove = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    invalidate();
  };

  return (
    <div className="border border-border p-6 space-y-6">
      <div>
        <p className="font-serif text-xl">Avaliações na homepage</p>
        <p className="text-sm text-muted-foreground">
          Suba prints das avaliações. Elas correm sozinhas na página inicial.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 border-b border-border pb-6">
        <div className="space-y-1 min-w-56">
          <Label className="text-xs">Nome de quem avaliou (opcional)</Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-none h-9"
          />
        </div>
        <label className="inline-flex items-center gap-2 border border-border h-9 px-4 cursor-pointer text-xs tracking-[0.15em] uppercase">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Enviar imagens
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files?.length && upload(e.target.files)}
          />
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="border border-border p-3 space-y-2">
              {signed[r.image_url] && (
                <img
                  src={signed[r.image_url]}
                  alt={r.author_name ?? "Avaliação"}
                  className="w-full h-40 object-cover"
                />
              )}
              <Input
                defaultValue={r.author_name ?? ""}
                placeholder="Nome"
                className="rounded-none h-8 text-xs"
                onBlur={(e) => update(r.id, { author_name: e.target.value || null })}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => update(r.id, { is_active: v })}
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em]">Visível</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={() => remove(r.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------- Blocos de informação */

export const AdminInfoBlocks = ({ productId }: { productId?: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: blocks = [] } = useQuery({
    queryKey: ["admin-info-blocks", productId ?? "default"],
    queryFn: async () => {
      const q = supabase.from("product_info_blocks").select("*").order("position");
      const { data, error } = productId
        ? await q.eq("product_id", productId)
        : await q.is("product_id", null);
      if (error) throw error;
      return data as any[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-info-blocks", productId ?? "default"] });
    qc.invalidateQueries({ queryKey: ["product-info-blocks"] });
  };

  const add = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Preencha título e texto", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("product_info_blocks").insert({
      product_id: productId ?? null,
      title: title.trim(),
      body: body.trim(),
      position: blocks.length,
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setTitle("");
    setBody("");
    invalidate();
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("product_info_blocks").update(patch).eq("id", id);
    invalidate();
  };

  const remove = async (id: string) => {
    await supabase.from("product_info_blocks").delete().eq("id", id);
    invalidate();
  };

  return (
    <div className="border border-border p-6 space-y-5">
      <div>
        <p className="font-serif text-xl">
          {productId ? "Informações desta peça" : "Informações padrão das peças"}
        </p>
        <p className="text-sm text-muted-foreground">
          Prazo, envios, retirada, queima, cuidados… edite, exclua ou crie novos.
          {productId && " Se esta peça tiver blocos próprios, eles substituem os padrão."}
        </p>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum bloco.</p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((b: any) => (
            <li key={b.id} className="border border-border p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  defaultValue={b.title}
                  className="rounded-none h-9 max-w-64"
                  onBlur={(e) =>
                    e.target.value !== b.title && update(b.id, { title: e.target.value })
                  }
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={b.is_active}
                    onCheckedChange={(v) => update(b.id, { is_active: v })}
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em]">Visível</span>
                </div>
                <Input
                  type="number"
                  defaultValue={b.position}
                  className="rounded-none h-9 w-20"
                  onBlur={(e) => update(b.id, { position: Number(e.target.value) })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none ml-auto"
                  onClick={() => remove(b.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                defaultValue={b.body}
                className="rounded-none min-h-20"
                onBlur={(e) =>
                  e.target.value !== b.body && update(b.id, { body: e.target.value })
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border pt-5 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ex.: Prazo)"
            className="rounded-none h-9"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Texto do bloco"
            className="rounded-none md:col-span-2 min-h-20"
          />
        </div>
        <Button onClick={add} className="rounded-none h-9 text-xs tracking-[0.15em] uppercase">
          <Plus className="w-3.5 h-3.5 mr-2" />
          Adicionar bloco
        </Button>
      </div>
    </div>
  );
};

/* ---------------------------------- Tipos de experiência (evento privativo) */

export const AdminExperiences = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("private_event_experiences")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as any[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-experiences"] });
    qc.invalidateQueries({ queryKey: ["private-event-experiences"] });
  };

  const add = async () => {
    if (!label.trim()) {
      toast({ title: "Dê um nome à experiência", variant: "destructive" });
      return;
    }
    const value = label
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const { error } = await supabase.from("private_event_experiences").insert({
      value: value || `opcao-${rows.length + 1}`,
      label: label.trim(),
      price_cents: price ? Math.round(Number(price.replace(",", ".")) * 100) : null,
      position: rows.length,
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setLabel("");
    setPrice("");
    invalidate();
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("private_event_experiences").update(patch).eq("id", id);
    invalidate();
  };

  const remove = async (id: string) => {
    await supabase.from("private_event_experiences").delete().eq("id", id);
    invalidate();
  };

  return (
    <div className="border border-border p-6 space-y-5">
      <div>
        <p className="font-serif text-xl">Tipos de experiência</p>
        <p className="text-sm text-muted-foreground">
          As opções que aparecem no painel de eventos privativos.
        </p>
      </div>

      <ul className="space-y-3">
        {rows.map((r: any) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3">
            <Input
              defaultValue={r.label}
              className="rounded-none h-9 min-w-64 flex-1"
              onBlur={(e) =>
                e.target.value !== r.label && update(r.id, { label: e.target.value })
              }
            />
            <Input
              type="number"
              step="0.01"
              defaultValue={r.price_cents != null ? (r.price_cents / 100).toFixed(2) : ""}
              placeholder="Valor"
              className="rounded-none h-9 w-32"
              onBlur={(e) =>
                update(r.id, {
                  price_cents: e.target.value
                    ? Math.round(Number(e.target.value) * 100)
                    : null,
                })
              }
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={r.is_active}
                onCheckedChange={(v) => update(r.id, { is_active: v })}
              />
              <span className="text-[10px] uppercase tracking-[0.15em]">Ativa</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none"
              onClick={() => remove(r.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-5">
        <div className="space-y-1 flex-1 min-w-64">
          <Label className="text-xs">Nova experiência</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Pintura de taças ou porcelana"
            className="rounded-none h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor (R$)</Label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-none h-9 w-32"
          />
        </div>
        <Button onClick={add} className="rounded-none h-9 text-xs tracking-[0.15em] uppercase">
          <Plus className="w-3.5 h-3.5 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};

/* ------------------------------------------------- Criar nova oficina */

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const AdminNewWorkshop = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
    start: "",
    end: "",
    location: "Videira – SC",
    price: "",
    spots: "10",
    summary: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.title.trim() || !form.date) {
      toast({ title: "Preencha o nome e a data", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("workshops").insert({
      title: form.title.trim(),
      slug: `${slugify(form.title)}-${form.date}`,
      event_date: form.date,
      start_time: form.start || null,
      end_time: form.end || null,
      location: form.location.trim() || "Videira – SC",
      price_cents: Math.round(Number(form.price.replace(",", ".") || 0) * 100),
      total_spots: Number(form.spots) || 10,
      summary: form.summary.trim() || null,
      description: form.description.trim() || null,
      is_published: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      return;
    }
    setForm({
      title: "",
      date: "",
      start: "",
      end: "",
      location: "Videira – SC",
      price: "",
      spots: "10",
      summary: "",
      description: "",
    });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-workshops"] });
    qc.invalidateQueries({ queryKey: ["workshops"] });
    toast({ title: "Oficina criada" });
  };

  return (
    <div className="border border-border p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-serif text-xl">Nova oficina</p>
          <p className="text-sm text-muted-foreground">
            Oficinas com data passada saem do ar sozinhas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          className="rounded-none h-9 text-xs tracking-[0.15em] uppercase"
        >
          {open ? "Fechar" : "Criar oficina"}
        </Button>
      </div>

      {open && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nome</Label>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input
                value={form.start}
                onChange={(e) => set("start", e.target.value)}
                placeholder="14:00"
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Término</Label>
              <Input
                value={form.end}
                onChange={(e) => set("end", e.target.value)}
                placeholder="17:00"
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Local</Label>
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vagas</Label>
              <Input
                type="number"
                value={form.spots}
                onChange={(e) => set("spots", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Resumo</Label>
            <Input
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              className="rounded-none h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-none min-h-24"
            />
          </div>
          <Button
            onClick={create}
            disabled={saving}
            className="rounded-none h-9 text-xs tracking-[0.15em] uppercase"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
            Criar oficina
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------- Promoção de uma peça */

export const AdminProductSale = ({ product }: { product: any }) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const update = async (patch: any) => {
    const { error } = await supabase.from("products").update(patch).eq("id", product.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const toLocal = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

  return (
    <div className="grid sm:grid-cols-4 gap-3 mt-3 border-t border-border pt-3">
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.15em]">Preço promo (R$)</Label>
        <Input
          type="number"
          step="0.01"
          defaultValue={
            product.sale_price_cents != null
              ? (product.sale_price_cents / 100).toFixed(2)
              : ""
          }
          className="rounded-none h-9"
          onBlur={(e) =>
            update({
              sale_price_cents: e.target.value
                ? Math.round(Number(e.target.value) * 100)
                : null,
            })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.15em]">Começa em</Label>
        <Input
          type="datetime-local"
          defaultValue={toLocal(product.sale_starts_at)}
          className="rounded-none h-9"
          onBlur={(e) =>
            update({
              sale_starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.15em]">Termina em</Label>
        <Input
          type="datetime-local"
          defaultValue={toLocal(product.sale_ends_at)}
          className="rounded-none h-9"
          onBlur={(e) =>
            update({
              sale_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-[0.15em]">
          Alerta de estoque baixo
        </Label>
        <Input
          type="number"
          defaultValue={product.low_stock_threshold ?? 3}
          className="rounded-none h-9"
          onBlur={(e) => update({ low_stock_threshold: Number(e.target.value) || 0 })}
        />
      </div>
      {product.sale_price_cents != null && (
        <p className="text-xs text-muted-foreground sm:col-span-4">
          De {formatBRL(product.price_cents)} por {formatBRL(product.sale_price_cents)}
        </p>
      )}
    </div>
  );
};
