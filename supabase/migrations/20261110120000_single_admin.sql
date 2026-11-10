-- The app has exactly one admin. A second profile with is_admin = true is rejected.
create unique index profiles_single_admin on public.profiles (is_admin) where is_admin;
