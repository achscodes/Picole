-- categories: fixed reference data, seeded once - read-only from the app.
alter table public.categories enable row level security;
create policy "categories_select" on public.categories
  for select using (public.is_active_staff());

-- products: both roles manage the menu (staff-management screens live under
-- both /admin and /staff). No delete policy: deleteProduct is an UPDATE of
-- deleted_at, not a real DELETE.
alter table public.products enable row level security;
create policy "products_select" on public.products
  for select using (public.is_active_staff());
create policy "products_insert" on public.products
  for insert with check (public.is_active_staff());
create policy "products_update" on public.products
  for update using (public.is_active_staff()) with check (public.is_active_staff());

-- inventory: both roles can read and adjust stock. No insert/delete
-- policies - rows are created only by the on_product_created trigger.
alter table public.inventory enable row level security;
create policy "inventory_select" on public.inventory
  for select using (public.is_active_staff());
create policy "inventory_update" on public.inventory
  for update using (public.is_active_staff()) with check (public.is_active_staff());

-- inventory_movements: append-only audit ledger - select/insert only, for
-- everyone active. No update/delete policy for anyone, including admin.
alter table public.inventory_movements enable row level security;
create policy "movements_select" on public.inventory_movements
  for select using (public.is_active_staff());
create policy "movements_insert" on public.inventory_movements
  for insert with check (public.is_active_staff());

-- orders: both roles ring up sales; only admin edits order/discount status
-- after the fact.
alter table public.orders enable row level security;
create policy "orders_select" on public.orders
  for select using (public.is_active_staff());
create policy "orders_insert" on public.orders
  for insert with check (public.is_active_staff());
create policy "orders_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items: no update/delete - line items are immutable once written.
alter table public.order_items enable row level security;
create policy "order_items_select" on public.order_items
  for select using (public.is_active_staff());
create policy "order_items_insert" on public.order_items
  for insert with check (public.is_active_staff());
