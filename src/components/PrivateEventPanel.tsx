import { useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { privateEvent, site } from "@/data/site";
import { formatBRL } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePrivateEventExperiences } from "@/hooks/useSiteContent";

export const PrivateEventPanel = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const { data: experiences = [] } = usePrivateEventExperiences();
  const options = experiences.length
    ? experiences.map((e) => ({
        value: e.value,
        label: e.label,
        priceCents: e.priceCents ?? 0,
      }))
    : privateEvent.options;
  const [type, setType] = useState(privateEvent.options[0].value);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast({
        title: "Preencha nome e telefone",
        description: "É por telefone que eu entro em contato com você.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("private_event_requests").insert({
      full_name: fullName.trim().slice(0, 120),
      phone: phone.trim().slice(0, 20),
      email: email.trim().slice(0, 255) || null,
      desired_date: date || null,
      group_size: groupSize ? Number(groupSize) : null,
      experience_type: type,
      message: message.trim().slice(0, 800) || null,
    });
    setSending(false);

    if (error) {
      toast({
        title: "Não consegui enviar seu pedido",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setFullName("");
    setPhone("");
    setEmail("");
    setDate("");
    setGroupSize("");
    setMessage("");
    setOpen(false);
    toast({
      title: "Recebi seu pedido!",
      description: "Eu te chamo no WhatsApp para combinarmos os detalhes.",
    });
  };

  return (
    <section className="border border-border bg-muted/20 p-8 md:p-12">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] uppercase text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            {privateEvent.title}
          </p>
          <h2 className="font-serif text-2xl md:text-4xl leading-[1.1]">
            {privateEvent.headline}
          </h2>
          {privateEvent.paragraphs.map((p) => (
            <p key={p} className="text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        <div className="space-y-6">
          <ul className="space-y-3">
            {options.map((o) => (
              <li
                key={o.value}
                className="flex items-baseline justify-between gap-6 border-b border-border pb-3"
              >
                <span className="text-sm">{o.label}</span>
                <span className="font-serif text-xl whitespace-nowrap">
                  {formatBRL(o.priceCents)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {privateEvent.disclaimer}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setOpen((v) => !v)}
              className="rounded-none h-12 text-xs tracking-[0.2em] uppercase"
            >
              {open ? "Fechar formulário" : "Quero um evento privativo"}
            </Button>
            <Button asChild variant="outline" className="rounded-none h-12">
              <a href={site.whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar comigo no WhatsApp
              </a>
            </Button>
          </div>

          {open && (
            <form onSubmit={submit} className="space-y-4 pt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pe-nome">Seu nome *</Label>
                  <Input
                    id="pe-nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-none"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pe-tel">Telefone (WhatsApp) *</Label>
                  <Input
                    id="pe-tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-none"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pe-email">E-mail</Label>
                  <Input
                    id="pe-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-none"
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pe-data">Data desejada</Label>
                  <Input
                    id="pe-data"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pe-pessoas">Quantas pessoas</Label>
                  <Input
                    id="pe-pessoas"
                    type="number"
                    min={1}
                    max={100}
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de experiência</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pe-msg">Me conte um pouco sobre o evento</Label>
                <Textarea
                  id="pe-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-none min-h-24"
                  maxLength={800}
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="rounded-none h-12 w-full text-xs tracking-[0.2em] uppercase"
              >
                {sending ? "Enviando…" : "Enviar pedido"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
