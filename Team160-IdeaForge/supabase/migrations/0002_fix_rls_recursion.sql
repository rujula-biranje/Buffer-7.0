-- Fix: "infinite recursion detected in policy for relation 'profiles'"
-- Cause: admin-check policies used `exists (select 1 from profiles ...)` which
-- re-triggered profiles' own RLS evaluation and looped. We replace that with a
-- SECURITY DEFINER helper that runs with the function-owner's privileges and
-- therefore skips RLS.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

drop policy if exists "profiles admin read" on profiles;
create policy "profiles admin read" on profiles for select using (public.is_admin());

drop policy if exists "items admin write" on items;
create policy "items admin write" on items for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders admin read" on orders;
create policy "orders admin read" on orders for select using (public.is_admin());

drop policy if exists "order_items admin read" on order_items;
create policy "order_items admin read" on order_items for select using (public.is_admin());

drop policy if exists "poll_votes admin read" on poll_votes;
create policy "poll_votes admin read" on poll_votes for select using (public.is_admin());
