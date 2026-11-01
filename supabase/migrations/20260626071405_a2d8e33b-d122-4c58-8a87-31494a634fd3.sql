-- Re-assert column-level restriction on books.contact_number
-- Authenticated users must only see contact_number via get_book_contact RPC
REVOKE SELECT (contact_number) ON public.books FROM authenticated, anon, PUBLIC;

-- Drop and recreate the SELECT policy to exclude contact_number access pattern via a safer policy
-- (policy itself is row-level; column protection is via column privileges above)

-- Verify column-level INSERT/UPDATE still allowed for owner inserts
GRANT INSERT (contact_number), UPDATE (contact_number) ON public.books TO authenticated;