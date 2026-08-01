import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/data/products";
import { useQuestionBlocks, QuestionBlock } from "@/hooks/useQuestionBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  single: "Escolha única",
  multi: "Múltipla escolha",
  text: "Resposta escrita",
};

/** Converte "Sim, quero (+150) | Não, obrigada" em opções com acréscimo */
const parseOptions = (raw: string) =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/\(\+\s*R?\$?\s*([\d.,]+)\s*\)\s*$/i);
      if (!match) return { label: line, extra_price_cents: 0 };
      const value = Number(match[1].replace(/\./g, "").replace(",", "."));
      return {
        label: line.replace(match[0], "").trim(),
        extra_price_cents: Math.round((isNaN(value) ? 0 : value) * 100),
      };
    });

/** Biblioteca de blocos de perguntas reutilizáveis */
export const AdminQuestionBlocks = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: blocks = [], isLoading } = useQuestionBlocks();

  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [type, setType] = useState("single");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!name.trim() || !question.trim()) {
      toast({
        title: "Preencha o nome e a pergunta",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("workshop_question_blocks").insert({
      name: name.trim(),
      question: question.trim(),
      field_type: type,
      options: type === "text" ? [] : parseOptions(options),
      is_required: required,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setName("");
    setQuestion("");
    setOptions("");
    setRequired(false);
    qc.invalidateQueries({ queryKey: ["question-blocks"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("workshop_question_blocks").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["question-blocks"] });
  };

  return (
    <div className="border border-border p-6 space-y-6">
      <div>
        <p className="font-serif text-xl">Blocos de perguntas</p>
        <p className="text-sm text-muted-foreground">
          Crie uma vez e reutilize em quantas oficinas quiser. Escreva uma opção
          por linha; para cobrar a mais, termine a linha com (+150).
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum bloco criado ainda.</p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-start justify-between gap-4 border border-border p-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {b.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    · {typeLabels[b.field_type]}
                    {b.is_required && " · obrigatório"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{b.question}</p>
                {!!b.options.length && (
                  <p className="text-xs text-muted-foreground">
                    {b.options
                      .map(
                        (o) =>
                          o.label +
                          (o.extra_price_cents
                            ? ` (+${formatBRL(o.extra_price_cents)})`
                            : "")
                      )
                      .join(" · ")}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none"
                onClick={() => remove(b.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid md:grid-cols-2 gap-4 border-t border-border pt-6">
        <div className="space-y-1">
          <Label className="text-xs">Nome do bloco</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Esmaltação com a Tânia"
            className="rounded-none h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="rounded-none h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Pergunta</Label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Gostaria de realizar a esmaltação da sua peça em outro encontro?"
            className="rounded-none h-9"
          />
        </div>
        {type !== "text" && (
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Opções (uma por linha)</Label>
            <Textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder={"Sim, quero fazer a esmaltação (+150)\nNão, a professora Tânia pode esmaltar pra mim"}
              className="rounded-none min-h-24"
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Switch checked={required} onCheckedChange={setRequired} />
          <Label className="text-xs">Obrigatório</Label>
        </div>
      </div>

      <Button
        onClick={add}
        disabled={saving}
        className="rounded-none h-9 text-xs tracking-[0.15em] uppercase"
      >
        <Plus className="w-3.5 h-3.5 mr-2" />
        Criar bloco
      </Button>
    </div>
  );
};

/** Seleção de quais blocos aparecem em uma oficina */
export const WorkshopBlockPicker = ({ workshopId }: { workshopId: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: blocks = [] } = useQuestionBlocks();

  const { data: links = [] } = useQuery({
    queryKey: ["workshop-block-links", workshopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshop_question_block_links")
        .select("id, block_id")
        .eq("workshop_id", workshopId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = async (block: QuestionBlock, checked: boolean) => {
    const existing = links.find((l: any) => l.block_id === block.id);
    const { error } = checked
      ? await supabase
          .from("workshop_question_block_links")
          .insert({ workshop_id: workshopId, block_id: block.id })
      : await supabase
          .from("workshop_question_block_links")
          .delete()
          .eq("id", existing?.id ?? "");
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["workshop-block-links", workshopId] });
    qc.invalidateQueries({ queryKey: ["workshop-question-blocks", workshopId] });
  };

  if (!blocks.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
        Perguntas desta oficina
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {blocks.map((b) => (
          <label key={b.id} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={links.some((l: any) => l.block_id === b.id)}
              onCheckedChange={(v) => toggle(b, Boolean(v))}
            />
            <span className="text-sm">{b.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

/** Pedidos de eventos privativos */
export const AdminPrivateEvents = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-private-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("private_event_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("private_event_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-private-events"] });
  };

  if (isLoading) return <p className="text-muted-foreground py-10">Carregando…</p>;
  if (!requests.length)
    return (
      <p className="text-muted-foreground py-10">
        Nenhum pedido de evento privativo até agora.
      </p>
    );

  return (
    <div className="space-y-4">
      {(requests as any[]).map((r) => (
        <div key={r.id} className="border border-border p-5 space-y-2">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-medium">{r.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {r.phone}
                {r.email && ` · ${r.email}`}
              </p>
            </div>
            <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
              <SelectTrigger className="rounded-none h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Em conversa</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {r.experience_type === "decalque"
              ? "Decalques na porcelana (forno profissional)"
              : "Pintura de taças ou porcelana"}
            {r.desired_date && ` · ${r.desired_date}`}
            {r.group_size && ` · ${r.group_size} pessoas`}
          </p>
          {r.message && <p className="text-sm">{r.message}</p>}
        </div>
      ))}
    </div>
  );
};
