
-- Re-establish explicit column-level revoke for books.contact_number so direct
-- SELECTs return a permission error. The get_book_contact RPC (SECURITY DEFINER)
-- remains the only path to read this column.
GRANT SELECT (id, user_id, title, author, subject, class_grade, description, locality, image_url, status, created_at, owner_name) ON public.books TO authenticated;
GRANT SELECT (id, user_id, title, author, subject, class_grade, description, locality, image_url, status, created_at, owner_name) ON public.books TO anon;
REVOKE SELECT (contact_number) ON public.books FROM authenticated;
REVOKE SELECT (contact_number) ON public.books FROM anon;
REVOKE SELECT (contact_number) ON public.books FROM PUBLIC;

-- Constrain status values on book_requests updates to the allowed set.
DROP POLICY IF EXISTS book_requests_update_owner_only ON public.book_requests;
CREATE POLICY book_requests_update_owner_only ON public.book_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT b.user_id FROM public.books b WHERE b.id = book_requests.book_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT b.user_id FROM public.books b WHERE b.id = book_requests.book_id)
    AND status IN ('pending', 'approved', 'rejected')
  );
