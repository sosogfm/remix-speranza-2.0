REVOKE EXECUTE ON FUNCTION public.cleanup_past_workshops() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.cleanup_past_workshops() TO service_role;