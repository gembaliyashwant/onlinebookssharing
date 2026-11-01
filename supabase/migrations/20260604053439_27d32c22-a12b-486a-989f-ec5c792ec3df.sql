CREATE POLICY "resources_storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'resources');

CREATE POLICY "resources_storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resources_storage_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resources_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]
  );