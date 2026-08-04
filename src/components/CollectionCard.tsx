import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Collection } from "@/data/products";
import { SmartImage } from "@/components/SmartImage";

interface CollectionCardProps {
  collection: Collection;
  index?: number;
  variant?: "default" | "wide" | "tall";
  /** fotos das peças desta categoria — alternam automaticamente */
  images?: string[];
}

export const CollectionCard = ({
  collection,
  index = 0,
  variant = "default",
  images = [],
}: CollectionCardProps) => {
  const gallery = images.length ? images : [collection.image];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (gallery.length < 2) return;
    const id = window.setInterval(
      () => setCurrent((c) => (c + 1) % gallery.length),
      4000 + index * 600
    );
    return () => window.clearInterval(id);
  }, [gallery.length, index]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to={`/produtos?colecao=${collection.slug}`}
        className="group block relative"
      >
        <div
          className={`relative overflow-hidden bg-muted/50 ${
            variant === "wide" ? "aspect-[16/9]" :
            variant === "tall" ? "aspect-[2/3]" :
            "aspect-[3/4]"
          }`}
        >
          {/* Capa alternando entre as peças da categoria */}
          {gallery.map((src, i) => (
            <SmartImage
              key={`${src}-${i}`}
              src={src}
              alt={collection.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-110 ${
                i === current % gallery.length ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}


          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
          <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors duration-700" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-8">
            {/* Collection label */}
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/60 mb-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              Collection
            </p>

            {/* Title */}
            <h3 className="font-serif text-2xl md:text-3xl text-white mb-2 transform group-hover:-translate-y-1 transition-transform duration-500">
              {collection.name}
            </h3>

            {/* Description with reveal */}
            <p className="text-sm text-white/70 leading-relaxed max-w-xs transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500 delay-75">
              {collection.description}
            </p>

            {/* Arrow indicator */}
            <div className="flex items-center gap-2 mt-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-150">
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/90">
                Explore
              </span>
              <ArrowRight className="w-4 h-4 text-white/90 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>

          {/* Top border accent on hover */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
        </div>
      </Link>
    </motion.article>
  );
};
