// Roda antes de `vite dev` e `vite build` (predev/prebuild); escreve public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://speranzatelie.com.br";

const SUPABASE_URL = "https://ilqhmdyjrstajgnfyjyg.supabase.co";
const SUPABASE_KEY = "sb_publishable_dmOTRgWCui-vYwQQXIjb8A__Z9X_gpr";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/produtos", changefreq: "daily", priority: "0.9" },
  { path: "/oficinas", changefreq: "weekly", priority: "0.8" },
  { path: "/sobre", changefreq: "monthly", priority: "0.6" },
];

async function fetchRows(table: string, query: string): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as { slug: string }[];
  } catch {
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const products = await fetchRows("products", "select=slug&is_published=eq.true");
const workshops = await fetchRows("workshops", "select=slug&is_published=eq.true");

const entries: SitemapEntry[] = [
  ...staticEntries,
  ...products.map((p) => ({
    path: `/produto/${p.slug}`,
    changefreq: "weekly" as const,
    priority: "0.8",
  })),
  ...workshops.map((w) => ({
    path: `/oficinas/${w.slug}`,
    changefreq: "weekly" as const,
    priority: "0.7",
  })),
];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
