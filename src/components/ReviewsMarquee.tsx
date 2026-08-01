import { useReviews } from "@/hooks/useSiteContent";
import { useSignedUrls } from "@/lib/storage";

/** Faixa de avaliações que corre sozinha na homepage */
export const ReviewsMarquee = () => {
  const { data: reviews = [] } = useReviews();
  const { data: signed = {} } = useSignedUrls(reviews.map((r) => r.imageUrl));

  if (reviews.length === 0) return null;

  const loop = [...reviews, ...reviews];

  return (
    <section className="py-16 md:py-24 border-t border-border overflow-hidden">
      <div className="container-full mb-10">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
          Quem já levou uma peça para casa
        </p>
        <h2 className="font-serif text-3xl md:text-4xl">O que dizem por aí</h2>
      </div>

      <div className="relative">
        <div className="flex gap-6 w-max animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
          {loop.map((r, i) => {
            const url = signed[r.imageUrl];
            if (!url) return null;
            return (
              <figure
                key={`${r.id}-${i}`}
                className="w-64 md:w-72 shrink-0 border border-border bg-background"
              >
                <img
                  src={url}
                  alt={
                    r.authorName
                      ? `Avaliação de ${r.authorName}`
                      : "Avaliação de cliente do Speranza Ateliê"
                  }
                  loading="lazy"
                  className="w-full h-auto object-contain"
                />
                {r.authorName && (
                  <figcaption className="px-4 py-3 text-xs text-muted-foreground">
                    {r.authorName}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
};
