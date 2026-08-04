import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReviews } from "@/hooks/useSiteContent";
import { useSignedUrls } from "@/lib/storage";

/** Faixa de avaliações navegada manualmente (arrastar ou setas) */
export const ReviewsMarquee = () => {
  const { data: reviews = [] } = useReviews();
  const { data: signed = {} } = useSignedUrls(reviews.map((r) => r.imageUrl));
  const trackRef = useRef<HTMLDivElement>(null);

  if (reviews.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="py-12 md:py-24 border-t border-border">
      <div className="container-full mb-6 md:mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
            Quem já levou uma peça para casa
          </p>
          <h2 className="font-serif text-2xl md:text-4xl">O que dizem por aí</h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Ver avaliações anteriores"
            className="p-2.5 border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Ver próximas avaliações"
            className="p-2.5 border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth px-5 md:px-10 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => {
          const url = signed[r.imageUrl];
          if (!url) return null;
          return (
            <figure
              key={r.id}
              className="shrink-0 snap-start border border-border bg-background rounded-xl overflow-hidden"
            >
              <img
                src={url}
                alt={
                  r.authorName
                    ? `Avaliação de ${r.authorName}`
                    : "Avaliação de cliente do Speranza Ateliê"
                }
                loading="lazy"
                className="h-48 md:h-64 w-auto object-contain"
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
    </section>
  );
};
