
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS owner_name text;

UPDATE public.books b
SET owner_name = COALESCE(
  (SELECT p.name FROM public.profiles p WHERE p.id = b.user_id),
  'Community'
)
WHERE b.owner_name IS NULL OR btrim(b.owner_name) = '';

ALTER TABLE public.books ALTER COLUMN owner_name SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'books_owner_name_not_blank') THEN
    ALTER TABLE public.books
      ADD CONSTRAINT books_owner_name_not_blank CHECK (btrim(owner_name) <> '');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
