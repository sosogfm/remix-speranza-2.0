import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatBRL } from "@/data/products";
import { QuestionBlock } from "@/hooks/useQuestionBlocks";

interface Props {
  blocks: QuestionBlock[];
  values: Record<string, string[]>;
  onChange: (blockId: string, value: string[]) => void;
}

export const WorkshopQuestionFields = ({ blocks, values, onChange }: Props) => {
  if (!blocks.length) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        const selected = values[block.id] ?? [];

        return (
          <div key={block.id} className="space-y-3">
            <Label>
              {block.question}
              {block.is_required && " *"}
            </Label>
            {block.help_text && (
              <p className="text-xs text-muted-foreground">{block.help_text}</p>
            )}

            {block.field_type === "text" && (
              <Input
                value={selected[0] ?? ""}
                onChange={(e) => onChange(block.id, [e.target.value])}
                className="rounded-none"
                maxLength={200}
              />
            )}

            {block.field_type === "single" && (
              <RadioGroup
                value={selected[0] ?? ""}
                onValueChange={(v) => onChange(block.id, [v])}
                className="space-y-2"
              >
                {block.options.map((o) => (
                  <div key={o.label} className="flex items-center gap-3">
                    <RadioGroupItem value={o.label} id={`${block.id}-${o.label}`} />
                    <Label
                      htmlFor={`${block.id}-${o.label}`}
                      className="font-normal text-sm"
                    >
                      {o.label}
                      {!!o.extra_price_cents && (
                        <span className="text-muted-foreground">
                          {" "}
                          (+{formatBRL(o.extra_price_cents)})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {block.field_type === "multi" && (
              <div className="space-y-2">
                {block.options.map((o) => (
                  <label key={o.label} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={selected.includes(o.label)}
                      onCheckedChange={(v) =>
                        onChange(
                          block.id,
                          v
                            ? [...selected, o.label]
                            : selected.filter((s) => s !== o.label)
                        )
                      }
                    />
                    <span className="text-sm">
                      {o.label}
                      {!!o.extra_price_cents && (
                        <span className="text-muted-foreground">
                          {" "}
                          (+{formatBRL(o.extra_price_cents)})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
