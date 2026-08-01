import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/products";
import {
  PersonalizationField,
  fieldTypeLabels,
  PersonalizationFieldType,
} from "@/hooks/usePersonalization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

/** Editor dos campos de personalização de uma peça */
export const AdminPersonalizationEditor = ({ productId }: { productId: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<PersonalizationFieldType>("initial");
  const [options, setOptions] = useState("");
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

  const add = async () => {
    if (!label.trim()) {
      toast({ title: "Dê um nome ao campo", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("product_personalization_fields").insert({
      product_id: productId,
      label: label.trim(),
      field_type: type,
      options:
        type === "choice" || type === "color"
          ? options.split(",").map((o) => o.trim()).filter(Boolean)
          : [],
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

  const remove = async (id: string) => {
    await supabase.from("product_personalization_fields").delete().eq("id", id);
    invalidate();
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
                    {f.options?.length > 0 && ` (${f.options.join(", ")})`}
                    {f.extra_price_cents > 0 && ` · +${formatBRL(f.extra_price_cents)}`}
                    {f.is_required ? " · obrigatório" : " · opcional"}
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
            <div className="space-y-1">
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

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;

  return (
    <div className="space-y-6">
      <AdminQuestionBlocks />
      {(workshops as any[]).map((w) => (
        <div key={w.id} className="border border-border p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-serif text-xl">{w.title}</p>
              <p className="text-sm text-muted-foreground">
                {w.event_date} · {w.location} · {formatBRL(w.price_cents)} ·{" "}
                {w.spots_taken} de {w.total_spots} vagas ocupadas
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
              <Label className="text-xs">Esmaltação (R$)</Label>
              <Input
                type="number"
                step="0.01"
                defaultValue={(w.glazing_price_cents / 100).toFixed(2)}
                className="rounded-none h-9"
                onBlur={(e) =>
                  update(w.id, {
                    glazing_price_cents: Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </div>
          </div>

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
