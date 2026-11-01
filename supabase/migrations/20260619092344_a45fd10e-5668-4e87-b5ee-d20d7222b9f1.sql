
CREATE OR REPLACE FUNCTION public.get_books_shared_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM public.books;
$$;

REVOKE EXECUTE ON FUNCTION public.get_books_shared_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_books_shared_count() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
