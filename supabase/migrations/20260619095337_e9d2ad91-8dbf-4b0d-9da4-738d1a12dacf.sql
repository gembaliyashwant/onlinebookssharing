REVOKE SELECT (contact_number) ON public.books FROM anon, authenticated, PUBLIC;

DROP POLICY IF EXISTS book_requests_insert_self ON public.book_requests;
CREATE POLICY book_requests_insert_self ON public.book_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');