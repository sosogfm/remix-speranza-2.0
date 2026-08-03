import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/products";
import {
  PersonalizationField,
  fieldTypeLabels,
  PersonalizationFieldType,
  isPricedOptionType,
} from "@/hooks/usePersonalization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AdminQuestionBlocks,
  WorkshopBlockPicker,
} from "@/components/admin/AdminWorkshopExtras";
import { AdminNewWorkshop } from "@/components/admin/AdminCatalog";
import { uploadSiteImage } from "@/lib/storage";

/** Editor dos campos de personalização de uma peça */
export const AdminPersonalizationEditor = ({ productId }: { productId: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<PersonalizationFieldType>("initial");
  const [options, setOptions] = useState("");
  const [pricedOptions, setPricedOptions] = useState(
    "Ouro na borda = 45\nBorda colorida = 10"
  );
  const [copyFrom, setCopyFrom] = useState("");
  const [maxLength, setMaxLength] = useState("20");
  const [extra, setExtra] = useState("0");
  const [required, setRequired] = useState(true);

  const { data: fields = [] } = useQuery({
    queryKey: ["admin-personalization", productId],
    enabled: open,
    queryFn: async (): Promise<PersonalizationField[]> => {
      const { data, error } = await supabase
        .from("product_personalization_fields")
        .select("*")
        .eq("product_id", productId)
        .order("position");
      if (error) throw error;
      return data as any;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-personalization", productId] });
    qc.invalidateQueries({ queryKey: ["personalization-fields", productId] });
  };

  /** "Ouro na borda = 45" por linha → opções + preços em centavos */
  const parsePricedOptions = () => {
    const list: string[] = [];
    const prices: Record<string, number> = {};
    pricedOptions.split("\n").forEach((line) => {
      const [rawName, rawPrice] = line.split("=");
      const name = (rawName ?? "").trim();
      if (!name) return;
      list.push(name);
      prices[name] = Math.round(
        Number((rawPrice ?? "0").replace(/[^0-9,.-]/g, "").replace(",", ".")) * 100
      ) || 0;
    });
    return { list, prices };
  };

  const add = async () => {
    if (!label.trim()) {
      toast({ title: "Dê um nome ao campo", variant: "destructive" });
      return;
    }
    const priced = isPricedOptionType(type) ? parsePricedOptions() : null;
    if (priced && priced.list.length === 0) {
      toast({ title: "Liste ao menos uma opção", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("product_personalization_fields").insert({
      product_id: productId,
      label: label.trim(),
      field_type: type,
      options: priced
        ? priced.list
        : type === "choice" || type === "color"
        ? options.split(",").map((o) => o.trim()).filter(Boolean)
        : [],
      option_prices: priced ? priced.prices : {},
      max_length: Number(maxLength) || 20,
      extra_price_cents: Math.round(Number(extra.replace(",", ".")) * 100) || 0,
      is_required: required,
      position: fields.length,
    });
    if (error) {
      toast({ title: "Erro ao criar campo", description: error.message, variant: "destructive" });
      return;
    }
    setLabel("");
    setOptions("");
    invalidate();
  };

  const { data: otherProducts = [] } = useQuery({
    queryKey: ["admin-products-simple"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return (data ?? []).filter((p) => p.id !== productId);
    },
  });

  const copyFields = async () => {
    if (!copyFrom) return;
    const { data, error } = await supabase
      .from("product_personalization_fields")
      .select("*")
      .eq("product_id", copyFrom)
      .order("position");
    if (error || !data?.length) {
      toast({ title: "Nada para copiar", variant: "destructive" });
      return;
    }
    const rows = data.map((f: any, i: number) => ({
      product_id: productId,
      label: f.label,
      help_text: f.help_text,
      field_type: f.field_type,
      options: f.options,
      option_prices: f.option_prices,
      max_length: f.max_length,
      is_required: f.is_required,
      extra_price_cents: f.extra_price_cents,
      position: (fields as any[]).length + i,
    }));
    const { error: insErr } = await supabase
      .from("product_personalization_fields")
      .insert(rows);
    if (insErr) {
      toast({ title: "Erro ao copiar", description: insErr.message, variant: "destructive" });
      return;
    }
    toast({ title: `${rows.length} campo(s) copiado(s)` });
    invalidate();
  };

  const remove = async (id: string) => {
    await supabase.from("product_personalization_fields").delete().eq("id", id);
    invalidate();
  };

  /** imagem por opção (ex.: foto do urso no tamanho P) */
  const setOptionImage = async (field: any, option: string, file: File) => {
    try {
      const path = await uploadSiteImage(file, `options/${productId}`);
      const images = { ...(field.option_images ?? {}), [option]: path };
      const { error } = await supabase
        .from("product_personalization_fields")
        .update({ option_images: images })
        .eq("id", field.id);
      if (error) throw error;
      toast({ title: "Imagem da opção salva" });
      invalidate();
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-primary"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
        Campos de personalização
      </button>

      {open && (
        <div className="mt-4 border border-border p-4 space-y-4 bg-muted/20">
          {(fields as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum campo. Adicione abaixo (inicial, texto, cor, imagem ou escolha).
            </p>
          ) : (
            <ul className="space-y-2">
              {(fields as any[]).map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 text-sm border-b border-border pb-2"
                >
                  <span>
                    <strong>{f.label}</strong> ·{" "}
                    {fieldTypeLabels[f.field_type as PersonalizationFieldType]}
                    {f.options?.length > 0 &&
                      ` (${f.options
                        .map((o: string) =>
                          f.option_prices?.[o]
                            ? `${o} +${formatBRL(f.option_prices[o])}`
                            : o
                        )
                        .join(", ")})`}
                    {f.extra_price_cents > 0 && ` · +${formatBRL(f.extra_price_cents)}`}
                    {f.is_required ? " · obrigatório" : " · opcional"}
                    {isPricedOptionType(f.field_type) && f.options?.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-2">
                        {f.options.map((o: string) => (
                          <label
                            key={o}
                            className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[11px] cursor-pointer"
                          >
                            {f.option_images?.[o] ? "Trocar" : "Imagem"} · {o}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setOptionImage(f, o, file);
                              }}
                            />
                          </label>
                        ))}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => remove(f.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do campo</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Inicial, Frase, Cor da pintura"
                className="rounded-none h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PersonalizationFieldType)}>
                <SelectTrigger className="rounded-none h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {Object.entries(fieldTypeLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(type === "choice" || type === "color") && (
              <div className="space-y-1">
                <Label className="text-xs">Opções (separadas por vírgula)</Label>
                <Input
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  placeholder="Azul, Rosa, Dourado"
                  className="rounded-none h-9"
                />
              </div>
            )}
            {isPricedOptionType(type) && (
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label className="text-xs">
                  Opções e preços — uma por linha, no formato "Nome = valor em R$"
                </Label>
                <Textarea
                  value={pricedOptions}
                  onChange={(e) => setPricedOptions(e.target.value)}
                  placeholder={"Ouro na borda = 45\nAlça em ouro = 40\nBorda colorida = 10"}
                  className="rounded-none min-h-28 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Use 0 para opções sem custo (ex.: tamanho 350ml = 0).
                </p>
              </div>
            )}
            {(type === "initial" || type === "text") && (
              <div className="space-y-1">
                <Label className="text-xs">Máx. de caracteres</Label>
                <Input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  className="rounded-none h-9"
                />
              </div>
            )}
            <div className={isPricedOptionType(type) ? "hidden" : "space-y-1"}>
              <Label className="text-xs">Acréscimo (R$)</Label>
              <Input
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className="rounded-none h-9"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={required} onCheckedChange={setRequired} />
              <Label className="text-xs">Obrigatório</Label>
            </div>
          </div>

          <Button onClick={add} className="rounded-none h-9 text-xs tracking-[0.15em] uppercase">
            <Plus className="w-3.5 h-3.5 mr-2" />
            Adicionar campo
          </Button>

          <div className="border-t border-border pt-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-56">
              <Label className="text-xs">Copiar campos de outra peça</Label>
              <Select value={copyFrom} onValueChange={setCopyFrom}>
                <SelectTrigger className="rounded-none h-9">
                  <SelectValue placeholder="Escolha uma peça" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {otherProducts.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={copyFields}
              disabled={!copyFrom}
              className="rounded-none h-9 text-xs tracking-[0.15em] uppercase"
            >
              Copiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Gestão de oficinas e inscrições */
export const AdminWorkshops = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: workshops = [], isLoading } = useQuery({
    queryKey: ["admin-workshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*, workshop_registrations(*)")
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("workshops").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-workshops"] });
    qc.invalidateQueries({ queryKey: ["workshops"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("workshops").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-workshops"] });
    qc.invalidateQueries({ queryKey: ["workshops"] });
  };

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;

  return (
    <div className="space-y-6">
      <AdminNewWorkshop />
      <AdminQuestionBlocks />
      {(workshops as any[]).map((w) => (
        <div key={w.id} className="border border-border p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-72">
              <Input
                defaultValue={w.title}
                className="rounded-none h-10 font-serif text-lg"
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== w.title &&
                  update(w.id, { title: e.target.value.trim() })
                }
              />
              <p className="text-sm text-muted-foreground">
                {w.spots_taken} de {w.total_spots} vagas ocupadas ·{" "}
                {formatBRL(w.price_cents)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={w.is_published}
                  onCheckedChange={(v) => update(w.id, { is_published: v })}
                />
                <span className="text-xs uppercase tracking-[0.15em]">Publicada</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={w.is_sold_out}
                  onCheckedChange={(v) => update(w.id, { is_sold_out: v })}
                />
                <span className="text-xs uppercase tracking-[0.15em]">Esgotada</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                defaultValue={w.event_date}
                className="rounded-none h-9"
                onBlur={(e) =>
                  e.target.value && update(w.id, { event_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input
                defaultValue={w.start_time ?? ""}
                placeholder="14:00"
                className="rounded-none h-10"
                onBlur={(e) => update(w.id, { start_time: e.target.value || null })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Término</Label>
              <Input
                defaultValue={w.end_time ?? ""}
                placeholder="17:00"
                className="rounded-none h-10"
                onBlur={(e) => update(w.id, { end_time: e.target.value || null })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Local</Label>
              <Input
                defaultValue={w.location ?? ""}
                className="rounded-none h-9"
                onBlur={(e) =>
                  e.target.value.trim() && update(w.id, { location: e.target.value.trim() })
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Resumo</Label>
              <Input
                defaultValue={w.summary ?? ""}
                className="rounded-none h-9"
                onBlur={(e) => update(w.id, { summary: e.target.value || null })}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                defaultValue={w.description ?? ""}
                className="rounded-none min-h-24"
                onBlur={(e) => update(w.id, { description: e.target.value || null })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vagas totais</Label>
              <Input
                type="number"
                defaultValue={w.total_spots}
                className="rounded-none h-9"
                onBlur={(e) => update(w.id, { total_spots: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                defaultValue={(w.price_cents / 100).toFixed(2)}
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(w.id, { price_cents: Math.round(Number(e.target.value) * 100) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor promocional (R$)</Label>
              <Input
                type="number"
                step="0.01"
                defaultValue={
                  w.sale_price_cents != null ? (w.sale_price_cents / 100).toFixed(2) : ""
                }
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(w.id, {
                    sale_price_cents: e.target.value
                      ? Math.round(Number(e.target.value) * 100)
                      : null,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Promoção começa</Label>
              <Input
                type="datetime-local"
                defaultValue={toLocalInput(w.sale_starts_at)}
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(w.id, {
                    sale_starts_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Promoção termina</Label>
              <Input
                type="datetime-local"
                defaultValue={toLocalInput(w.sale_ends_at)}
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(w.id, {
                    sale_ends_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label className="text-xs">Imagem de capa</Label>
              <div className="flex flex-wrap items-center gap-3">
                {w.image_url && (
                  <>
                    <span className="text-xs text-muted-foreground max-w-xs truncate">
                      {w.image_url}
                    </span>
                    <Button
                      variant="outline"
                      className="rounded-none h-9 text-xs uppercase tracking-[0.15em]"
                      onClick={() => update(w.id, { image_url: null })}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Remover capa
                    </Button>
                  </>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  className="rounded-none h-9 max-w-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const path = await uploadSiteImage(file, `workshops/${w.id}`);
                      await update(w.id, { image_url: path });
                      toast({ title: "Capa atualizada" });
                    } catch (err: any) {
                      toast({
                        title: "Erro ao enviar",
                        description: err.message,
                        variant: "destructive",
                      });
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>


          <WorkshopBlockPicker workshopId={w.id} />

          <Button
            variant="outline"
            onClick={() => remove(w.id)}
            className="rounded-none h-9 text-xs tracking-[0.15em] uppercase"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Excluir oficina
          </Button>


          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
              Inscrições ({w.workshop_registrations?.length ?? 0})
            </p>
            {w.workshop_registrations?.length ? (
              <ul className="text-sm space-y-1">
                {w.workshop_registrations.map((r: any) => (
                  <li key={r.id} className="text-muted-foreground">
                    {r.full_name} — {r.phone}
                    {r.instagram && ` — ${r.instagram}`} — {r.dietary_restriction}
                    {r.wants_glazing && " — com esmaltação"}
                    {r.is_waitlist && " — lista de espera"}
                    {r.answers &&
                      Object.values(r.answers as Record<string, any>).map(
                        (a: any, i: number) => (
                          <span key={i}>
                            {" "}
                            — {a?.question ?? ""}:{" "}
                            {Array.isArray(a?.value) ? a.value.join(", ") : a?.value}
                          </span>
                        )
                      )}
                  </li>
                ))}

              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma inscrição ainda.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
