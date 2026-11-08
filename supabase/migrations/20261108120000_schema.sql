-- Hafilu schema: profiles, catalog, bookings lifecycle, reviews, notifications.
-- Every state change on a booking goes through a SECURITY DEFINER function that
-- checks the caller, so clients only ever SELECT bookings directly.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ Types

create type public.booking_status as enum ('pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled', 'declined');
create type public.operator_status as enum ('active', 'pending', 'suspended', 'rejected');
create type public.location_type as enum ('home', 'park', 'hall');
create type public.cancellation_policy as enum ('flexible', 'regular', 'strict');

-- --------------------------------------------------------------- Profiles

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  is_admin boolean not null default false,
  prefs jsonb not null default '{"whatsapp": true, "sms": false, "email": true, "reminder": true}',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------- Catalog

create table public.categories (
  id text primary key,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  sort int not null default 0
);

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid references public.profiles on delete set null,
  name text not null,
  category_id text not null references public.categories,
  categories text[] not null default '{}',
  tagline text not null default '',
  about text not null default '',
  rating numeric(2, 1) not null default 0,
  reviews_count int not null default 0,
  age_min int not null default 3,
  age_max int not null default 12,
  regions text[] not null default '{}',
  region_label text not null default '',
  duration_label text not null default '',
  includes text not null default '',
  locations public.location_type[] not null default '{home}',
  sponsored boolean not null default false,
  verified boolean not null default false,
  insured boolean not null default false,
  response_hours int not null default 24,
  extras jsonb not null default '[]',
  facts jsonb not null default '[]',
  prepare text[] not null default '{}',
  sub_ratings jsonb not null default '{"punctuality": 0, "communication": 0, "asPromised": 0, "kidsFun": 0, "ageFit": 0, "value": 0}',
  cancellation public.cancellation_policy not null default 'regular',
  slots text[] not null default '{10:00,16:00}',
  plan text not null default 'basic' check (plan in ('basic', 'pro')),
  status public.operator_status not null default 'pending',
  review_note text,
  insurance_until text not null default '—',
  bookings_count int not null default 0,
  blocked_dates date[] not null default '{}',
  created_at timestamptz not null default now()
);
create unique index operators_one_per_owner on public.operators (owner_id) where owner_id is not null;

-- Business identity, bank and documents: owner and admins only.
create table public.operator_private (
  operator_id uuid primary key references public.operators on delete cascade,
  business jsonb not null default '{}',
  bank jsonb not null default '{}',
  documents jsonb not null default '[]'
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators on delete cascade,
  name text not null,
  duration_min int not null check (duration_min > 0),
  max_kids int check (max_kids is null or max_kids > 0),
  age_min int not null,
  age_max int not null,
  price int not null check (price >= 0),
  includes text not null default '',
  popular boolean not null default false,
  active boolean not null default true,
  extra_kid_price int,
  sort int not null default 0
);
create index packages_operator on public.packages (operator_id);

create function public.owns_operator(p_operator uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.operators where id = p_operator and owner_id = auth.uid())
$$;

-- --------------------------------------------------------------- Bookings

create sequence public.booking_number start 10500;

create table public.bookings (
  id bigint primary key default nextval('public.booking_number'),
  operator_id uuid not null references public.operators,
  package_id uuid not null references public.packages,
  customer_id uuid references public.profiles on delete set null,
  customer_name text not null,
  customer_kind text not null default 'parent' check (customer_kind in ('parent', 'institution')),
  phone text not null,
  email text not null,
  event_type text not null,
  date date not null,
  time text not null check (time ~ '^\d{2}:\d{2}$'),
  city text not null default '',
  address text not null default '',
  distance_km int not null default 0,
  kids int not null check (kids > 0),
  age_range text not null default '',
  location_type public.location_type not null default 'home',
  notes text not null default '',
  extras text[] not null default '{}',
  price int not null,
  travel_fee int not null default 0,
  total int not null,
  status public.booking_status not null default 'pending',
  paid int not null default 0,
  rated boolean not null default false,
  proposal_date date,
  proposal_time text,
  created_at timestamptz not null default now()
);
create index bookings_operator_date on public.bookings (operator_id, date);
create index bookings_customer on public.bookings (customer_id);

