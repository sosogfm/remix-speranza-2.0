import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Instagram, MessageCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

const About = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <Layout>
      {/* Hero */}
      <section ref={heroRef} className="relative h-[80vh] md:h-screen overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImageY }}>
          <img
            src="https://images.unsplash.com/photo-1785706671659-777076389d4c"
            alt="Ateliê de porcelana pintada à mão"
            className="w-full h-[120%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/20 via-charcoal/10 to-charcoal/50" />
        </motion.div>

        <div className="relative container-full h-full flex flex-col justify-end pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/60 mb-5">Nossa história</p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-[0.9]">
              Porcelanas
              <br />
              <span className="italic font-normal">pintadas à mão</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
              De Videira, Santa Catarina, para todo o Brasil — peças que fazemos com tempo, cuidado e afeto.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filosofia */}
      <section className="py-28 md:py-40">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="divider-ornament mb-12">
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary whitespace-nowrap">
                Nossa filosofia
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.25] tracking-tight">
              Acreditamos que as peças que usamos todos os dias podem contar histórias, atravessar gerações e trazer{" "}
              <span className="italic">alegria</span> aos momentos simples.
            </h2>
          </motion.div>
        </div>
      </section>

      {/* História */}
      <section className="pb-20 md:pb-32">
        <div className="container-full">
          <div className="grid md:grid-cols-12 gap-12 lg:gap-20 items-center mb-24 md:mb-36">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="md:col-span-5"
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">O começo</p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-8 leading-tight">
                Um ateliê nascido
                <br />
                <span className="italic">do afeto</span>
              </h3>
              <p className="text-muted-foreground leading-[1.8] mb-5">
                O Speranza Ateliê começou como um encontro entre a pintura e a porcelana — o desejo de transformar
                objetos do dia a dia em lembranças que ficam. Cada caneca, xícara, boleira ou porta joias é pintada à
                mão, uma de cada vez.
              </p>
              <p className="text-muted-foreground leading-[1.8]">
                O que começou pequeno virou um ateliê que envia peças para todo o Brasil e recebe pessoas em oficinas de
                arte em Videira, SC.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="md:col-span-7 relative"
            >
              <div className="aspect-[4/5] overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1785706675081-f5412143707b"
                  alt="Peças de porcelana em ambiente acolhedor"
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-24 md:mb-36"
          >
            <div className="relative h-[50vh] md:h-[70vh] overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1785706675081-f5412143707b?w=1920&q=80"
                alt="Detalhe do trabalho manual no ateliê"
                className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-charcoal/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="font-serif text-3xl md:text-5xl lg:text-6xl text-white text-center max-w-3xl px-6 leading-tight"
                >
                  “A beleza mora na
                  <br />
                  <span className="italic">imperfeição</span>
                  <br />
                  do que é feito à mão”
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-12 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="md:col-span-7 md:order-first"
            >
              <div className="aspect-[4/5] overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1785706671659-777076389d4c?w=1200&q=80"
                  alt="Mãos pintando porcelana"
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="md:col-span-5"
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">Como trabalhamos</p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-8 leading-tight">
                Do ateliê
                <br />
                <span className="italic">para a sua casa</span>
              </h3>
              <p className="text-muted-foreground leading-[1.8] mb-5">
                Muitas peças podem ser personalizadas: uma inicial, um nome, uma frase, uma cor ou até um desenho
                enviado por você. É só escolher a peça e preencher a personalização na página do produto.
              </p>
              <p className="text-muted-foreground leading-[1.8]">
                Depois de pintadas, as peças passam pela queima e são embaladas com cuidado — com opção de embalagem
                para presente — e enviadas para todo o Brasil.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 md:py-36 bg-linen">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">O que nos guia</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">Nossos valores</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
            {[
              {
                title: "Feito à mão",
                number: "01",
                description:
                  "Cada peça é pintada individualmente. Pequenas variações são a assinatura do trabalho artesanal.",
              },
              {
                title: "Personalização",
                number: "02",
                description: "Iniciais, nomes, frases, cores ou desenhos: a peça pode ser pensada para uma pessoa só.",
              },
              {
                title: "Oficinas",
                number: "03",
                description:
                  "Encontros para desacelerar e criar com as próprias mãos, em turmas pequenas e acolhedoras.",
              },
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="text-center"
              >
                <span className="text-[11px] font-semibold tracking-[0.3em] text-primary/50 mb-4 block">
                  {value.number}
                </span>
                <h3 className="font-serif text-2xl text-foreground mb-5">{value.title}</h3>
                <div className="w-8 h-px bg-primary/30 mx-auto mb-5" />
                <p className="text-muted-foreground leading-[1.8]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-28 md:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>

        <div className="relative container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-5">Vamos conversar</p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              Ficou com alguma dúvida?
            </h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
              Chame no WhatsApp ({site.phone}) ou no Instagram — será um prazer ajudar a escolher a peça certa ou pensar
              uma personalização.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase bg-white text-charcoal hover:bg-white/90"
              >
                <a href={site.whatsapp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-3 w-4 h-4" />
                  WhatsApp
                  <ArrowRight className="ml-3 w-4 h-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase bg-transparent text-white border-white/40 hover:bg-white/10"
              >
                <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-3 w-4 h-4" />
                  {site.instagramHandle}
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
