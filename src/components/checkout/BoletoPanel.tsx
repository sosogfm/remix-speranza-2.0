import { useState } from "react";
import { Barcode, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string | null;
  barcode: string | null;
  expiresAt?: string | null;
}

export function BoletoPanel({ url, barcode, expiresAt }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!barcode) return;
    await navigator.clipboard.writeText(barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 text-center">
      <Barcode className="w-10 h-10 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        O boleto leva até 2 dias úteis para ser compensado — a peça sai da bancada
        assim que o pagamento for confirmado.
        {expiresAt && (
          <>
            {" "}
            Vence em{" "}
            {new Date(expiresAt).toLocaleDateString("pt-BR")}.
          </>
        )}
      </p>

      {barcode && (
        <div className="space-y-3">
          <p className="text-xs break-all bg-muted p-3 text-left">{barcode}</p>
          <Button type="button" onClick={copy} variant="outline" className="rounded-none">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Linha digitável copiada" : "Copiar linha digitável"}
          </Button>
        </div>
      )}

      {url && (
        <Button asChild className="rounded-none">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Abrir boleto <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      )}
    </div>
  );
}
