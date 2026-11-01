
DROP VIEW IF EXISTS public.books_public;
CREATE VIEW public.books_public AS
SELECT
  b.id,
  b.user_id,
  b.title,
  b.author,
  b.subject,
  b.class_grade,
  b.description,
  b.locality,
  b.image_url,
  b.status,
  b.created_at,
  CASE
    WHEN auth.uid() = b.user_id THEN b.contact_number
    WHEN EXISTS (
      SELECT 1 FROM public.book_requests br
      WHERE br.book_id = b.id
        AND br.requester_id = auth.uid()
        AND br.status = 'approved'
    ) THEN b.contact_number
    ELSE NULL
  END AS contact_number
FROM public.books b;

GRANT SELECT ON public.books_public TO authenticated;
