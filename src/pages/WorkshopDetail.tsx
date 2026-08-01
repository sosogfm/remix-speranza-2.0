import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock, User } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useWorkshop, formatWorkshopDateLong } from "@/hooks/useWorkshops";
import { formatBRL } from "@/data/products";
import { site } from "@/data/site";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const dietOptions = ["Nenhuma", "Vegetariano", "Vegano", "Sem glúten"];

const WorkshopDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: workshop, isLoading } = useWorkshop(slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [diet, setDiet] = useState("Nenhuma");
  const [glazing, setGlazing] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center text-muted-foreground">
          Carregando oficina…
        </div>
      </Layout>
    );
  }

  if (!workshop) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center space-y-5">
          <h1 className="font-serif text-4xl">Oficina não encontrada</h1>
          <Button asChild className="rounded-none">
            <Link to="/oficinas">Ver todas as oficinas</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const total =
    workshop.priceCents + (glazing ? workshop.glazingPriceCents : 0);
  const waitlist = workshop.isSoldOut;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/oficinas/${workshop.slug}`)}`);
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      toast({
        title: "Preencha nome e telefone",
        description: "É por telefone que a Júlia entra em contato.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("workshop_registrations").insert({
      workshop_id: workshop.id,
      user_id: user.id,
      full_name: fullName.trim(),
      email: user.email,
      instagram: instagram.trim() || null,
      phone: phone.trim(),
      dietary_restriction: diet,
      wants_glazing: glazing,
      notes: notes.trim() || null,
      status: waitlist ? "waitlist" : "pending",
      total_cents: total,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Não consegui enviar sua inscrição",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: waitlist ? "Você entrou na lista de espera" : "Inscrição enviada",
      description: "A Júlia entra em contato pelo WhatsApp para confirmar sua vaga.",
    });
    navigate("/minha-conta");
  };

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/oficinas" className="hover:text-foreground transition-colors">
            Oficinas
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{workshop.title}</span>
        </div>
      </div>

      <section className="py-12 md:py-16">
        <div className="container-full grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7 space-y-8">
            <div className="aspect-[4/3] bg-muted/40 overflow-hidden">
              {workshop.imageUrl ? (
                <img
                  src={workshop.imageUrl}
                  alt={`Oficina ${workshop.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-serif text-6xl text-muted-foreground/40">
                  {workshop.title.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <h1 className="font-serif text-3xl md:text-5xl leading-[1.05] mb-5">
                {workshop.title}
              </h1>
              {workshop.summary && (
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {workshop.summary}
                </p>
              )}
              {workshop.description && (
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {workshop.description}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm border-y border-border py-6">
              <p className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-primary" />
                {formatWorkshopDateLong(workshop.eventDate)}
              </p>
              <p className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary" />
                {workshop.startTime?.slice(0, 5) ?? "14h"} –{" "}
                {workshop.endTime?.slice(0, 5) ?? "18h"}
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                {workshop.location}
              </p>
              {workshop.teacher && (
                <p className="flex items-center gap-3">
                  <User className="w-4 h-4 text-primary" />
                  Professora {workshop.teacher}
                </p>
              )}
            </div>

            {workshop.notes && (
              <p className="text-sm text-muted-foreground">{workshop.notes}</p>
            )}
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <div className="border border-border p-7 space-y-6">
              <div>
                <p className="font-serif text-3xl">{formatBRL(total)}</p>
                <p className="text-sm text-muted-foreground">
                  por pessoa · inclui materiais, queima e café da tarde
                </p>
              </div>

              {waitlist && (
                <p className="text-sm text-destructive">
                  Turma esgotada — preencha para entrar na lista de espera.
                </p>
              )}

              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Entre na sua conta para garantir sua vaga.
                  </p>
                  <Button
                    className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase"
                    onClick={() =>
                      navigate(
                        `/auth?redirect=${encodeURIComponent(`/oficinas/${workshop.slug}`)}`
                      )
                    }
                  >
                    Entrar para inscrever
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Seu nome *</Label>
                    <Input
                      id="nome"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="rounded-none"
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insta">Seu Instagram</Label>
                    <Input
                      id="insta"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seuinstagram"
                      className="rounded-none"
                      maxLength={60}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tel">Telefone (WhatsApp) *</Label>
                    <Input
                      id="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(49) 99999-0000"
                      className="rounded-none"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Restrições alimentares</Label>
                    <RadioGroup value={diet} onValueChange={setDiet} className="space-y-2">
                      {dietOptions.map((o) => (
                        <div key={o} className="flex items-center gap-3">
                          <RadioGroupItem value={o} id={`diet-${o}`} />
                          <Label htmlFor={`diet-${o}`} className="font-normal">
                            {o}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {workshop.glazingAvailable && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={glazing}
                        onCheckedChange={(v) => setGlazing(Boolean(v))}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground">
                        Quero fazer a esmaltação da minha peça em outro encontro
                        (+{formatBRL(workshop.glazingPriceCents)})
                      </span>
                    </label>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="obs">Alguma observação?</Label>
                    <Textarea
                      id="obs"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-none min-h-20"
                      maxLength={500}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase"
                  >
                    {submitting
                      ? "Enviando…"
                      : waitlist
                        ? "Entrar na lista de espera"
                        : "Garantir minha vaga"}
                  </Button>
                </form>
              )}

              <p className="text-xs text-muted-foreground">
                Dúvidas? Fale com a Júlia pelo{" "}
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsApp
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WorkshopDetail;
