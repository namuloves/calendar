-- Private calendar: one row per day, many photos per day. Everything is owner-only.
create table public.entries (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  emoji text,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  path text not null,
  created_at timestamptz not null default now()
);
create index photos_user_day on public.photos (user_id, day);

alter table public.entries enable row level security;
alter table public.photos enable row level security;

create policy "entries owner" on public.entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "photos owner" on public.photos for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Private bucket; files live under "<user id>/..."
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "photos bucket read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos bucket insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos bucket delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
