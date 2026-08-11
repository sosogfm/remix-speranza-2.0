-- 1) Tighten guest personalization uploads
DROP POLICY IF EXISTS "guest personalization upload" ON storage.objects;
CREATE POLICY "guest personalization upload"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'personalization-uploads'
  AND (storage.foldername(name))[1] = 'guest'
  AND array_length(storage.foldername(name), 1) = 1
  AND length(name) < 200
  AND lower(name) ~ '\.(png|jpg|jpeg|webp|gif|heic|pdf)$'
);

-- 2) Explicitly scope authenticated workshop registration inserts
DROP POLICY IF EXISTS "registrations own insert" ON public.workshop_registrations;
CREATE POLICY "registrations own insert"
ON public.workshop_registrations FOR INSERT TO authenticated
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());
