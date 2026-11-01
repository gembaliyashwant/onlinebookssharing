
DELETE FROM public.book_requests a
USING public.book_requests b
WHERE a.book_id = b.book_id
  AND a.requester_id = b.requester_id
  AND a.created_at < b.created_at;

ALTER TABLE public.book_requests
  ADD CONSTRAINT book_requests_book_requester_unique UNIQUE (book_id, requester_id);
