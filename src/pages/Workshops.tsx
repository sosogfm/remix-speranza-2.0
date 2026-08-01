import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import {
  useWorkshops,
  formatWorkshopDate,
  Workshop,
} from "@/hooks/useWorkshops";
import { formatBRL } from "@/data/products";
import { site, workshopsAbout, firingInfo } from "@/data/site";
import { PrivateEventPanel } from "@/components/PrivateEventPanel";
import { Button } from "@/components/ui/button";

const WorkshopCard = ({ w, index }: { w: Workshop; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: index * 0.06 }}
    className="group"
  >
    <Link to={`/oficinas/${w.slug}`} className="block">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/40 mb-5">
        {w.imageUrl ? (
          <img
            src={w.imageUrl}
            alt={`Oficina ${w.title} — Speranza Ateliê`}
            className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-5xl text-muted-foreground/40">
              {formatWorkshopDate(w.eventDate)}
            </span>
          </div>
        )}
        <span className="absolute top-5 left-5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-foreground text-background">
          {formatWorkshopDate(w.eventDate)}
        </span>
        {w.isSoldOut && (
          <span className="absolute top-5 right-5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground">
            Esgotado
          </span>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-xl leading-snug transition-colors group-hover:text-primary">
          {w.title}
        </h3>
        {w.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {w.summary}
          </p>
        )}
        <p className="text-base font-medium pt-1">{formatBRL(w.priceCents)}</p>
        <p className="text-xs text-muted-foreground">
          {w.location} · {w.isSoldOut ? "lista de espera" : `${Math.max(w.totalSpots - w.spotsTaken, 0)} vagas`}
        </p>
      </div>
    </Link>
  </motion.article>
);

const Workshops = () => {
  const { data: workshops = [], isLoading } = useWorkshops();
  const published = workshops.filter((w) => w.isPublished);

  return (
    <Layout>
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container-narrow text-center">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">
            Speranza Ateliê
          </p>
          <h1 className="font-serif text-4xl md:text-6xl mb-6 leading-[1.05]">
            Oficinas
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Faço um convite para você desacelerar e se reconectar com o que é
            simples e essencial. No meu ateliê, em um ambiente acolhedor, te
            ensino as bases da arte em porcelana e cerâmica — sem precisar de
            experiência. Vagas limitadas, com materiais, queima das peças e café
            da tarde inclusos.
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            {site.address} · Dúvidas pelo{" "}
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </section>

      <section className="pt-14 md:pt-20">
        <div className="container-full">
          <PrivateEventPanel />
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-full">
          <h2 className="font-serif text-2xl md:text-3xl mb-10">
            Próximas turmas
          </h2>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-16">
              Carregando oficinas…
            </p>
          ) : published.length === 0 ? (
            <div className="text-center py-16 space-y-5">
              <p className="text-muted-foreground">
                Ainda não tenho turma aberta no momento. Anuncio as novas datas
                em breve.
              </p>
              <Button asChild variant="outline" className="rounded-none">
                <a href={site.instagram} target="_blank" rel="noreferrer">
                  Acompanhar no Instagram
                </a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {published.map((w, i) => (
                <WorkshopCard key={w.id} w={w} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-narrow grid md:grid-cols-2 gap-12">
          {[workshopsAbout, firingInfo].map((block) => (
            <div key={block.title} className="space-y-4">
              <h2 className="font-serif text-2xl">{block.title}</h2>
              {block.paragraphs.map((p) => (
                <p key={p} className="text-muted-foreground leading-relaxed text-sm">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};


export default Workshops;
