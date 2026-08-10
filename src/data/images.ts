/**
 * Imagens de fundo do site.
 *
 * Para trocar qualquer foto, basta substituir o link abaixo
 * (ou importar um arquivo de `src/assets`).
 */
import pratinhosMonograma from "@/assets/pratinhos-monograma.jpg.asset.json";
import insta1 from "@/assets/insta-1.avif.asset.json";
import insta2 from "@/assets/insta-2.avif.asset.json";
import insta3 from "@/assets/insta-3.avif.asset.json";
import insta4 from "@/assets/insta-4.avif.asset.json";
import insta5 from "@/assets/insta-5.avif.asset.json";
import insta6 from "@/assets/insta-6.avif.asset.json";

export const siteImages = {
  /** Foto grande do topo da página inicial */
  homeHero: pratinhosMonograma.url,


  /** Página "Sobre" */
  sobreHero: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
  sobreBloco1: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80",
  sobreFaixa: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
  sobreBloco2: "https://images.unsplash.com/photo-1785706671659-777076389d4c",
  sobreFinal: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",

  /** Grade do Instagram (usada enquanto não houver conexão com o Instagram) */
  instagramFallback: [
    insta1.url,
    insta2.url,
    insta3.url,
    insta4.url,
    insta5.url,
    insta6.url,
  ],
} as const;
