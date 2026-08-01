import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type QuestionBlockType = "single" | "multi" | "text";

export interface QuestionOption {
  label: string;
  extra_price_cents?: number;
}

export interface QuestionBlock {
  id: string;
  name: string;
  question: string;
  help_text: string | null;
  field_type: QuestionBlockType;
  options: QuestionOption[];
  is_required: boolean;
}

const mapBlock = (r: any): QuestionBlock => ({
  id: r.id,
  name: r.name,
  question: r.question,
  help_text: r.help_text,
  field_type: (r.field_type ?? "single") as QuestionBlockType,
  options: Array.isArray(r.options) ? (r.options as QuestionOption[]) : [],
  is_required: r.is_required,
});

/** Biblioteca completa de blocos (admin) */
export const useQuestionBlocks = () =>
  useQuery({
    queryKey: ["question-blocks"],
    queryFn: async (): Promise<QuestionBlock[]> => {
      const { data, error } = await supabase
        .from("workshop_question_blocks")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map(mapBlock);
    },
  });

/** Blocos vinculados a uma oficina */
export const useWorkshopQuestionBlocks = (workshopId?: string) =>
  useQuery({
    queryKey: ["workshop-question-blocks", workshopId],
    enabled: !!workshopId,
    queryFn: async (): Promise<QuestionBlock[]> => {
      const { data, error } = await supabase
        .from("workshop_question_block_links")
        .select("position, workshop_question_blocks(*)")
        .eq("workshop_id", workshopId!)
        .order("position");
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => row.workshop_question_blocks)
        .filter(Boolean)
        .map(mapBlock);
    },
  });

export interface BlockAnswer {
  block_id: string;
  question: string;
  answer: string[];
  extra_cents: number;
}

export const answerExtraCents = (block: QuestionBlock, selected: string[]) =>
  selected.reduce((sum, label) => {
    const opt = block.options.find((o) => o.label === label);
    return sum + (opt?.extra_price_cents ?? 0);
  }, 0);
