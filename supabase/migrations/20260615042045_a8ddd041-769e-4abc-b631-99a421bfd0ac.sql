
-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, then grant only where needed.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_book_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_book_contact(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_books_pending_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_books_pending_counts() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_book_requests(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_book_requests(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
