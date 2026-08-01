-- 1. Blocos de perguntas reutilizáveis
CREATE TABLE public.workshop_question_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  question text NOT NULL,
  help_text text,
  field_type text NOT NULL DEFAULT 'single',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshop_question_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_question_blocks TO authenticated;
GRANT ALL ON public.workshop_question_blocks TO service_role;
ALTER TABLE public.workshop_question_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question blocks public read" ON public.workshop_question_blocks FOR SELECT USING (true);
CREATE POLICY "question blocks admin write" ON public.workshop_question_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_question_blocks_updated BEFORE UPDATE ON public.workshop_question_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Ligação bloco <-> oficina
CREATE TABLE public.workshop_question_block_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  block_id uuid NOT NULL REFERENCES public.workshop_question_blocks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workshop_id, block_id)
);
GRANT SELECT ON public.workshop_question_block_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_question_block_links TO authenticated;
GRANT ALL ON public.workshop_question_block_links TO service_role;
ALTER TABLE public.workshop_question_block_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block links public read" ON public.workshop_question_block_links FOR SELECT USING (true);
CREATE POLICY "block links admin write" ON public.workshop_question_block_links FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Pedidos de evento privativo
CREATE TABLE public.private_event_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  desired_date date,
  group_size integer,
  experience_type text NOT NULL DEFAULT 'pintura',
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.private_event_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_event_requests TO authenticated;
GRANT ALL ON public.private_event_requests TO service_role;
ALTER TABLE public.private_event_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "private events anyone can request" ON public.private_event_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "private events admin read" ON public.private_event_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "private events admin update" ON public.private_event_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "private events admin delete" ON public.private_event_requests FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_private_events_updated BEFORE UPDATE ON public.private_event_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Respostas nas inscrições
ALTER TABLE public.workshop_registrations
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extra_cents integer NOT NULL DEFAULT 0;

-- 5. Vagas como estoque
CREATE OR REPLACE FUNCTION public.sync_workshop_spots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wid uuid;
BEGIN
  _wid := COALESCE(NEW.workshop_id, OLD.workshop_id);
  UPDATE public.workshops w
  SET spots_taken = sub.taken,
      is_sold_out = (sub.taken >= w.total_spots)
  FROM (
    SELECT count(*)::int AS taken
    FROM public.workshop_registrations r
    WHERE r.workshop_id = _wid
      AND r.is_waitlist = false
      AND r.status <> 'cancelled'
  ) sub
  WHERE w.id = _wid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_registrations_sync_spots
AFTER INSERT OR UPDATE OR DELETE ON public.workshop_registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_workshop_spots();

-- 6. Inscrição com validação de vagas e respostas
CREATE OR REPLACE FUNCTION public.register_workshop_guest(
  _workshop_id uuid,
  _full_name text,
  _phone text,
  _instagram text DEFAULT NULL,
  _dietary_restriction text DEFAULT 'Nenhuma',
  _wants_glazing boolean DEFAULT false,
  _notes text DEFAULT NULL,
  _is_waitlist boolean DEFAULT false,
  _answers jsonb DEFAULT '[]'::jsonb,
  _extra_cents integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _w public.workshops%ROWTYPE;
  _taken int;
  _waitlist boolean;
BEGIN
  IF coalesce(trim(_full_name), '') = '' OR coalesce(trim(_phone), '') = '' THEN
    RAISE EXCEPTION 'Nome e telefone são obrigatórios';
  END IF;

  SELECT * INTO _w FROM public.workshops WHERE id = _workshop_id FOR UPDATE;
  IF _w.id IS NULL THEN
    RAISE EXCEPTION 'Oficina não encontrada';
  END IF;

  SELECT count(*)::int INTO _taken
  FROM public.workshop_registrations r
  WHERE r.workshop_id = _workshop_id AND r.is_waitlist = false AND r.status <> 'cancelled';

  _waitlist := COALESCE(_is_waitlist, false) OR _w.is_sold_out OR _taken >= _w.total_spots;

  IF _waitlist AND NOT _w.allows_waitlist THEN
    RAISE EXCEPTION 'Esta oficina está esgotada';
  END IF;

  INSERT INTO public.workshop_registrations (
    workshop_id, user_id, full_name, instagram, phone,
    dietary_restriction, wants_glazing, notes, is_waitlist, status,
    answers, extra_cents
  ) VALUES (
    _workshop_id, auth.uid(), trim(_full_name), NULLIF(trim(_instagram), ''), trim(_phone),
    COALESCE(_dietary_restriction, 'Nenhuma'), COALESCE(_wants_glazing, false),
    NULLIF(trim(_notes), ''), _waitlist,
    CASE WHEN _waitlist THEN 'waitlist' ELSE 'pending' END,
    COALESCE(_answers, '[]'::jsonb), GREATEST(COALESCE(_extra_cents, 0), 0)
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_workshop_spots() FROM anon, authenticated;