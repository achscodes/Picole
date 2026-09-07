"use server";

import { getCurrentSession } from "@/lib/auth";
import { generateDemoData } from "@/lib/seed";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    throw new Error("Only admins can manage demo data.");
  }
}

/**
 * Uses the service-role client for this bulk demo-data operation only, so
 * the `orders`/`inventory_movements` tables can stay delete-free for every
 * other caller (real sales are only ever cancelled via order_status, never
 * deleted) while still letting an admin wipe/reload the sample dataset.
 */
async function clearOrdersAndMovements() {
  const admin = createAdminClient();
  await admin.from("inventory_movements").delete().not("id", "is", null);
  await admin.from("orders").delete().not("id", "is", null); // cascades order_items
}

/**
 * Replaces all orders/inventory history with freshly generated sample
 * transactions. Cosmetic demo data only - unlike the atomic `create_pos_order`
 * RPC used for real sales, sequential inserts here are fine.
 *
 * Order numbers are intentionally omitted from the insert (left to the
 * `order_number_seq` default) and orders are inserted oldest-first, so the
 * sequence ends up correctly advanced for the next real sale instead of
 * colliding with a hardcoded seeded number.
 */
export async function seedDemoData() {
  await requireAdmin();
  const { orders, inventoryMap, movements } = generateDemoData();
  const admin = createAdminClient();

  await clearOrdersAndMovements();

  const chronological = [...orders].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );

  for (const order of chronological) {
    const { error } = await admin.from("orders").insert({
      id: order.id,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      pickup_name: order.pickupName ?? null,
      cash_received: order.cashReceived ?? null,
      expected_change: order.expectedChange ?? null,
      ewallet_provider: order.ewalletProvider ?? null,
      customer_type: order.customerType ?? "regular",
      subtotal_before_discount: order.subtotalBeforeDiscount ?? null,
      discount_rate: order.discountRate ?? null,
      discount_amount: order.discountAmount ?? null,
      discount_status: order.discountStatus ?? "none",
      discount_id_number: order.discountIdNumber ?? null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    });
    if (error) throw new Error(error.message);

    if (order.items.length > 0) {
      const { error: itemsError } = await admin.from("order_items").insert(
        order.items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        })),
      );
      if (itemsError) throw new Error(itemsError.message);
    }
  }

  for (const item of Object.values(inventoryMap)) {
    const { error } = await admin
      .from("inventory")
      .update({ stock: item.stock, alert_at: item.alertAt, updated_at: item.updatedAt })
      .eq("product_id", item.productId);
    if (error) throw new Error(error.message);
  }

  if (movements.length > 0) {
    const { error } = await admin.from("inventory_movements").insert(
      movements.map((m) => ({
        product_id: m.productId,
        user_id: null,
        user_name: m.userName,
        movement_type: m.movementType,
        quantity: m.quantity,
        previous_stock: m.previousStock,
        new_stock: m.newStock,
        reason: m.reason,
        order_id: m.orderId ?? null,
        created_at: m.createdAt,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

/** Clears orders/order_items/inventory_movements and resets every product's stock to 50/10. */
export async function resetDemoData() {
  await requireAdmin();
  await clearOrdersAndMovements();

  const admin = createAdminClient();
  const { error } = await admin
    .from("inventory")
    .update({ stock: 50, alert_at: 10, updated_at: new Date().toISOString() })
    .not("product_id", "is", null);
  if (error) throw new Error(error.message);
}
