import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  qrCodeBase64: string | null;
  qrCode: string | null;
  expiresAt?: string | null;
}

export function PixPanel({ qrCodeBase64, qrCode, expiresAt }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  // Se o Mercado Pago não devolver a imagem pronta, desenhamos o QR Code
  // a partir do código copia e cola.
  useEffect(() => {
    let active = true;
    if (!qrCodeBase64 && qrCode) {
      QRCode.toDataURL(qrCode, { width: 512, margin: 1 })
        .then((url) => {
          if (active) setGenerated(url);
        })
        .catch(() => setGenerated(null));
    } else {
      setGenerated(null);
    }
    return () => {
      active = false;
    };
  }, [qrCode, qrCodeBase64]);

  const imageSrc = qrCodeBase64
    ? `data:image/png;base64,${qrCodeBase64}`
    : generated;

  const copy = async () => {
    if (!qrCode) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(qrCode);
      } else {
        const el = document.createElement("textarea");
        el.value = qrCode;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "Não consegui copiar automaticamente",
        description: "Selecione o código abaixo e copie manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 text-center">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="QR Code do Pix para pagar o pedido"
          className="w-56 h-56 mx-auto border border-border bg-white p-2"
        />
      ) : (
        <div className="w-56 h-56 mx-auto border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground px-4">
          <QrCodeIcon className="w-10 h-10" />
          <span className="text-xs">Gerando o QR Code…</span>
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

      {qrCode ? (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
            Pix copia e cola
          </p>
          <textarea
            readOnly
            value={qrCode}
            onFocus={(e) => e.currentTarget.select()}
            rows={4}
            className="w-full text-xs break-all bg-muted p-3 text-left border border-border resize-none font-mono"
          />
          <Button
            type="button"
            onClick={copy}
            className="rounded-none w-full h-12 text-xs tracking-[0.2em] uppercase"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-destructive">
          Não recebemos o código Pix. Atualize a página ou fale com a gente pelo
          WhatsApp que enviamos a chave na hora.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Assim que o pagamento cair, confirmamos o pedido automaticamente.
      </p>
    </div>
  );
}
