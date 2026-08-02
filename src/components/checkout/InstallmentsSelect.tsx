import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface InstallmentOption {
  installments: number;
  installmentAmountCents: number;
  totalAmountCents: number;
  interestFree: boolean;
  label: string;
}

interface Props {
  /** primeiros dígitos do cartão digitados pela cliente */
  cardNumber: string;
  totalCents: number;
  value: number;
  onChange: (installments: number) => void;
  onPaymentMethod?: (info: { id: string | null; issuerId: string | null }) => void;
}

/** Busca as parcelas no Mercado Pago assim que o BIN (6 dígitos) é digitado */
export function InstallmentsSelect({
  cardNumber,
  totalCents,
  value,
  onChange,
  onPaymentMethod,
}: Props) {
  const bin = cardNumber.replace(/\D/g, "").slice(0, 6);
  const [options, setOptions] = useState<InstallmentOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bin.length < 6 || totalCents <= 0) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mp-installments", {
          body: { bin, amountCents: totalCents },
        });
        if (cancelled) return;
        if (error) throw error;
        const list: InstallmentOption[] = data?.options ?? [];
        setOptions(list);
        onPaymentMethod?.({
          id: data?.paymentMethod?.id ?? null,
          issuerId: data?.paymentMethod?.issuerId
            ? String(data.paymentMethod.issuerId)
            : null,
        });
        if (list.length && !list.some((o) => o.installments === value)) {
          onChange(list[0].installments);
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bin, totalCents]);

  return (
    <div className="space-y-2">
      <Label htmlFor="installments">Parcelamento</Label>
      {bin.length < 6 ? (
        <p className="text-xs text-muted-foreground">
          Digite os 6 primeiros números do cartão para ver as parcelas disponíveis.
        </p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Buscando parcelas…
        </p>
      ) : options.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Não encontramos parcelas para este cartão.
        </p>
      ) : (
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
          <SelectTrigger id="installments" className="rounded-none h-12">
            <SelectValue placeholder="Escolha as parcelas" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {options.map((o) => (
              <SelectItem key={o.installments} value={String(o.installments)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
