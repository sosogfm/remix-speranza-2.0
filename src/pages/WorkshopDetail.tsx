import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SmartImage } from "@/components/SmartImage";
import { SaleCountdown } from "@/components/SaleCountdown";
import {
  useWorkshop,
  formatWorkshopDateLong,
  activeWorkshopSaleCents,
  workshopPriceCents,
} from "@/hooks/useWorkshops";
import { formatBRL } from "@/data/products";
import { site } from "@/data/site";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { saveGuestRegistration } from "@/lib/guestOrders";
import {
  useWorkshopQuestionBlocks,
  answerExtraCents,
  BlockAnswer,
} from "@/hooks/useQuestionBlocks";
import { WorkshopQuestionFields } from "@/components/WorkshopQuestionFields";

const WorkshopDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: workshop, isLoading } = useWorkshop(slug);
  const { data: blocks = [] } = useWorkshopQuestionBlocks(workshop?.id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [spots, setSpots] = useState(1);
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

  const blockAnswers: BlockAnswer[] = blocks
    .filter((b) => (answers[b.id] ?? []).filter(Boolean).length > 0)
    .map((b) => ({
      block_id: b.id,
      question: b.question,
      answer: (answers[b.id] ?? []).filter(Boolean),
      extra_cents: answerExtraCents(b, answers[b.id] ?? []),
    }));

  const blocksExtra = blockAnswers.reduce((s, a) => s + a.extra_cents, 0);
  const extraCents = blocksExtra;
  const sale = activeWorkshopSaleCents(workshop);
  const basePrice = workshopPriceCents(workshop);
  const spotsLeft = Math.max(workshop.totalSpots - workshop.spotsTaken, 0);
  const waitlist = workshop.isSoldOut || spotsLeft === 0;
  const maxSpots = Math.max(waitlist ? 10 : Math.min(spotsLeft, 10), 1);
  const quantity = Math.min(Math.max(spots, 1), maxSpots);
  const total = (basePrice + extraCents) * quantity;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast({
        title: "Preencha nome e telefone",
        description: "É por telefone que entramos em contato com você.",
        variant: "destructive",
      });
      return;
    }

    const missing = blocks.find(
      (b) => b.is_required && !(answers[b.id] ?? []).filter(Boolean).length
    );
    if (missing) {
      toast({
        title: "Falta responder uma pergunta",
        description: missing.question,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { data: registrationId, error } = await supabase.rpc(
      "register_workshop_guest",
      {
        _workshop_id: workshop.id,
        _full_name: fullName.trim(),
        _phone: phone.trim(),
        _instagram: instagram.trim() || null,
        _dietary_restriction: "Nenhuma",
        _wants_glazing: false,

        _notes: notes.trim() || null,
        _is_waitlist: waitlist,
        _answers: blockAnswers as any,
        _extra_cents: extraCents,
        _spots: quantity,
      }
    );
    setSubmitting(false);

    if (error) {
      toast({
        title: "Não consegui enviar sua inscrição",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      saveGuestRegistration({
        id: String(registrationId ?? crypto.randomUUID()),
        workshop_id: workshop.id,
        workshop_title: workshop.title,
        workshop_date: workshop.eventDate ?? null,
        full_name: fullName.trim(),
        phone: phone.trim(),
        is_waitlist: waitlist,
        total_cents: total,
        created_at: new Date().toISOString(),
      });
    }

    toast({
      title: waitlist ? "Você entrou na lista de espera" : "Inscrição enviada",
      description: "Vamos te chamar no WhatsApp para confirmar sua vaga.",
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
                <SmartImage
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
            </div>

            {workshop.notes && (
              <p className="text-sm text-muted-foreground">{workshop.notes}</p>
            )}
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <div className="border border-border p-7 space-y-6">
              <div>
                <p className="font-serif text-3xl flex items-baseline gap-3">
                  <span className={sale != null ? "text-primary" : undefined}>
                    {formatBRL(total)}
                  </span>
                  {sale != null && (
                    <span className="text-base text-muted-foreground line-through">
                      {formatBRL((workshop.priceCents + extraCents) * quantity)}
                    </span>
                  )}
                </p>
                {sale != null && <SaleCountdown endsAt={workshop.saleEndsAt} />}
                <p className="text-sm text-muted-foreground">
                  {formatBRL(basePrice + extraCents)} por pessoa · inclui materiais,
                  queima e café da tarde
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quantas vagas?</Label>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setSpots}
                  min={1}
                  max={maxSpots}
                />
              </div>

              {waitlist ? (
                <p className="text-sm text-destructive">
                  Turma esgotada — preencha para entrar na lista de espera.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {spotsLeft} {spotsLeft === 1 ? "vaga disponível" : "vagas disponíveis"} ·
                  a vaga só é reservada depois do pagamento confirmado
                </p>
              )}


              {(

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




                  <WorkshopQuestionFields
                    blocks={blocks}
                    values={answers}
                    onChange={(id, v) =>
                      setAnswers((prev) => ({ ...prev, [id]: v }))
                    }
                  />





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
                Dúvidas? Me chame no{" "}
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
