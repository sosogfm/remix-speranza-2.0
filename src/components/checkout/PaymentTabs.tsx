import { Barcode, CreditCard, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardPanel, type CardFormState } from "./CardPanel";

export type PaymentMethod = "pix" | "boleto" | "card";

interface Props {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  card: CardFormState;
  onCardChange: (next: CardFormState) => void;
  totalCents: number;
}

/** Abas de pagamento: Pix, Boleto e Cartão (com parcelamento) */
export function PaymentTabs({
  method,
  onMethodChange,
  card,
  onCardChange,
  totalCents,
}: Props) {
  return (
    <Tabs value={method} onValueChange={(v) => onMethodChange(v as PaymentMethod)}>
      <TabsList className="w-full grid grid-cols-3 rounded-none h-auto p-1">
        <TabsTrigger value="pix" className="rounded-none py-3 text-xs tracking-[0.1em] uppercase">
          <QrCode className="w-4 h-4 mr-2" /> Pix
        </TabsTrigger>
        <TabsTrigger value="boleto" className="rounded-none py-3 text-xs tracking-[0.1em] uppercase">
          <Barcode className="w-4 h-4 mr-2" /> Boleto
        </TabsTrigger>
        <TabsTrigger value="card" className="rounded-none py-3 text-xs tracking-[0.1em] uppercase">
          <CreditCard className="w-4 h-4 mr-2" /> Cartão
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pix" className="pt-6">
        <p className="text-sm text-muted-foreground">
          Ao confirmar, geramos o QR Code e o código copia e cola na hora. O pedido é
          confirmado automaticamente assim que o Pix cair.
        </p>
      </TabsContent>

      <TabsContent value="boleto" className="pt-6">
        <p className="text-sm text-muted-foreground">
          Geramos o boleto com a linha digitável para você pagar pelo banco. A
          compensação leva até 2 dias úteis.
        </p>
      </TabsContent>

      <TabsContent value="card" className="pt-6">
        <CardPanel value={card} onChange={onCardChange} totalCents={totalCents} />
      </TabsContent>
    </Tabs>
  );
}
