import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PersonalizationField } from "@/hooks/usePersonalization";
import { PersonalizationValue } from "@/hooks/useCart";
import { formatBRL } from "@/data/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  fields: PersonalizationField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

export const PersonalizationFields = ({ fields, values, onChange }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleUpload = async (field: PersonalizationField, file: File) => {
    if (!user) {
      toast({
        title: "Entre para enviar uma imagem",
        description: "É preciso estar logada para anexar arquivos.",
        variant: "destructive",
      });
      return;
    }
    setUploadingId(field.id);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage
      .from("personalization-uploads")
      .upload(path, file, { upsert: false });
    setUploadingId(null);
    if (error) {
      toast({ title: "Não consegui enviar o arquivo", description: error.message, variant: "destructive" });
      return;
    }
    onChange(field.id, path);
    toast({ title: "Imagem enviada", description: file.name });
  };

  if (fields.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
        Personalize sua peça
      </p>

      {fields.map((field) => {
        const value = values[field.id] ?? "";
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm">
              {field.label}
              {field.isRequired && <span className="text-primary"> *</span>}
              {field.extraPriceCents > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  (+{formatBRL(field.extraPriceCents)})
                </span>
              )}
            </Label>

            {field.fieldType === "initial" && (
              <Input
                id={field.id}
                value={value}
                maxLength={field.maxLength}
                onChange={(e) => onChange(field.id, e.target.value.toUpperCase())}
                placeholder={`Até ${field.maxLength} caractere(s)`}
                className="rounded-none uppercase tracking-[0.3em]"
              />
            )}

            {field.fieldType === "text" && (
              <Textarea
                id={field.id}
                value={value}
                maxLength={field.maxLength}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={`Até ${field.maxLength} caracteres`}
                className="rounded-none min-h-24"
              />
            )}

            {(field.fieldType === "choice" || field.fieldType === "color") &&
              field.options.length > 0 && (
                <>
                  {field.fieldType === "choice" ? (
                    <Select value={value} onValueChange={(v) => onChange(field.id, v)}>
                      <SelectTrigger id={field.id} className="rounded-none">
                        <SelectValue placeholder="Escolha uma opção" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {field.options.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((o) => (
                        <button
                          type="button"
                          key={o}
                          onClick={() => onChange(field.id, o)}
                          className={cn(
                            "px-4 py-2 text-xs tracking-[0.12em] uppercase border transition-colors",
                            value === o
                              ? "bg-foreground text-background border-foreground"
                              : "border-border hover:border-foreground"
                          )}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

            {field.fieldType === "image" && (
              <div className="space-y-2">
                <label className="flex items-center gap-3 border border-border px-4 py-3 cursor-pointer hover:border-foreground transition-colors">
                  {uploadingId === field.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {value ? "Trocar arquivo" : "Enviar imagem ou desenho"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(field, file);
                    }}
                  />
                </label>
                {value && (
                  <p className="text-xs text-muted-foreground break-all">
                    Arquivo enviado: {value.split("/").pop()}
                  </p>
                )}
              </div>
            )}

            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Peças personalizadas são feitas sob encomenda e não têm troca.
      </p>
    </div>
  );
};

export const buildPersonalizationValues = (
  fields: PersonalizationField[],
  values: Record<string, string>
): PersonalizationValue[] =>
  fields
    .filter((f) => (values[f.id] ?? "").trim() !== "")
    .map((f) => ({
      fieldId: f.id,
      label: f.label,
      type: f.fieldType,
      value: values[f.id].trim(),
      extraCents: f.extraPriceCents,
    }));

export const missingRequiredField = (
  fields: PersonalizationField[],
  values: Record<string, string>
) => fields.find((f) => f.isRequired && !(values[f.id] ?? "").trim());
