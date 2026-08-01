CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito';
  END IF;
  RETURN QUERY
  SELECT r.user_id, u.email::text, r.created_at
  FROM public.user_roles r
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.role = 'admin'
  ORDER BY r.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito';
  END IF;

  SELECT id INTO _uid FROM auth.users
  WHERE lower(email) = lower(trim(_email))
  LIMIT 1;

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Nenhuma conta encontrada com este e-mail. Peça para a pessoa criar uma conta no site primeiro.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode remover o seu próprio acesso.';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
END;
$$;

REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grant_admin_by_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;