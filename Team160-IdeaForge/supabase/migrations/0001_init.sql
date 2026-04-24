-- College Canteen schema
-- Enable required extensions (gen_random_uuid lives in pgcrypto on older PGs)
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user','vip','admin')),
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  prep_time_minutes integer not null default 10 check (prep_time_minutes > 0),
  is_available boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','preparing','ready','delivered','cancelled')),
  total_price numeric(10,2) not null default 0,
  placed_at timestamptz not null default now(),
  cancellation_deadline timestamptz
    generated always as (placed_at + interval '1 minute') stored,
  ready_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  estimated_ready_at timestamptz,
  is_vip boolean not null default false
);

create index if not exists orders_active_queue_idx
  on orders (placed_at)
  where status in ('pending','preparing');

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_id uuid not null references items(id),
  quantity integer not null check (quantity > 0),
  price_at_order numeric(10,2) not null
);

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  item_id uuid references items(id),
  created_by uuid not null references profiles(id),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

-- Admin check via SECURITY DEFINER so policies don't recurse through profiles.
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

-- profiles: everyone reads their own row; admins read all
create policy "profiles self read"
  on profiles for select using (auth.uid() = id);
create policy "profiles admin read"
  on profiles for select using (public.is_admin());

-- items: anyone authenticated reads; only admin writes
create policy "items read" on items for select using (auth.role() = 'authenticated');
create policy "items admin write" on items for all
  using (public.is_admin()) with check (public.is_admin());

-- orders: users see their own, admins see all
create policy "orders self read" on orders for select using (user_id = auth.uid());
create policy "orders admin read" on orders for select using (public.is_admin());

-- order_items follow their order
create policy "order_items self read" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items admin read" on order_items for select using (public.is_admin());

-- polls readable by any authenticated user
create policy "polls read" on polls for select using (auth.role() = 'authenticated');
create policy "poll_options read" on poll_options for select using (auth.role() = 'authenticated');
create policy "poll_votes self read" on poll_votes for select using (user_id = auth.uid());
create policy "poll_votes admin read" on poll_votes for select using (public.is_admin());

-- NOTE: writes from the backend use the service_role key which bypasses RLS.

-- Seed a few items (idempotent — guarded by NOT EXISTS on name since items.name has no UNIQUE)
insert into items (name, description, price, quantity, prep_time_minutes, image_url)
select * from (values
  ('Veg Sandwich', 'Grilled cheese & veggies',                       40.00, 20, 5,  '/images/veg-sandwich.jpg'),
  ('Masala Dosa',  'Crispy dosa with potato filling',                60.00, 15, 8,  '/images/masala-dosa.jpg'),
  ('Samosa',       'Spicy potato samosa',                            15.00, 40, 3,  '/images/samosa.jpg'),
  ('Cold Coffee',  'Chilled frothy coffee',                          50.00, 25, 4,  '/images/cold-coffee.jpg'),
  ('Paneer Roll',  'Paneer tikka wrapped in paratha',                80.00, 10, 7,  'https://loremflickr.com/600/400/paneer,wrap'),
  ('Vada Pav',     'Spicy potato vada in a soft pav with chutneys',  30.00, 25, 4,  '/images/vada-pav.jpg'),
  ('Pizza',        'Cheese pizza with tangy tomato sauce',          120.00, 12, 12, '/images/pizza.jpg')
) as seed(name, description, price, quantity, prep_time_minutes, image_url)
where not exists (select 1 from items i where i.name = seed.name);
