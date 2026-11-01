
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles_select_all_auth" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- trigger to auto-create profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- books
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null,
  subject text not null,
  class_grade text not null,
  description text,
  locality text not null,
  contact_number text not null,
  image_url text,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

create index books_user_id_idx on public.books(user_id);
create index books_subject_idx on public.books(subject);

grant select, insert, update, delete on public.books to authenticated;
grant all on public.books to service_role;

alter table public.books enable row level security;

create policy "books_select_all_auth" on public.books
  for select to authenticated using (true);

create policy "books_insert_own" on public.books
  for insert to authenticated with check (auth.uid() = user_id);

create policy "books_update_own" on public.books
  for update to authenticated using (auth.uid() = user_id);

create policy "books_delete_own" on public.books
  for delete to authenticated using (auth.uid() = user_id);

-- book_requests
create table public.book_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index book_requests_book_id_idx on public.book_requests(book_id);
create index book_requests_requester_id_idx on public.book_requests(requester_id);

grant select, insert, update on public.book_requests to authenticated;
grant all on public.book_requests to service_role;

alter table public.book_requests enable row level security;

create policy "book_requests_select_involved" on public.book_requests
  for select to authenticated using (
    auth.uid() = requester_id
    or auth.uid() = (select user_id from public.books where id = book_id)
  );

create policy "book_requests_insert_self" on public.book_requests
  for insert to authenticated with check (auth.uid() = requester_id);

create policy "book_requests_update_involved" on public.book_requests
  for update to authenticated using (
    auth.uid() = requester_id
    or auth.uid() = (select user_id from public.books where id = book_id)
  );
