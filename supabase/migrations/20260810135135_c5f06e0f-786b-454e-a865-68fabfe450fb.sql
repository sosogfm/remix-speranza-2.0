ALTER TABLE public.workshop_registrations
  ADD COLUMN IF NOT EXISTS spots integer NOT NULL DEFAULT 1;

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
    SELECT COALESCE(sum(GREATEST(r.spots, 1)), 0)::int AS taken
    FROM public.workshop_registrations r
    WHERE r.workshop_id = _wid
      AND r.is_waitlist = false
      AND r.status = 'paid'
  ) sub
  WHERE w.id = _wid;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.register_workshop_guest(_workshop_id uuid, _full_name text, _phone text, _instagram text DEFAULT NULL::text, _dietary_restriction text DEFAULT 'Nenhuma'::text, _wants_glazing boolean DEFAULT false, _notes text DEFAULT NULL::text, _is_waitlist boolean DEFAULT false, _answers jsonb DEFAULT '[]'::jsonb, _extra_cents integer DEFAULT 0, _spots integer DEFAULT 1)
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
  _qty int;
BEGIN
  IF coalesce(trim(_full_name), '') = '' OR coalesce(trim(_phone), '') = '' THEN
    RAISE EXCEPTION 'Nome e telefone são obrigatórios';
  END IF;

  _qty := GREATEST(COALESCE(_spots, 1), 1);

  SELECT * INTO _w FROM public.workshops WHERE id = _workshop_id FOR UPDATE;
  IF _w.id IS NULL THEN
    RAISE EXCEPTION 'Oficina não encontrada';
  END IF;

  -- somente inscrições pagas ocupam vaga
  SELECT COALESCE(sum(GREATEST(r.spots, 1)), 0)::int INTO _taken
  FROM public.workshop_registrations r
  WHERE r.workshop_id = _workshop_id AND r.is_waitlist = false AND r.status = 'paid';

  _waitlist := COALESCE(_is_waitlist, false) OR _w.is_sold_out OR (_taken + _qty) > _w.total_spots;

  IF _waitlist AND NOT _w.allows_waitlist THEN
    RAISE EXCEPTION 'Esta oficina está esgotada';
  END IF;

  INSERT INTO public.workshop_registrations (
    workshop_id, user_id, full_name, instagram, phone,
    dietary_restriction, wants_glazing, notes, is_waitlist, status,
    answers, extra_cents, spots
  ) VALUES (
    _workshop_id, auth.uid(), trim(_full_name), NULLIF(trim(_instagram), ''), trim(_phone),
    COALESCE(_dietary_restriction, 'Nenhuma'), COALESCE(_wants_glazing, false),
    NULLIF(trim(_notes), ''), _waitlist,
    CASE WHEN _waitlist THEN 'waitlist' ELSE 'pending' END,
    COALESCE(_answers, '[]'::jsonb), GREATEST(COALESCE(_extra_cents, 0), 0), _qty
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_workshop_guest(uuid, text, text, text, text, boolean, text, boolean, jsonb, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_workshop_guest(uuid, text, text, text, text, boolean, text, boolean, jsonb, integer, integer) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_workshop_spots() FROM PUBLIC;