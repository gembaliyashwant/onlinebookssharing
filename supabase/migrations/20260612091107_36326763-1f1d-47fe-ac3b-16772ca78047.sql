
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_requests TO authenticated;
GRANT ALL ON public.book_requests TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_books_pending_counts()
RETURNS TABLE(book_id uuid, pending_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT br.book_id, count(*)::bigint
  FROM public.book_requests br
  JOIN public.books b ON b.id = br.book_id
  WHERE b.user_id = auth.uid() AND br.status = 'pending'
  GROUP BY br.book_id
$$;

CREATE OR REPLACE FUNCTION public.get_book_requests(_book_id uuid)
RETURNS TABLE(id uuid, requester_name text, requester_email text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT br.id, p.name, p.email, br.status, br.created_at
  FROM public.book_requests br
  JOIN public.profiles p ON p.id = br.requester_id
  JOIN public.books b ON b.id = br.book_id
  WHERE br.book_id = _book_id AND b.user_id = auth.uid()
  ORDER BY br.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_my_books_pending_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_book_requests(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
