-- product images: readable by anyone (signed urls / authenticated), writable by admin
CREATE POLICY "product images read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(),'admin'));
CREATE POLICY "product images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND has_role(auth.uid(),'admin'));
CREATE POLICY "product images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND has_role(auth.uid(),'admin'));

-- personalization uploads: owner-scoped
CREATE POLICY "personalization own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'personalization-uploads' AND (owner = auth.uid() OR has_role(auth.uid(),'admin')));
CREATE POLICY "personalization own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'personalization-uploads' AND owner = auth.uid());
CREATE POLICY "personalization own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'personalization-uploads' AND (owner = auth.uid() OR has_role(auth.uid(),'admin')));
