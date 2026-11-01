
-- Restore broad browse access on books
DROP POLICY IF EXISTS books_select_own ON public.books;
CREATE POLICY books_select_all_auth ON public.books
  FOR SELECT TO authenticated
  USING (true);

-- Hide contact_number column from direct table reads
REVOKE SELECT ON public.books FROM authenticated;
GRANT SELECT (id, user_id, title, author, subject, class_grade, description,
              locality, image_url, status, created_at) ON public.books TO authenticated;

-- Drop the view (replaced by function)
DROP VIEW IF EXISTS public.books_public;

-- Helper to fetch contact only for owner or approved requester
CREATE OR REPLACE FUNCTION public.get_book_contact(_book_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.contact_number
  FROM public.books b
  WHERE b.id = _book_id
    AND (
      auth.uid() = b.user_id
      OR EXISTS (
        SELECT 1 FROM public.book_requests br
        WHERE br.book_id = b.id
          AND br.requester_id = auth.uid()
          AND br.status = 'approved'
      )
    )
$$;

GRANT EXECUTE ON FUNCTION public.get_book_contact(uuid) TO authenticated;
