-- Signup collects real contact details. Username accounts sign in with an internal
-- address (<username>@users.elddaap.app), so the contact email and mobile arrive in
-- raw_user_meta_data (keys: full_name, username, email, phone) and land on the profile.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case
      when new.email is not null and new.email not like '%@users.elddaap.app' then new.email
      else nullif(lower(trim(new.raw_user_meta_data ->> 'email')), '')
    end,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    new.raw_user_meta_data ->> 'avatar_url',
    lower(nullif(new.raw_user_meta_data ->> 'username', ''))
  );
  return new;
end $$;
