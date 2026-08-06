import { useSignedUrls } from "@/lib/storage";

const FILE_RE = /[\w.-]+\/[\w.-]+\.(png|jpe?g|webp|gif|pdf)/gi;

/** Extrai os arquivos enviados pelo cliente (caminhos do bucket privado) */
export const extractUploadPaths = (text?: string | null): string[] => {
  if (!text) return [];
  return Array.from(new Set(text.match(FILE_RE) ?? []));
};

/** Mostra as imagens/desenhos enviados na personalização de um item do pedido */
export const AdminPersonalizationPreview = ({
  text,
}: {
  text?: string | null;
}) => {
  const paths = extractUploadPaths(text);
  const { data: signed = {} } = useSignedUrls(paths, "personalization-uploads");

  if (paths.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {paths.map((p) => {
        const url = signed[p];
        const isPdf = p.toLowerCase().endsWith(".pdf");
        if (!url)
          return (
            <span key={p} className="text-xs text-muted-foreground">
              Carregando arquivo…
            </span>
          );
        return (
          <a
            key={p}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block border border-border hover:border-foreground transition-colors"
            title={p.split("/").pop()}
          >
            {isPdf ? (
              <span className="block px-3 py-6 text-xs text-muted-foreground">
                Ver PDF enviado
              </span>
            ) : (
              <img
                src={url}
                alt="Arquivo enviado pelo cliente"
                className="w-24 h-24 object-cover"
              />
            )}
          </a>
        );
      })}
    </div>
  );
};
