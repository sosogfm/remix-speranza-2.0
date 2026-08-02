/**
 * Imagens de fundo do site.
 *
 * Para trocar qualquer foto, basta substituir o link abaixo
 * (ou importar um arquivo de `src/assets`).
 */
export const siteImages = {
  /** Foto grande do topo da página inicial */
  homeHero: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80",

  /** Página "Sobre" */
  sobreHero: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80",
  sobreBloco1: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80",
  sobreFaixa: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
  sobreBloco2: "https://images.unsplash.com/photo-1785706671659-777076389d4c",
  sobreFinal: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",

  /** Grade do Instagram (usada enquanto não houver conexão com o Instagram) */
  instagramFallback: [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80",
    "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80",
  ],
} as const;
