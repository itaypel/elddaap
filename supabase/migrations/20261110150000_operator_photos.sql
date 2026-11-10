-- Operator photos (logo + activity gallery) and verification documents in Storage.
--
-- Photos live in the public bucket `operator-photos` and documents in the private
-- bucket `operator-docs`. Either way a user may only write under a folder named by
-- their auth uid: <uid>/<file>. The operators table stores object paths
-- (e.g. "<uid>/gallery-abc.webp"); the app turns them into public URLs.

-- ------------------------------------------------------------------ Columns

alter table public.operators
  add column logo_url text,
  add column photos text[] not null default '{}' check (cardinality(photos) <= 12);

-- Owners may change their own logo and gallery (row access is already limited by
-- the "operators: owner update" policy).
grant update (logo_url, photos) on public.operators to authenticated;

-- ------------------------------------------------------------------ Buckets

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('operator-photos', 'operator-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('operator-docs', 'operator-docs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- operator-photos: anyone can read, signed-in users write only inside their own folder.
create policy "operator-photos: public read" on storage.objects for select
  using (bucket_id = 'operator-photos');
create policy "operator-photos: own folder insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'operator-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "operator-photos: own folder update" on storage.objects for update to authenticated
  using (bucket_id = 'operator-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'operator-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "operator-photos: own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'operator-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- operator-docs: private. The owner writes and reads their own folder; the admin reads all.
create policy "operator-docs: own folder insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'operator-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "operator-docs: owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'operator-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "operator-docs: own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'operator-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------- Onboarding with photos

-- Same as before, plus: logo, gallery (only paths inside the caller's own folder are
-- kept), business email/phone folded into operator_private.business, and the owner's
-- profile phone filled in when it is still empty.
create or replace function public.create_operator(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid; v_slug text; v_pkg jsonb; v_i int := 0;
  v_prefix text := auth.uid()::text || '/';
  v_logo text; v_photos text[];
  v_email text := nullif(trim(coalesce(p ->> 'email', p -> 'business' ->> 'email', '')), '');
  v_phone text := nullif(trim(coalesce(p ->> 'phone', p -> 'business' ->> 'phone', '')), '');
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.operators where owner_id = auth.uid()) then raise exception 'already_operator'; end if;

  v_logo := nullif(p ->> 'logo', '');
  if v_logo is not null and left(v_logo, length(v_prefix)) <> v_prefix then v_logo := null; end if;
  v_photos := array(
    select x from jsonb_array_elements_text(coalesce(p -> 'photos', '[]')) with ordinality as t(x, n)
    where left(x, length(v_prefix)) = v_prefix
    order by n limit 12
  );

  v_slug := trim(both '-' from regexp_replace(lower(coalesce(p ->> 'name', '')), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' or exists (select 1 from public.operators where slug = v_slug) then
    v_slug := coalesce(nullif(v_slug, ''), 'op') || '-' || substr(md5(random()::text), 1, 6);
  end if;

  insert into public.operators (slug, owner_id, name, category_id, categories, about, tagline, regions, region_label,
    age_min, age_max, locations, logo_url, photos, status)
  values (
    v_slug, auth.uid(), p ->> 'name', p -> 'categories' ->> 0,
    array(select jsonb_array_elements_text(p -> 'categories')),
    coalesce(p ->> 'about', ''), left(coalesce(p ->> 'about', ''), 60),
    array(select jsonb_array_elements_text(p -> 'regions')),
    array_to_string(array(select jsonb_array_elements_text(p -> 'regions')), ', '),
    coalesce((p ->> 'ageMin')::int, 3), coalesce((p ->> 'ageMax')::int, 12),
    array(select jsonb_array_elements_text(p -> 'locations'))::public.location_type[],
    v_logo, v_photos,
    'pending'
  ) returning id into v_id;

  insert into public.operator_private (operator_id, business, bank, documents)
  values (
    v_id,
    coalesce(p -> 'business', '{}') || jsonb_strip_nulls(jsonb_build_object('email', v_email, 'phone', v_phone)),
    coalesce(p -> 'bank', '{}'),
    coalesce(p -> 'documents', '[]')
  );

  update public.profiles set phone = v_phone
  where id = auth.uid() and v_phone is not null and coalesce(phone, '') = '';

  for v_pkg in select * from jsonb_array_elements(p -> 'packages') loop
    insert into public.packages (operator_id, name, duration_min, max_kids, age_min, age_max, price, includes, popular, sort)
    values (v_id, v_pkg ->> 'name', (v_pkg ->> 'duration')::int, nullif(v_pkg ->> 'maxKids', '')::int,
      coalesce((p ->> 'ageMin')::int, 3), coalesce((p ->> 'ageMax')::int, 12), (v_pkg ->> 'price')::int,
      coalesce(v_pkg ->> 'includes', ''), v_i = 0, v_i);
    v_i := v_i + 1;
  end loop;

  return v_slug;
end $$;

revoke execute on function public.create_operator(jsonb) from public, anon;
grant execute on function public.create_operator(jsonb) to authenticated;
