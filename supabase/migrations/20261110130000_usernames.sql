-- Sign-in by username. Auth still needs an email, so accounts created with a
-- username get an internal address (<username>@users.elddaap.app) that is never mailed.

alter table public.profiles add column username text unique
  check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');

grant update (username) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case when new.email like '%@users.elddaap.app' then null else new.email end,
    new.raw_user_meta_data ->> 'avatar_url',
    lower(nullif(new.raw_user_meta_data ->> 'username', ''))
  );
  return new;
end $$;

/** The sign-in address behind a username, so the login form can accept either. */
create function public.login_email(p_username text) returns text
language sql stable security definer set search_path = '' as $$
  select u.email from auth.users u join public.profiles p on p.id = u.id
  where p.username = lower(trim(p_username))
$$;
revoke execute on function public.login_email(text) from public;
grant execute on function public.login_email(text) to anon, authenticated;
