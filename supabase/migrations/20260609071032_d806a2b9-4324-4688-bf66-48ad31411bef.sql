
REVOKE EXECUTE ON FUNCTION public.get_book_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_book_contact(uuid) TO authenticated;
