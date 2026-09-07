import "server-only";

import type {
  CustomerType,
  DiscountStatus,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "@/types";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderItemRow = {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid" | "verified";
  order_status: OrderStatus;
  pickup_name: string | null;
  cash_received: number | null;
  expected_change: number | null;
  ewallet_provider: string | null;
  customer_type: CustomerType;
  subtotal_before_discount: number | null;
  discount_rate: number | null;
  discount_amount: number | null;
  discount_status: DiscountStatus;
  discount_id_number: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemRow[];
};

const ORDER_COLUMNS = `
  id, order_number, total_amount, payment_method, payment_status, order_status,
  pickup_name, cash_received, expected_change, ewallet_provider, customer_type,
  subtotal_before_discount, discount_rate, discount_amount, discount_status,
  discount_id_number, created_at, updated_at,
  order_items ( product_id, name, quantity, unit_price, subtotal )
`;

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    items: (row.order_items ?? []).map(
      (item): OrderItem => ({
        productId: item.product_id ?? "",
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      }),
    ),
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    pickupName: row.pickup_name ?? undefined,
    cashReceived: row.cash_received ?? undefined,
    expectedChange: row.expected_change ?? undefined,
    ewalletProvider: row.ewallet_provider ?? undefined,
    customerType: row.customer_type,
    subtotalBeforeDiscount: row.subtotal_before_discount ?? undefined,
    discountRate: row.discount_rate ?? undefined,
    discountAmount: row.discount_amount ?? undefined,
    discountStatus: row.discount_status,
    discountIdNumber: row.discount_id_number ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOrderRow(row as unknown as OrderRow));
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const supabase = await createClient();
  const query = supabase.from("orders").select(ORDER_COLUMNS);
  const { data, error } = await (UUID_RE.test(id)
    ? query.or(`id.eq.${id},order_number.eq.${id}`)
    : query.eq("order_number", id)
  ).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapOrderRow(data as unknown as OrderRow) : undefined;
}
