import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://speranzatelie.com.br";

interface SeoProps {
  title: string;
  description: string;
  /** caminho da página, ex.: "/produtos" */
  path: string;
  image?: string | null;
  /** dados estruturados extras (JSON-LD) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

/** Título, descrição, canônica e prévia de compartilhamento de cada página */
export const Seo = ({
  title,
  description,
  path,
  image,
  jsonLd,
  noindex,
}: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Speranza Ateliê" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};
