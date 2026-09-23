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
  /** Client-generated UUID, reused across retries of the same checkout
   * attempt, so a slow-connection double-submit or an offline-queue replay
   * can never create a duplicate order - see 0009_pos_order_idempotency.sql. */
  clientOrderId?: string;
}

async function requireStaff() {
  const session = await getCurrentSession();
  if (!session) throw new Error("You must be signed in to record a sale.");
  return session;
}

function rpcArgs(input: CreateOrderInput) {
  return {
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
    p_client_order_id: input.clientOrderId ?? null,
  };
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
  const { data, error } = await supabase.rpc("create_pos_order", rpcArgs(input));
  if (error) throw new Error(error.message);

  const created = data as { id: string };
  const order = await getOrderById(created.id);
  if (!order) throw new Error("Order was created but could not be loaded.");
  return order;
}

export type SubmitPosSaleErrorKind =
  | "auth"
  | "stock"
  | "product_unavailable"
  | "validation"
  | "unknown";

export type SubmitPosSaleResult =
  | { ok: true; order: Order }
  | { ok: false; kind: SubmitPosSaleErrorKind; message: string };

/** Maps the custom SQLSTATEs raised by create_pos_order (see
 * 0009_pos_order_idempotency.sql) to a classification the offline sync
 * engine can act on without parsing English error text. */
const RPC_ERROR_KIND: Record<string, SubmitPosSaleErrorKind> = {
  PIC01: "validation",
  PIC02: "product_unavailable",
  PIC03: "stock",
  PIC04: "validation",
  PIC05: "validation",
};

/**
 * Same underlying RPC call as `createOrder`, but never throws - returns a
 * typed result instead, since Next.js Server Actions only forward
 * `Error.message` to the client (custom properties like `.code` are
 * dropped). This is what the offline sync engine calls so it can reliably
 * tell "retry later" (network/stock races) apart from "ask a human" (bad
 * input, expired session) failures.
 */
export async function submitPosSale(
  input: CreateOrderInput,
): Promise<SubmitPosSaleResult> {
  try {
    await requireStaff();
  } catch (e) {
    return {
      ok: false,
      kind: "auth",
      message: e instanceof Error ? e.message : "You must be signed in to record a sale.",
    };
  }

  if (input.cart.length === 0) {
    return { ok: false, kind: "validation", message: "Cart is empty." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pos_order", rpcArgs(input));
  if (error) {
    const kind = (error.code && RPC_ERROR_KIND[error.code]) || "unknown";
    return { ok: false, kind, message: error.message };
  }

  const created = data as { id: string };
  try {
    const order = await getOrderById(created.id);
    if (!order) {
      return {
        ok: false,
        kind: "unknown",
        message: "Order was created but could not be loaded.",
      };
    }
    return { ok: true, order };
  } catch (e) {
    return {
      ok: false,
      kind: "unknown",
      message:
        e instanceof Error
          ? `Order was created but could not be loaded: ${e.message}`
          : "Order was created but could not be loaded.",
    };
  }
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
