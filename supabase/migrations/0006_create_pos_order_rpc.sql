-- Atomic POS sale. Mirrors src/lib/orders.ts::createOrder combined with
-- src/lib/inventory.ts::deductStockForSale: validates everything (stock,
-- cash, discount ID) before writing anything, then writes the order,
-- its line items, and every stock deduction + movement log entry in one
-- transaction. `for update` locks each touched inventory row so two
-- concurrent cashiers can never oversell the same flavor.
--
-- security invoker: the caller's own RLS grants already cover every table
-- this function touches (they must be active staff/admin to call it at
-- all), so no elevated privileges are needed.
create or replace function public.create_pos_order(
  p_items jsonb, -- [{ "product_id": "...", "quantity": 2 }, ...]
  p_payment_method payment_method,
  p_pickup_name text default null,
  p_cash_received integer default null,
  p_ewallet_provider text default null,
  p_customer_type customer_type default 'regular',
  p_discount_id_number text default null
)
returns public.orders
language plpgsql
security invoker
as $$
declare
  v_order public.orders;
  v_line jsonb;
  v_product public.products;
  v_inventory public.inventory;
  v_subtotal integer := 0;
  v_discount_rate numeric(4, 3) := 0;
  v_discount_amount integer := 0;
  v_total integer;
  v_pending_discount boolean;
  v_cash_check_total integer;
  v_actor_name text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty.';
  end if;

  select name into v_actor_name from public.profiles where id = auth.uid();

  -- Pass 1: lock every affected inventory row and validate stock/existence
  -- before writing anything.
  for v_line in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products
      where id = v_line->>'product_id' and deleted_at is null;
    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;

    select * into v_inventory from public.inventory
      where product_id = v_product.id for update;
    if v_inventory.stock < (v_line->>'quantity')::integer then
      raise exception 'Not enough stock for %. Only % left.', v_product.name, v_inventory.stock;
    end if;

    v_subtotal := v_subtotal + v_product.price * (v_line->>'quantity')::integer;
  end loop;

  v_pending_discount := p_customer_type in ('pwd', 'senior');
  if v_pending_discount then
    v_discount_rate := 0.2;
    v_discount_amount := round(v_subtotal * v_discount_rate)::integer;
    if p_discount_id_number is null or btrim(p_discount_id_number) = '' then
      raise exception 'Please enter the customer''s ID number.';
    end if;
  end if;
  v_total := v_subtotal - v_discount_amount;

  -- Cashiers collect cash against the full pre-discount total - the
  -- discount is only confirmed once the ID above checks out.
  v_cash_check_total := case when v_pending_discount then v_subtotal else v_total end;

  if p_payment_method = 'cash'
     and coalesce(p_cash_received, v_cash_check_total) < v_cash_check_total then
    raise exception 'The cash amount entered is less than your order total. Please enter a sufficient amount.';
  end if;

  insert into public.orders (
    total_amount, payment_method, payment_status, order_status, pickup_name,
    cash_received, expected_change, ewallet_provider, customer_type,
    subtotal_before_discount, discount_rate, discount_amount, discount_status,
    discount_id_number, cashier_id
  ) values (
    v_total, p_payment_method, 'verified', 'completed', nullif(btrim(p_pickup_name), ''),
    case when p_payment_method = 'cash' then coalesce(p_cash_received, v_cash_check_total) end,
    case when p_payment_method = 'cash'
      then greatest(0, coalesce(p_cash_received, v_cash_check_total) - v_total) end,
    case when p_payment_method = 'ewallet' then coalesce(p_ewallet_provider, 'GCash') end,
    p_customer_type, v_subtotal, nullif(v_discount_rate, 0), nullif(v_discount_amount, 0),
    case when v_pending_discount then 'verified' else 'none' end,
    p_discount_id_number, auth.uid()
  ) returning * into v_order;

  -- Pass 2: write line items, deduct stock, log one movement per line - the
  -- same single write path applyStockChange() enforced client-side before.
  for v_line in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id = v_line->>'product_id';
    select * into v_inventory from public.inventory where product_id = v_product.id;

    insert into public.order_items (order_id, product_id, name, quantity, unit_price, subtotal)
    values (
      v_order.id, v_product.id, v_product.name, (v_line->>'quantity')::integer,
      v_product.price, v_product.price * (v_line->>'quantity')::integer
    );

    update public.inventory
      set stock = stock - (v_line->>'quantity')::integer, updated_at = now()
      where product_id = v_product.id;

    insert into public.inventory_movements (
      product_id, user_id, user_name, movement_type, quantity,
      previous_stock, new_stock, reason, order_id
    ) values (
      v_product.id, auth.uid(), coalesce(v_actor_name, 'System'), 'sale',
      -(v_line->>'quantity')::integer, v_inventory.stock,
      v_inventory.stock - (v_line->>'quantity')::integer, 'POS Sale', v_order.id
    );
  end loop;

  return v_order;
end;
$$;
