import { useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  qrCodeBase64: string | null;
  qrCode: string | null;
  expiresAt?: string | null;
}

export function PixPanel({ qrCodeBase64, qrCode, expiresAt }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 text-center">
      {qrCodeBase64 ? (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code do Pix para pagar o pedido"
          className="w-56 h-56 mx-auto border border-border bg-white p-2"
        />
      ) : (
        <div className="w-56 h-56 mx-auto border border-dashed border-border flex items-center justify-center text-muted-foreground">
          <QrCode className="w-10 h-10" />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Abra o app do seu banco, escaneie o QR Code ou use o código copia e cola.
        {expiresAt && (
          <>
            {" "}
            O código vale até{" "}
            {new Date(expiresAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </>
        )}
      </p>

      {qrCode && (
        <div className="space-y-3">
          <p className="text-xs break-all bg-muted p-3 text-left">{qrCode}</p>
          <Button type="button" onClick={copy} variant="outline" className="rounded-none">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Assim que o pagamento cair, confirmamos o pedido automaticamente.
      </p>
    </div>
  );
}
