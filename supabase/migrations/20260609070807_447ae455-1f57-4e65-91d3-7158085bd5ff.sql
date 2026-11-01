
-- 1. Profiles: restrict SELECT to own row
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. Books: hide contact_number from public browsing via a view
--    Keep base-table SELECT broad so existing owner/admin paths keep working,
--    but route the app through a view that masks contact_number unless
--    viewer is the owner or has an approved book_request.
CREATE OR REPLACE VIEW public.books_public
WITH (security_invoker = on) AS
SELECT
  b.id,
  b.user_id,
  b.title,
  b.author,
  b.subject,
  b.class_grade,
  b.description,
  b.locality,
  b.image_url,
  b.status,
  b.created_at,
  CASE
    WHEN auth.uid() = b.user_id THEN b.contact_number
    WHEN EXISTS (
      SELECT 1 FROM public.book_requests br
      WHERE br.book_id = b.id
        AND br.requester_id = auth.uid()
        AND br.status = 'approved'
    ) THEN b.contact_number
    ELSE NULL
  END AS contact_number
FROM public.books b;

GRANT SELECT ON public.books_public TO authenticated;

-- Tighten base table: still allow authenticated users to read non-sensitive
-- fields (needed by the view's security_invoker query and counts), but the
-- app should query the view. The contact_number column is now only meaningful
-- via the view; documenting via comment.
COMMENT ON COLUMN public.books.contact_number IS
  'Sensitive: query via public.books_public which masks this for non-owners/non-approved requesters.';

-- 3. Resources storage bucket: restrict downloads to file owner (folder = uid)
DROP POLICY IF EXISTS resources_storage_select ON storage.objects;
CREATE POLICY resources_storage_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resources'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
