CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subject TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_all_auth" ON public.resources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "resources_insert_own" ON public.resources
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resources_update_own" ON public.resources
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "resources_delete_own" ON public.resources
  FOR DELETE TO authenticated USING (auth.uid() = user_id);