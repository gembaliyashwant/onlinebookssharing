
DROP POLICY IF EXISTS resources_storage_select_own ON storage.objects;
CREATE POLICY resources_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resources');
