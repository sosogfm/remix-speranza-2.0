import { Link } from "react-router-dom";
import { Instagram, MessageCircle, LinkIcon, MapPin, Phone } from "lucide-react";
import { useCollections } from "@/hooks/useProducts";
import { site } from "@/data/site";
import logoSperanza from "@/assets/logo-speranza.png";

export const Footer = () => {
  const { data: collections = [] } = useCollections();
  return (
    <footer className="bg-foreground text-background">
      <div className="border-b border-brand-rose/20">
        <div className="container-full py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <Link to="/" aria-label={site.name} className="inline-block">
                <img
                  src={logoSperanza}
                  alt={`${site.name} — porcelana pintada à mão`}
                  className="h-14 md:h-16 w-auto brightness-125"
                />
              </Link>
              <p className="mt-3 text-sm text-background/50 leading-relaxed max-w-sm">
                {site.tagline}. Promovo oficinas e aulas de arte. De {site.city}{" "}
                para todo o Brasil.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 h-12 border border-background/20 text-sm hover:bg-background hover:text-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
                {site.instagramHandle}
              </a>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 h-12 border border-background/20 text-sm hover:bg-background hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={site.linktree}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 h-12 border border-background/20 text-sm hover:bg-background hover:text-foreground transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Linktree
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container-full py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Categorias
            </h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    to={`/produtos?colecao=${collection.slug}`}
                    className="text-sm text-background/60 hover:text-background transition-colors duration-300"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Navegar
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/produtos", label: "Todas as peças" },
                { to: "/oficinas", label: "Oficinas" },
                { to: "/sobre", label: "Sobre o ateliê" },
                { to: "/sacola", label: "Minha sacola" },
                { to: "/minha-conta", label: "Minha conta" },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-background/60 hover:text-background transition-colors duration-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Atendimento
            </h4>
            <ul className="space-y-2">
              {site.hoursCompact.map((h) => (
                <li
                  key={h.day}
                  className="text-sm text-background/60 flex justify-between gap-4"
                >
                  <span>{h.day}</span>
                  <span className="text-background/40">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Contato
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-background/60">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {site.address}
              </li>
              <li>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 text-sm text-background/60 hover:text-background transition-colors"
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {site.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>


      <div className="border-t border-background/10">
        <div className="container-full py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/30">
            © {new Date().getFullYear()} {site.name}. Todos os direitos
            reservados.
          </p>
          <p className="text-xs text-background/30">
            Porcelanas afetivas pintadas à mão em {site.city}
          </p>
        </div>
      </div>
    </footer>
  );
};
