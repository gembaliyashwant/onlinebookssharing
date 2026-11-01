-- Defense-in-depth: restrictive policy ensuring only the book owner can update book_requests,
-- evaluated in addition to (AND) the permissive owner-only policy.
DROP POLICY IF EXISTS book_requests_update_restrict_to_owner ON public.book_requests;
CREATE POLICY book_requests_update_restrict_to_owner ON public.book_requests
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT b.user_id FROM public.books b WHERE b.id = book_requests.book_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT b.user_id FROM public.books b WHERE b.id = book_requests.book_id)
    AND status IN ('pending', 'approved', 'rejected')
  );

-- Re-assert column revoke in case grants drifted.
REVOKE SELECT (contact_number) ON public.books FROM authenticated;
REVOKE SELECT (contact_number) ON public.books FROM anon;
REVOKE SELECT (contact_number) ON public.books FROM PUBLIC;