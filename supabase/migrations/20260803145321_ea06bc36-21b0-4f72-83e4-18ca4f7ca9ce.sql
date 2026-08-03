ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS sale_price_cents integer,
  ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;

CREATE OR REPLACE FUNCTION public.sync_workshop_spots()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      AND r.status = 'paid'
  ) sub
  WHERE w.id = _wid;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_workshop_guest(_workshop_id uuid, _full_name text, _phone text, _instagram text DEFAULT NULL::text, _dietary_restriction text DEFAULT 'Nenhuma'::text, _wants_glazing boolean DEFAULT false, _notes text DEFAULT NULL::text, _is_waitlist boolean DEFAULT false, _answers jsonb DEFAULT '[]'::jsonb, _extra_cents integer DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- somente inscrições pagas ocupam vaga
  SELECT count(*)::int INTO _taken
  FROM public.workshop_registrations r
  WHERE r.workshop_id = _workshop_id AND r.is_waitlist = false AND r.status = 'paid';

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
$function$;