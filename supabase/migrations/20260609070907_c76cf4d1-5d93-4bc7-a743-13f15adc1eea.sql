
DROP POLICY IF EXISTS books_select_all_auth ON public.books;
CREATE POLICY books_select_own ON public.books
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
