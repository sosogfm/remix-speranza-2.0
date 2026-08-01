CREATE POLICY "guest personalization upload"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'personalization-uploads'
    AND (storage.foldername(name))[1] = 'guest'
  );