-- ------------------------------------------------------ Reviews and more

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators on delete cascade,
  booking_id bigint unique references public.bookings on delete set null,
  author_id uuid references public.profiles on delete set null,
  author text not null,
  context text not null default '',
  when_label text not null default '',
  score int not null check (score between 1 and 5),
  scores jsonb not null default '{}',
  text text not null default '',
  recommend boolean,
  reply text,
  verified boolean not null default true,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_operator on public.reviews (operator_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  audience text not null check (audience in ('customer', 'operator')),
  text text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications (user_id, created_at desc);

create table public.saved_operators (
  user_id uuid not null references public.profiles on delete cascade,
  operator_id uuid not null references public.operators on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, operator_id)
);

create table public.institution_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete set null,
  org_type text not null,
  org text not null,
  contact text not null,
  phone text not null,
  email text not null,
  event_date date,
  participants int,
  categories text[] not null default '{}',
  budget text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  commission numeric(4, 3) not null default 0.10,
  deposit numeric(4, 3) not null default 0.30,
  reply_hours int not null default 24,
  pay_hours int not null default 48,
  payout_day int not null default 10,
  pro_price int not null default 99,
  block_overlaps boolean not null default true
);
insert into public.settings (id) values (1);

-- ---------------------------------------------------------- Row security

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.operators enable row level security;
alter table public.operator_private enable row level security;
alter table public.packages enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_operators enable row level security;
alter table public.institution_leads enable row level security;
alter table public.settings enable row level security;

-- profiles: you read and edit yourself; admins read everyone. is_admin is not writable.
create policy "profiles: own or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, prefs) on public.profiles to authenticated;

create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin write" on public.categories for update using (public.is_admin());

-- operators: active ones are public; owners see their own; admins see all.
create policy "operators: read" on public.operators for select
  using (status = 'active' or owner_id = auth.uid() or public.is_admin());
create policy "operators: owner update" on public.operators for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
revoke update on public.operators from authenticated, anon;
grant update (name, tagline, about, categories, regions, region_label, cancellation, blocked_dates, slots, locations, age_min, age_max, includes, extras, facts, prepare)
  on public.operators to authenticated;

create policy "operator_private: owner or admin" on public.operator_private for select
  using (public.owns_operator(operator_id) or public.is_admin());
create policy "operator_private: owner update" on public.operator_private for update
  using (public.owns_operator(operator_id));

create policy "packages: read" on public.packages for select using (
  exists (select 1 from public.operators o where o.id = operator_id and (o.status = 'active' or o.owner_id = auth.uid()))
  or public.is_admin()
);
create policy "packages: owner insert" on public.packages for insert with check (public.owns_operator(operator_id));
create policy "packages: owner update" on public.packages for update using (public.owns_operator(operator_id));
create policy "packages: owner delete" on public.packages for delete using (public.owns_operator(operator_id));

-- bookings: customer, the operator's owner, or admin may read. Writes go through functions.
create policy "bookings: read" on public.bookings for select
  using (customer_id = auth.uid() or public.owns_operator(operator_id) or public.is_admin());

create policy "reviews: public read" on public.reviews for select using (not hidden or public.is_admin() or public.owns_operator(operator_id));
create policy "reviews: admin moderate" on public.reviews for update using (public.is_admin());

create policy "notifications: own read" on public.notifications for select using (user_id = auth.uid());
create policy "notifications: own mark read" on public.notifications for update using (user_id = auth.uid());
revoke update on public.notifications from authenticated, anon;
grant update (read) on public.notifications to authenticated;

create policy "saved: own" on public.saved_operators for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "leads: anyone can submit" on public.institution_leads for insert with check (user_id is null or user_id = auth.uid());
create policy "leads: admin read" on public.institution_leads for select using (public.is_admin());

create policy "settings: public read" on public.settings for select using (true);
create policy "settings: admin write" on public.settings for update using (public.is_admin());

-- --------------------------------------------------------------- Helpers

