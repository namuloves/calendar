-- Single-user app with no login: anyone using the app reads/writes as the owner.
alter table public.entries alter column user_id set default '1c8232ad-e958-4ee5-b0f3-967bf1b87791'::uuid;
alter table public.photos alter column user_id set default '1c8232ad-e958-4ee5-b0f3-967bf1b87791'::uuid;
drop policy if exists "entries owner" on public.entries;
drop policy if exists "photos owner" on public.photos;
create policy "entries open" on public.entries for all to anon, authenticated using (true) with check (true);
create policy "photos open" on public.photos for all to anon, authenticated using (true) with check (true);
drop policy if exists "photos bucket read" on storage.objects;
drop policy if exists "photos bucket insert" on storage.objects;
drop policy if exists "photos bucket delete" on storage.objects;
create policy "photos bucket read" on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
create policy "photos bucket insert" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "photos bucket delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'photos');
