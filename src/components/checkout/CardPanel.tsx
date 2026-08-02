import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstallmentsSelect } from "./InstallmentsSelect";
import type { CardData } from "@/lib/mercadopago";

export interface CardFormState extends CardData {
  installments: number;
  paymentMethodId: string | null;
  issuerId: string | null;
}

export const emptyCardForm: CardFormState = {
  cardNumber: "",
  cardholderName: "",
  expirationMonth: "",
  expirationYear: "",
  securityCode: "",
  identificationNumber: "",
  installments: 1,
  paymentMethodId: null,
  issuerId: null,
};

const maskCardNumber = (v: string) =>
  v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

interface Props {
  value: CardFormState;
  onChange: (next: CardFormState) => void;
  totalCents: number;
}

export function CardPanel({ value, onChange, totalCents }: Props) {
  const set = <K extends keyof CardFormState>(key: K, v: CardFormState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número do cartão</Label>
        <Input
          id="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          className="rounded-none h-12"
          value={maskCardNumber(value.cardNumber)}
          onChange={(e) => set("cardNumber", e.target.value.replace(/\D/g, "").slice(0, 19))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardholderName">Nome impresso no cartão</Label>
        <Input
          id="cardholderName"
          autoComplete="cc-name"
          className="rounded-none h-12 uppercase"
          value={value.cardholderName}
          onChange={(e) => set("cardholderName", e.target.value.toUpperCase())}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expMonth">Mês</Label>
          <Input
            id="expMonth"
            inputMode="numeric"
            maxLength={2}
            placeholder="MM"
            className="rounded-none h-12"
            value={value.expirationMonth}
            onChange={(e) => set("expirationMonth", e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expYear">Ano</Label>
          <Input
            id="expYear"
            inputMode="numeric"
            maxLength={4}
            placeholder="AAAA"
            className="rounded-none h-12"
            value={value.expirationYear}
            onChange={(e) => set("expirationYear", e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            inputMode="numeric"
            maxLength={4}
            className="rounded-none h-12"
            value={value.securityCode}
            onChange={(e) => set("securityCode", e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardDocument">CPF do titular</Label>
        <Input
          id="cardDocument"
          inputMode="numeric"
          className="rounded-none h-12"
          value={value.identificationNumber}
          onChange={(e) => set("identificationNumber", e.target.value.replace(/\D/g, "").slice(0, 14))}
        />
      </div>

      <InstallmentsSelect
        cardNumber={value.cardNumber}
        totalCents={totalCents}
        value={value.installments}
        onChange={(n) => set("installments", n)}
        onPaymentMethod={(info) =>
          onChange({
            ...value,
            paymentMethodId: info.id,
            issuerId: info.issuerId,
          })
        }
      />
    </div>
  );
}
