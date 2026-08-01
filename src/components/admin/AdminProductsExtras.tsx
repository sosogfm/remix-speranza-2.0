import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadSiteImage, useSignedUrls } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export const slugify = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const useCategories = () =>
  useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

/* ------------------------------------------- Imagens de uma peça existente */

export const AdminProductImages = ({ productId }: { productId: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: images = [] } = useQuery({
    queryKey: ["admin-product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("position");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: signed = {} } = useSignedUrls(
    images.map((i: any) => i.image_url)
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-product-images", productId] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const upload = async (files: FileList) => {
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const path = await uploadSiteImage(files[i], `produtos/${productId}`);
        const { error } = await supabase.from("product_images").insert({
          product_id: productId,
          image_url: path,
          position: images.length + i,
        });
        if (error) throw error;
      }
      invalidate();
      toast({ title: "Imagem adicionada" });
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("product_images").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const a = images[index];
    const b = images[target];
    await supabase.from("product_images").update({ position: target }).eq("id", a.id);
    await supabase.from("product_images").update({ position: index }).eq("id", b.id);
    invalidate();
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((img: any, index: number) => (
          <div key={img.id} className="w-24 space-y-1">
            <div className="aspect-square overflow-hidden bg-muted/40 border border-border">
              {signed[img.image_url] && (
                <img
                  src={signed[img.image_url]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => move(index, -1)}
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label="Mover para a esquerda"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="p-1 text-muted-foreground hover:text-destructive"
                aria-label="Remover imagem"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label="Mover para a direita"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {index === 0 && (
              <p className="text-[10px] text-center text-muted-foreground">Principal</p>
            )}
          </div>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs cursor-pointer hover:border-foreground">
        {busy && <Loader2 className="w-3 h-3 animate-spin" />}
        Adicionar imagens
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
      </label>
    </div>
  );
};

/* ---------------------------------------------------------- Cadastrar peça */

export const AdminNewProduct = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    price: "",
    stock: "1",
    description: "",
    materials: "Porcelana pintada à mão",
    dimensions: "",
    installments: "2",
    personalizable: false,
    quoteOnly: false,
    active: true,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.name.trim()) {
      toast({ title: "Dê um nome para a peça", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: form.name.trim(),
          slug: `${slugify(form.name)}-${Date.now().toString().slice(-4)}`,
          category_id: form.categoryId || null,
          price_cents: Math.round(Number(form.price.replace(",", ".") || 0) * 100),
          stock_quantity: Number(form.stock) || 0,
          description: form.description.trim() || null,
          materials: form.materials.trim() || null,
          dimensions: form.dimensions.trim() || null,
          max_installments: Number(form.installments) || 1,
          is_personalizable: form.personalizable,
          is_quote_only: form.quoteOnly,
          is_active: form.active,
          is_new: true,
        })
        .select("id")
        .single();
      if (error) throw error;

      for (let i = 0; i < files.length; i++) {
        const path = await uploadSiteImage(files[i], `produtos/${data.id}`);
        const { error: imgError } = await supabase.from("product_images").insert({
          product_id: data.id,
          image_url: path,
          position: i,
        });
        if (imgError) throw imgError;
      }

      setForm({
        name: "",
        categoryId: "",
        price: "",
        stock: "1",
        description: "",
        materials: "Porcelana pintada à mão",
        dimensions: "",
        installments: "2",
        personalizable: false,
        quoteOnly: false,
        active: true,
      });
      setFiles([]);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Peça criada" });
    } catch (e: any) {
      toast({ title: "Erro ao criar", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="border border-border p-6 space-y-5 mb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-serif text-xl">Nova peça</p>
          <p className="text-sm text-muted-foreground">
            Cadastre a peça com fotos, preço e estoque.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          className="rounded-none h-9 text-xs tracking-[0.15em] uppercase"
        >
          {open ? "Fechar" : "Cadastrar peça"}
        </Button>
      </div>

      {open && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categorias</Label>
              <div className="border border-border p-3 max-h-40 overflow-auto space-y-1.5">
                {categories.map((c: any) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(c.id)}
                      onChange={(e) =>
                        set(
                          "categoryIds",
                          e.target.checked
                            ? [...form.categoryIds, c.id]
                            : form.categoryIds.filter((id: string) => id !== c.id)
                        )
                      }
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Preço (R$)</Label>
              <Input
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estoque</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Parcelas</Label>
              <Input
                type="number"
                value={form.installments}
                onChange={(e) => set("installments", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Input
                value={form.materials}
                onChange={(e) => set("materials", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medidas</Label>
              <Input
                value={form.dimensions}
                onChange={(e) => set("dimensions", e.target.value)}
                className="rounded-none h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-none min-h-24"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.personalizable}
                onCheckedChange={(v) => set("personalizable", v)}
              />
              Personalizável
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.quoteOnly}
                onCheckedChange={(v) => set("quoteOnly", v)}
              />
              Sob orçamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              Ativa na loja
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fotos</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block text-sm"
            />
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.length} foto(s) selecionada(s)
              </p>
            )}
          </div>

          <Button
            onClick={create}
            disabled={saving}
            className="rounded-none h-10 text-xs tracking-[0.15em] uppercase"
          >
            {saving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Criar peça
          </Button>
        </div>
      )}
    </div>
  );
};
