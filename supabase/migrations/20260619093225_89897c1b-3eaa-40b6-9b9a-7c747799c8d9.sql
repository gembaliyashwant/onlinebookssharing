
-- 1) Books: column-level revoke on contact_number; safe RPC still works (SECURITY DEFINER)
REVOKE SELECT (contact_number) ON public.books FROM authenticated;
REVOKE SELECT (contact_number) ON public.books FROM anon;
REVOKE SELECT (contact_number) ON public.books FROM PUBLIC;
-- Owner still needs to read it (e.g., via select *). Allow owner via RPC only; keep simple by not granting back. Owners use get_book_contact RPC.

-- 2) book_requests: only book owner can update status. Replace permissive update policy.
DROP POLICY IF EXISTS book_requests_update_involved ON public.book_requests;
CREATE POLICY book_requests_update_owner_only ON public.book_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT b.user_id FROM public.books b WHERE b.id = book_requests.book_id))
  WITH CHECK (auth.uid() = (SELECT b.user_id FROM public.books b WHERE b.id = book_requests.book_id));

-- 3) Resources storage: restrict object reads to the owning user's folder.
DROP POLICY IF EXISTS resources_storage_select ON storage.objects;
CREATE POLICY resources_storage_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resources'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Server-issued signed URL for downloading any resource (validates caller is authenticated)
CREATE OR REPLACE FUNCTION public.get_resource_path(_resource_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.file_url FROM public.resources r WHERE r.id = _resource_id
$$;

REVOKE EXECUTE ON FUNCTION public.get_resource_path(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_resource_path(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
