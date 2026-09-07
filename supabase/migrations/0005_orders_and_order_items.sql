-- Sequence-backed order numbers (PCL-####) - removes the race condition in
-- the old client-side "scan all orders, take max+1" logic. Starts at 1001 to
-- match the first order number the app has always produced.
create sequence public.order_number_seq start with 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('PCL-' || nextval('public.order_number_seq')::text),
  total_amount integer not null check (total_amount >= 0),
  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  order_status order_status not null default 'pending',
  pickup_name text,
  cash_received integer,
  expected_change integer,
  ewallet_provider text,
  customer_type customer_type not null default 'regular',
  subtotal_before_discount integer,
  discount_rate numeric(4, 3),
  discount_amount integer,
  discount_status discount_status not null default 'none',
  discount_id_number text,
  cashier_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_created_at on public.orders(created_at desc);

-- order_items snapshot name/unit_price at time of sale so order history
-- stays correct even if a product is later edited or soft-deleted.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  subtotal integer not null check (subtotal >= 0)
);

create index idx_order_items_order_id on public.order_items(order_id);

alter table public.inventory_movements
  add constraint inventory_movements_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;
