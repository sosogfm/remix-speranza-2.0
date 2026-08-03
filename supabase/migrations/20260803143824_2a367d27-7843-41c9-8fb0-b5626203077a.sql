REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_workshop_spots() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_past_workshops() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

DROP POLICY IF EXISTS "private events anyone can request" ON public.private_event_requests;
CREATE POLICY "private events anyone can request"
ON public.private_event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 8 AND 20
  AND (email IS NULL OR length(email) <= 200)
  AND (message IS NULL OR length(message) <= 2000)
  AND (experience_type IS NULL OR length(experience_type) <= 80)
  AND (group_size IS NULL OR (group_size >= 1 AND group_size <= 200))
);