create function public.notify(p_user uuid, p_audience text, p_text text, p_href text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, audience, text, href)
  select p_user, p_audience, p_text, p_href where p_user is not null
$$;
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;

create function public.short_date(d date) returns text
language sql immutable as $$ select extract(day from d)::int || '.' || extract(month from d)::int $$;

/** Hebrew prefix letter + name, with a maqaf before Latin text: ל־Water Battle */
create function public.pre(p text, n text) returns text
language sql immutable as $$ select p || case when n ~ '^[A-Za-z0-9]' then '־' else '' end || n $$;

create function public.minutes(t text) returns int
language sql immutable as $$ select split_part(t, ':', 1)::int * 60 + split_part(t, ':', 2)::int $$;

/** An approved or awaiting booking of the same operator that overlaps the window (+60 min travel). */
create function public.find_clash(p_operator uuid, p_date date, p_time text, p_duration int, p_exclude bigint)
returns bigint language sql stable security definer set search_path = '' as $$
  select b.id from public.bookings b
  join public.packages p on p.id = b.package_id
  where b.operator_id = p_operator and b.date = p_date and b.id <> coalesce(p_exclude, -1)
    and b.status in ('awaiting_payment', 'confirmed')
    and public.minutes(b.time) < public.minutes(p_time) + p_duration + 60
    and public.minutes(p_time) < public.minutes(b.time) + p.duration_min + 60
  limit 1
$$;

/** Busy windows for the public booking widget: times only, no customer data. */
create function public.busy_slots(p_operator uuid, p_date date)
returns table (time text, duration_min int) language sql stable security definer set search_path = '' as $$
  select b.time, p.duration_min from public.bookings b
  join public.packages p on p.id = b.package_id
  where b.operator_id = p_operator and b.date = p_date and b.status in ('awaiting_payment', 'confirmed')
$$;
grant execute on function public.busy_slots(uuid, date) to anon, authenticated;

-- --------------------------------------------------------- Booking flow

create function public.request_booking(
  p_operator uuid, p_package uuid, p_date date, p_time text, p_kids int, p_extras text[],
  p_event_type text, p_address text, p_city text, p_age_range text, p_location public.location_type,
  p_notes text, p_kind text, p_name text, p_phone text, p_email text
) returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_op public.operators;
  v_pkg public.packages;
  v_extra_kids int := 0;
  v_extras_cost int := 0;
  v_price int;
  v_id bigint;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into v_op from public.operators where id = p_operator and status = 'active';
  if not found then raise exception 'operator_unavailable'; end if;
  select * into v_pkg from public.packages where id = p_package and operator_id = p_operator and active;
  if not found then raise exception 'package_unavailable'; end if;
  if p_date < current_date then raise exception 'date_in_past'; end if;
  if p_date = any (v_op.blocked_dates) then raise exception 'date_blocked'; end if;
  if p_time <> all (v_op.slots) then raise exception 'slot_unavailable'; end if;
  if p_kids < 1 or p_kids > 500 then raise exception 'invalid_kids'; end if;

  if v_pkg.max_kids is not null and p_kids > v_pkg.max_kids then
    v_extra_kids := p_kids - v_pkg.max_kids;
  end if;
  select coalesce(sum((e ->> 'price')::int), 0) into v_extras_cost
    from jsonb_array_elements(v_op.extras) e where e ->> 'id' = any (coalesce(p_extras, '{}'));
  v_price := v_pkg.price + v_extra_kids * coalesce(v_pkg.extra_kid_price, 0);

  insert into public.bookings (operator_id, package_id, customer_id, customer_name, customer_kind, phone, email,
    event_type, date, time, city, address, kids, age_range, location_type, notes, extras, price, total)
  values (p_operator, p_package, auth.uid(), p_name, p_kind, p_phone, p_email,
    p_event_type, p_date, p_time, p_city, p_address, p_kids, p_age_range, p_location, coalesce(p_notes, ''),
    coalesce(p_extras, '{}'), v_price, v_price + v_extras_cost)
  returning id into v_id;

  update public.profiles set phone = coalesce(phone, p_phone) where id = auth.uid();

  perform public.notify(v_op.owner_id, 'operator', 'בקשה חדשה ' || public.pre('מ', p_name) || ' ל־' || public.short_date(p_date), '/operator/requests?id=' || v_id);
  perform public.notify(auth.uid(), 'customer', 'הבקשה נשלחה ' || public.pre('ל', v_op.name) || '. תשובה תוך 24 שעות.', '/bookings');
  return v_id;
