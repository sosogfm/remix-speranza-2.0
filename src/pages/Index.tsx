import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Instagram } from "lucide-react";
import { useRef } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { CollectionCard } from "@/components/CollectionCard";
import { ReviewsMarquee } from "@/components/ReviewsMarquee";
import { useProducts, useCollections } from "@/hooks/useProducts";
import { siteImages } from "@/data/images";
import { site } from "@/data/site";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: allProducts = [] } = useProducts();
  const { data: collections = [] } = useCollections();
  const newProducts = allProducts.filter((p) => p.new);
  const latestProducts = allProducts.slice(0, 4);
  const displayedCollections = collections.slice(0, 6);
  const featuredCollection = collections[0];

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const instagramImages = siteImages.instagramFallback;

  return (
    <Layout>
      {/* Hero Section — Full Viewport */}
      <section ref={heroRef} className="relative h-[100svh] -mt-16 md:-mt-20 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImageY }}>
          <img
            src={siteImages.homeHero}
            alt="Porcelana artesanal Speranza Ateliê"
            className="w-full h-[120%] object-cover animate-ken-burns"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/10 to-charcoal/50" />
        </motion.div>

        <motion.div
          className="relative container-full h-full flex flex-col justify-end pb-20 md:pb-28 pt-16 md:pt-20"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="max-w-3xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/70 mb-6"
            >
              Porcelana artesanal · Videira, SC
            </motion.p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-white mb-8 leading-[0.9] tracking-tight">
              Porcelanas
              <br />
              <span className="italic font-normal">afetivas</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed max-w-lg">
              Pintamos cada peça à mão, uma a uma, no nosso ateliê em Videira — para
              acompanhar os momentos mais bonitos da sua casa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                <Link to="/produtos">
                  Ver peças
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase bg-background/10 text-white border-white/40 hover:bg-background/20"
              >
                <Link to="/oficinas">Oficinas</Link>
              </Button>
            </div>

          </motion.div>
        </motion.div>

      </section>

      {/* Featured Collection */}
      {featuredCollection && (
      <section className="py-20 md:py-28">

        <div className="container-full">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="relative aspect-[4/5] overflow-hidden group"
            >
              <img
                src={featuredCollection.heroImage || featuredCollection.image}
                alt={featuredCollection.name}
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="md:py-12"
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">
                Categoria em destaque
              </p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-[0.95]">
                {featuredCollection.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
                {featuredCollection.description}. Cada peça é modelada, pintada e
                queimada à mão — pequenas imperfeições fazem parte da beleza do
                feito artesanalmente.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                <Link to={`/produtos?colecao=${featuredCollection.slug}`}>
                  Ver {featuredCollection.name}
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Link>
              </Button>

            </motion.div>
          </div>
        </div>
      </section>
      )}


      {/* Latest Products */}
      <section className="py-20 md:py-28 bg-linen">
        <div className="container-full">
          <div className="flex items-end justify-between mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
                Acabou de chegar
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground">
                Novidades do ateliê
              </h2>
            </motion.div>
            <Link
              to="/produtos"
              className="hidden md:flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors group"
            >
              Ver todas

              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {latestProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <div className="mt-14 text-center md:hidden">
            <Button
              asChild
              variant="outline"
              className="rounded-none px-8 py-5 text-sm tracking-[0.15em] uppercase"
            >
              <Link to="/produtos">Ver todas as peças</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-24 md:py-32">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
              Navegue por
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Categorias
            </h2>

          </motion.div>

          {/* Asymmetric grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {displayedCollections.map((collection, i) => {
              const span =
                i === 0 ? "md:col-span-7" :
                i === 1 ? "md:col-span-5" :
                i === 5 ? "md:col-span-12" :
                "md:col-span-4";
              const variant = i === 0 || i === 5 ? "wide" : "default";
              return (
                <div key={collection.id ?? collection.slug} className={span}>
                  <CollectionCard
                    collection={collection}
                    index={i}
                    variant={variant}
                    images={allProducts
                      .filter(
                        (p) =>
                          p.collection === collection.slug ||
                          p.collectionSlugs?.includes(collection.slug)
                      )
                      .map((p) => p.images[0])
                      .filter(Boolean)
                      .slice(0, 5)}
                  />
                </div>

              );
            })}
          </div>

        </div>
      </section>

      <ReviewsMarquee />

      {/* About Us Section */}
      <section className="py-24 md:py-32 bg-linen">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-6">
              Sobre o ateliê
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.3] mb-8">
              Objetos podem carregar memórias e fazer parte dos pequenos rituais
              que tornam uma casa mais <span className="italic">viva</span>.
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Pintamos cada porcelana à mão aqui em Videira (SC), com queima em forno
              profissional a cerca de 780 °C e acabamento em ouro verdadeiro 24 quilates.
              Também promovemos oficinas e aulas de arte para quem quer viver o processo
              de perto.
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase"
            >
              <Link to="/sobre">
                Conheça nossa história
                <ArrowRight className="ml-3 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Instagram */}
      <section className="py-20 md:py-28">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
              Acompanhe
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              {site.instagramHandle}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Bastidores do ateliê, novidades e datas das próximas oficinas.
            </p>

          </motion.div>

          {/* Instagram Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
            {instagramImages.map((image, index) => (
              <motion.a
                key={index}
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative aspect-square overflow-hidden group cursor-pointer"
              >
                <img
                  src={image}
                  alt="Publicação do Speranza Ateliê no Instagram"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition-colors duration-300 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
