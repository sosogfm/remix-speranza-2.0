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
            src="https://images.unsplash.com/photo-1785706671659-777076389d4c?w=1920&q=80"
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
              Nascido da coragem
              <br />
              <span className="italic font-normal">de recomeçar</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
              De Videira, Santa Catarina, para todo o Brasil — porcelanas pintadas à mão, com tempo, intenção e carinho.
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
              Acreditamos que objetos podem carregar memórias, acolher encontros e fazer parte dos pequenos rituais que
              tornam uma casa mais <span className="italic">viva</span>.
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
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">Quem faz</p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-8 leading-tight">
                Júlia, da odontologia
                <br />
                <span className="italic">à porcelana</span>
              </h3>
              <p className="text-muted-foreground leading-[1.8] mb-5">
                Antes de se dedicar integralmente à porcelana, Júlia era dentista. Apesar de amar a profissão, as artes
                manuais sempre ocuparam um lugar especial na sua vida — ainda na faculdade, produzia peças em biscuit e
                encontrava na criação um refúgio da rotina intensa.
              </p>
              <p className="text-muted-foreground leading-[1.8] mb-5">
                Desde 2019 ela empreende com trabalhos artesanais, até que, em 2023, conheceu a pintura em porcelana. Foi
                um encontro que mudou completamente sua trajetória: encantada pela delicadeza da técnica e pela
                possibilidade de transformar porcelanas em peças únicas, decidiu em 2024 deixar a odontologia para viver
                exclusivamente desse sonho.
              </p>
              <p className="text-muted-foreground leading-[1.8]">
                Assim nasceu o Speranza Ateliê: um espaço onde tradição, delicadeza e afeto se encontram em cada
                pincelada.
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
                  src="https://images.unsplash.com/photo-1785706671659-777076389d4c?w=1920&q=80"
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
                  “Cada peça é criada com
                  <br />
                  <span className="italic">tempo, intenção</span>
                  <br />
                  e carinho”
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
                  src="https://images.unsplash.com/photo-1785705337746-112182618250?w=1200&q=80"
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
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">Como fazemos</p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-8 leading-tight">
                Pintura, queima
                <br />
                <span className="italic">e ouro 24 quilates</span>
              </h3>
              <p className="text-muted-foreground leading-[1.8] mb-5">
                Cada peça é produzida artesanalmente e passa por um cuidadoso processo de pintura e queima em forno
                profissional a aproximadamente 780 °C. Nessa temperatura, as tintas se fundem à porcelana: a decoração
                se torna permanente, resistente ao uso diário e segura para micro-ondas e lava-louças.
              </p>
              <p className="text-muted-foreground leading-[1.8] mb-5">
                Um dos detalhes mais marcantes das nossas criações é o acabamento em ouro. Todas as peças douradas
                recebem ouro verdadeiro, puro 24 quilates, importado, aplicado manualmente para valorizar cada traço.
              </p>
              <p className="text-muted-foreground leading-[1.8]">
                Muitas peças podem ser personalizadas — uma inicial, um nome, uma frase, uma cor ou até um desenho
                enviado por você — e seguem embaladas com cuidado, com opção de embalagem para presente, para todo o
                Brasil.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="pb-24 md:pb-32">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14 md:mb-20"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">Nossa trajetória</p>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground">Passo a passo</h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {[
              { year: "2019", text: "Os primeiros trabalhos artesanais, feitos nas horas livres da odontologia." },
              { year: "2023", text: "O encontro com a pintura em porcelana — e uma trajetória que muda de rumo." },
              { year: "2024", text: "Júlia deixa a odontologia para viver exclusivamente do ateliê." },
              {
                year: "Nov 2024",
                text: "Começam os workshops de artes manuais, para experiências que vão além da técnica.",
              },
              {
                year: "Hoje",
                text: "Porcelanas pintadas à mão, peças personalizadas para celebrar histórias e alunos semanais no ateliê.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="grid grid-cols-[80px_1fr] md:grid-cols-[140px_1fr] gap-4 md:gap-8 border-t border-border py-6 md:py-7"
              >
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary pt-1">
                  {item.year}
                </span>
                <p className="text-muted-foreground leading-[1.8]">{item.text}</p>
              </motion.div>
            ))}
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
                  "Cada peça é pintada individualmente e queimada a cerca de 780 °C — decoração permanente, segura para micro-ondas e lava-louças.",
              },
              {
                title: "Ouro 24k",
                number: "02",
                description:
                  "As peças douradas recebem ouro verdadeiro, puro 24 quilates, importado e aplicado manualmente traço a traço.",
              },
              {
                title: "Oficinas",
                number: "03",
                description:
                  "Desde novembro de 2024, encontros para desacelerar, cultivar a criatividade e criar com as próprias mãos.",
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
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-5">Boas-vindas</p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              Seja bem-vindo ao
              <br />
              <span className="italic">Speranza Ateliê</span>
            </h2>
            <p className="text-white/60 mb-10 max-w-lg mx-auto leading-relaxed">
              Esperamos que nossas peças encontrem um lugar especial na sua casa e na sua história. Ficou com alguma
              dúvida? Chame no WhatsApp ({site.phone}) ou no Instagram — será um prazer ajudar a escolher a peça certa ou
              pensar uma personalização.
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
