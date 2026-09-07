"use server";

import { getCurrentSession } from "@/lib/auth";
import { calcDiscount, calcExpectedChange } from "@/lib/orders";
import { getOrderById, listOrders } from "@/lib/orders-data";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, CustomerType, Order, OrderStatus, PaymentMethod } from "@/types";

/** "use server" passthrough so client components can poll for fresh orders
 * (setInterval) without a full page navigation/refresh. */
export async function getOrders(): Promise<Order[]> {
  return listOrders();
}

export interface CreateOrderInput {
  cart: CartItem[];
  paymentMethod: PaymentMethod;
  pickupName?: string;
  cashReceived?: number;
  ewalletProvider?: string;
  customerType?: CustomerType;
  discountIdNumber?: string;
}

async function requireStaff() {
  const session = await getCurrentSession();
  if (!session) throw new Error("You must be signed in to record a sale.");
  return session;
}

/**
 * Thin wrapper around the `create_pos_order` RPC, which validates stock,
 * computes the discount/total, and writes the order + line items +
 * inventory deduction + movement log all in one DB transaction - see
 * supabase/migrations/0006_create_pos_order_rpc.sql. Prices are always
 * looked up server-side from `products`, never trusted from the client.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  await requireStaff();
  if (input.cart.length === 0) {
    throw new Error("Cart is empty.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pos_order", {
    p_items: input.cart.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_payment_method: input.paymentMethod,
    p_pickup_name: input.pickupName ?? null,
    p_cash_received: input.cashReceived ?? null,
    p_ewallet_provider: input.ewalletProvider ?? null,
    p_customer_type: input.customerType ?? "regular",
    p_discount_id_number: input.discountIdNumber ?? null,
  });
  if (error) throw new Error(error.message);

  const created = data as { id: string };
  const order = await getOrderById(created.id);
  if (!order) throw new Error("Order was created but could not be loaded.");
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const session = await requireStaff();
  if (session.role !== "admin") {
    throw new Error("Only admins can update order status.");
  }

  const paymentStatus =
    status === "confirmed" ||
    status === "preparing" ||
    status === "ready" ||
    status === "completed"
      ? "verified"
      : undefined;

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      order_status: status,
      updated_at: new Date().toISOString(),
      ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function verifyOrderDiscount(
  id: string,
  idNumber: string,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const session = await requireStaff();
  if (session.role !== "admin") {
    return { ok: false, error: "Only admins can verify discounts." };
  }

  const trimmedId = idNumber.trim();
  if (!trimmedId) {
    return { ok: false, error: "Please enter the customer's ID number." };
  }

  const order = await getOrderById(id);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.discountStatus !== "pending") {
    return { ok: false, error: "This order has no pending discount to verify." };
  }

  const subtotal =
    order.subtotalBeforeDiscount ?? order.totalAmount + (order.discountAmount ?? 0);
  const customerType = order.customerType ?? "regular";
  const { discountRate, discountAmount, total } = calcDiscount(subtotal, customerType);

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      discount_status: "verified",
      discount_id_number: trimmedId,
      discount_rate: discountRate || null,
      discount_amount: discountAmount || null,
      total_amount: total,
      expected_change:
        order.cashReceived != null
          ? calcExpectedChange(order.cashReceived, total)
          : (order.expectedChange ?? null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  const updated = await getOrderById(id);
  if (!updated) return { ok: false, error: "Order not found after update." };
  return { ok: true, order: updated };
}