end $$;

create function public.approve_booking(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_dur int; v_clash bigint; v_name text;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or not public.owns_operator(v_b.operator_id) then raise exception 'forbidden'; end if;
  if v_b.status <> 'pending' then raise exception 'invalid_status'; end if;
  select duration_min into v_dur from public.packages where id = v_b.package_id;
  if (select block_overlaps from public.settings where id = 1) then
    v_clash := public.find_clash(v_b.operator_id, v_b.date, v_b.time, v_dur, v_b.id);
    if v_clash is not null then raise exception 'clash:%', v_clash; end if;
  end if;
  update public.bookings set status = 'awaiting_payment', proposal_date = null, proposal_time = null where id = p_id;
  select name into v_name from public.operators where id = v_b.operator_id;
  perform public.notify(v_b.customer_id, 'customer', v_name || ' אישר את הבקשה ל־' || public.short_date(v_b.date), '/pay/' || p_id);
end $$;

create function public.decline_booking(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_name text;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or not public.owns_operator(v_b.operator_id) then raise exception 'forbidden'; end if;
  if v_b.status <> 'pending' then raise exception 'invalid_status'; end if;
  update public.bookings set status = 'declined' where id = p_id;
  select name into v_name from public.operators where id = v_b.operator_id;
  perform public.notify(v_b.customer_id, 'customer', v_name || ' לא פנויים במועד. יש עוד מפעילים פנויים.', '/search');
end $$;

create function public.propose_booking(p_id bigint, p_date date, p_time text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_name text;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or not public.owns_operator(v_b.operator_id) then raise exception 'forbidden'; end if;
  if v_b.status <> 'pending' then raise exception 'invalid_status'; end if;
  if p_date < current_date or p_time !~ '^\d{2}:\d{2}$' then raise exception 'invalid_proposal'; end if;
  update public.bookings set proposal_date = p_date, proposal_time = p_time where id = p_id;
  select name into v_name from public.operators where id = v_b.operator_id;
  perform public.notify(v_b.customer_id, 'customer', v_name || ' הציע מועד חלופי: ' || public.short_date(p_date) || ' ב־' || p_time, '/bookings');
end $$;

create function public.accept_proposal(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_dur int; v_owner uuid;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or v_b.customer_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_b.status <> 'pending' or v_b.proposal_date is null then raise exception 'invalid_status'; end if;
  select duration_min into v_dur from public.packages where id = v_b.package_id;
  if public.find_clash(v_b.operator_id, v_b.proposal_date, v_b.proposal_time, v_dur, v_b.id) is not null then
    raise exception 'clash';
  end if;
  update public.bookings set date = proposal_date, time = proposal_time, proposal_date = null, proposal_time = null,
    status = 'awaiting_payment' where id = p_id;
  select owner_id into v_owner from public.operators where id = v_b.operator_id;
  perform public.notify(v_owner, 'operator', v_b.customer_name || ' אישר/ה את המועד החלופי', '/operator/requests?id=' || p_id);
end $$;

create function public.cancel_booking(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_owner uuid;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or v_b.customer_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_b.status not in ('pending', 'awaiting_payment') then raise exception 'invalid_status'; end if;
  update public.bookings set status = 'cancelled' where id = p_id;
  select owner_id into v_owner from public.operators where id = v_b.operator_id;
  perform public.notify(v_owner, 'operator', v_b.customer_name || ' ביטל/ה את הבקשה #' || p_id, '/operator/requests');
end $$;

-- Demo payment: marks the deposit (or full amount) as paid. A payment provider webhook replaces this.
create function public.pay_booking(p_id bigint, p_full boolean) returns int
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_amount int; v_owner uuid; v_name text;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or v_b.customer_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_b.status <> 'awaiting_payment' then raise exception 'invalid_status'; end if;
  v_amount := case when p_full then v_b.total else round(v_b.total * (select deposit from public.settings where id = 1))::int end;
  update public.bookings set status = 'confirmed', paid = v_amount where id = p_id;
  select owner_id, name into v_owner, v_name from public.operators where id = v_b.operator_id;
  perform public.notify(v_owner, 'operator', v_b.customer_name || ' שילמ/ה מקדמה להזמנה #' || p_id, '/operator');
  perform public.notify(auth.uid(), 'customer', 'התשלום התקבל. ' || v_name || ' שמורים לכם ל־' || public.short_date(v_b.date), '/bookings');
  return v_amount;
end $$;

create function public.complete_booking(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_b public.bookings; v_name text;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or not public.owns_operator(v_b.operator_id) then raise exception 'forbidden'; end if;
  if v_b.status <> 'confirmed' then raise exception 'invalid_status'; end if;
  update public.bookings set status = 'completed', paid = total where id = p_id;
  update public.operators set bookings_count = bookings_count + 1 where id = v_b.operator_id returning name into v_name;
  perform public.notify(v_b.customer_id, 'customer', 'איך היה עם ' || v_name || '? נשמח לדירוג שלכם', '/rate/' || p_id);
end $$;

create function public.rate_booking(p_id bigint, p_scores jsonb, p_text text, p_recommend boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_b public.bookings; v_op public.operators; v_profile public.profiles;
  v_score int; v_author text; v_n int; v_sub jsonb; k text;
begin
  select * into v_b from public.bookings where id = p_id for update;
  if not found or v_b.customer_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_b.status <> 'completed' or v_b.rated then raise exception 'invalid_status'; end if;
  foreach k in array array['punctuality', 'communication', 'asPromised', 'kidsFun', 'ageFit', 'value'] loop
    if coalesce((p_scores ->> k)::int, 0) not between 1 and 5 then raise exception 'invalid_scores'; end if;
  end loop;

  v_score := round((select avg(value::int) from jsonb_each_text(p_scores)))::int;
  select * into v_profile from public.profiles where id = auth.uid();
  v_author := split_part(v_profile.full_name, ' ', 1)
    || case when split_part(v_profile.full_name, ' ', 2) <> '' then ' ' || left(split_part(v_profile.full_name, ' ', 2), 1) || '.' else '' end;

  insert into public.reviews (operator_id, booking_id, author_id, author, context, when_label, score, scores, text, recommend)
  values (v_b.operator_id, p_id, auth.uid(), coalesce(nullif(v_author, ''), 'לקוח/ה'), v_b.event_type,
    to_char(now(), 'MM/YYYY'), v_score, p_scores, coalesce(p_text, ''), p_recommend);
  update public.bookings set rated = true where id = p_id;

  -- Running averages, so seeded review counts stay meaningful.
  select * into v_op from public.operators where id = v_b.operator_id for update;
  v_n := v_op.reviews_count;
  v_sub := v_op.sub_ratings;
  foreach k in array array['punctuality', 'communication', 'asPromised', 'kidsFun', 'ageFit', 'value'] loop
    v_sub := jsonb_set(v_sub, array[k], to_jsonb(round(((coalesce((v_sub ->> k)::numeric, 0) * v_n) + (p_scores ->> k)::int) / (v_n + 1), 1)));
  end loop;
  update public.operators set
    rating = round(((rating * v_n) + v_score) / (v_n + 1), 1),
    reviews_count = v_n + 1,
    sub_ratings = v_sub
  where id = v_op.id;
  perform public.notify(v_op.owner_id, 'operator', 'ביקורת חדשה: ' || v_score || ' / 5', '/operator/reviews');
end $$;

create function public.reply_review(p_review uuid, p_text text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_r public.reviews;
begin
  select * into v_r from public.reviews where id = p_review for update;
  if not found or not public.owns_operator(v_r.operator_id) then raise exception 'forbidden'; end if;
  if v_r.reply is not null then raise exception 'already_replied'; end if;
  if length(trim(p_text)) = 0 then raise exception 'empty'; end if;
  update public.reviews set reply = trim(p_text) where id = p_review;
end $$;

-- ------------------------------------------------------ Operator onboarding

create function public.create_operator(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_slug text; v_pkg jsonb; v_i int := 0;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.operators where owner_id = auth.uid()) then raise exception 'already_operator'; end if;

  v_slug := trim(both '-' from regexp_replace(lower(coalesce(p ->> 'name', '')), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' or exists (select 1 from public.operators where slug = v_slug) then
    v_slug := coalesce(nullif(v_slug, ''), 'op') || '-' || substr(md5(random()::text), 1, 6);
  end if;

  insert into public.operators (slug, owner_id, name, category_id, categories, about, tagline, regions, region_label,
    age_min, age_max, locations, status)
  values (
    v_slug, auth.uid(), p ->> 'name', p -> 'categories' ->> 0,
    array(select jsonb_array_elements_text(p -> 'categories')),
    coalesce(p ->> 'about', ''), left(coalesce(p ->> 'about', ''), 60),
    array(select jsonb_array_elements_text(p -> 'regions')),
    array_to_string(array(select jsonb_array_elements_text(p -> 'regions')), ', '),
    coalesce((p ->> 'ageMin')::int, 3), coalesce((p ->> 'ageMax')::int, 12),
    array(select jsonb_array_elements_text(p -> 'locations'))::public.location_type[],
    'pending'
  ) returning id into v_id;

  insert into public.operator_private (operator_id, business, bank, documents)
  values (v_id, coalesce(p -> 'business', '{}'), coalesce(p -> 'bank', '{}'), coalesce(p -> 'documents', '[]'));

  for v_pkg in select * from jsonb_array_elements(p -> 'packages') loop
    insert into public.packages (operator_id, name, duration_min, max_kids, age_min, age_max, price, includes, popular, sort)
    values (v_id, v_pkg ->> 'name', (v_pkg ->> 'duration')::int, nullif(v_pkg ->> 'maxKids', '')::int,
      coalesce((p ->> 'ageMin')::int, 3), coalesce((p ->> 'ageMax')::int, 12), (v_pkg ->> 'price')::int,
      coalesce(v_pkg ->> 'includes', ''), v_i = 0, v_i);
    v_i := v_i + 1;
  end loop;

  return v_slug;
end $$;

-- ------------------------------------------------------------------ Admin

create function public.admin_set_operator_status(p_operator uuid, p_status public.operator_status, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_name text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.operators set status = p_status, review_note = p_note,
    verified = case when p_status = 'active' then true else verified end
  where id = p_operator returning owner_id, name into v_owner, v_name;
  perform public.notify(v_owner, 'operator',
    case p_status
      when 'active' then 'הפרופיל של ' || v_name || ' אושר ועלה לאתר'
      when 'rejected' then 'הפרופיל לא אושר. פרטים באזור המפעילים'
      else coalesce(p_note, 'עדכון לגבי הפרופיל שלכם')
    end, '/operator');
end $$;

-- Functions are callable by signed-in users only, except the read-only busy_slots.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.busy_slots(uuid, date) to anon, authenticated;
grant execute on function
  public.request_booking(uuid, uuid, date, text, int, text[], text, text, text, text, public.location_type, text, text, text, text, text),
  public.approve_booking(bigint), public.decline_booking(bigint), public.propose_booking(bigint, date, text),
  public.accept_proposal(bigint), public.cancel_booking(bigint), public.pay_booking(bigint, boolean),
  public.complete_booking(bigint), public.rate_booking(bigint, jsonb, text, boolean), public.reply_review(uuid, text),
  public.create_operator(jsonb), public.admin_set_operator_status(uuid, public.operator_status, text),
  public.is_admin(), public.owns_operator(uuid)
to authenticated;
grant execute on function public.is_admin(), public.owns_operator(uuid), public.short_date(date), public.minutes(text), public.pre(text, text) to anon, authenticated;
