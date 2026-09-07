-- categories: fixed reference data (the 6 real flavor lines). The "all" and
-- "best-sellers" ids from src/data/catalog.ts are UI-only pseudo-filters and
-- are never rows here.
create table public.categories (
  id text primary key,
  name text not null,
  image text,
  accent text not null,
  benefits text[] not null default '{}',
  sort_order integer not null default 0
);

-- products: one canonical row per flavor. Real deletes are avoided (see
-- deleted_at) so inventory_movements history is never orphaned.
create table public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  category_id text not null references public.categories(id),
  image text not null default '',
  available boolean not null default true,
  best_seller boolean not null default false,
  is_new boolean not null default false,
  calories_note text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category on public.products(category_id) where deleted_at is null;
