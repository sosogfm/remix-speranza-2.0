DROP POLICY IF EXISTS "private events anyone can request" ON public.private_event_requests;
CREATE POLICY "private events anyone can request"
ON public.private_event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 8 AND 20
  AND (email IS NULL OR length(email) <= 255)
  AND (message IS NULL OR length(message) <= 2000)
  AND (experience_type IS NULL OR length(experience_type) <= 80)
  AND (group_size IS NULL OR (group_size >= 1 AND group_size <= 200))
);