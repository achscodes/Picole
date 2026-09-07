-- inventory: exactly one row per product.
create table public.inventory (
  product_id text primary key references public.products(id) on delete cascade,
  stock integer not null default 50 check (stock >= 0),
  alert_at integer not null default 10 check (alert_at >= 0),
  updated_at timestamptz not null default now()
);

-- Auto-seed a 50/10 inventory row for every new product, matching the
-- defaultInventory() behavior the app relies on today for staff-created
-- custom flavors.
create or replace function public.handle_new_product()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.inventory (product_id, stock, alert_at)
  values (new.id, 50, 10)
  on conflict (product_id) do nothing;
  return new;
end;
$$;

create trigger on_product_created
  after insert on public.products
  for each row execute function public.handle_new_product();

-- inventory_movements: append-only audit ledger. `order_id`'s FK to
-- public.orders is added in 0005, after that table exists.
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  movement_type inventory_movement_type not null,
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text not null default 'No reason provided',
  order_id uuid,
  created_at timestamptz not null default now()
);

create index idx_movements_product_created on public.inventory_movements(product_id, created_at desc);
