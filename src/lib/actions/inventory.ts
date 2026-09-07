"use server";

import { getCurrentSession } from "@/lib/auth";
import type { InventoryItem, InventoryMovementType } from "@/lib/inventory";
import { getInventoryItem as fetchInventoryItem, listInventory, listMovements } from "@/lib/inventory-data";
import { createClient } from "@/lib/supabase/server";

/** "use server" passthroughs so client components can fetch/poll inventory
 * data directly, without a full page navigation/refresh. */
export async function getInventoryList() {
  return listInventory();
}

export async function getInventoryItemAction(productId: string) {
  return fetchInventoryItem(productId);
}

export async function getMovements(filters?: { productId?: string; limit?: number }) {
  return listMovements(filters);
}

async function requireStaff() {
  const session = await getCurrentSession();
  if (!session) throw new Error("You must be signed in to manage inventory.");
  return session;
}

async function actor() {
  const session = await getCurrentSession();
  return {
    userId: session?.userId ?? null,
    userName: session?.name ?? "System",
  };
}

/** Single write path for every stock change - always logs a movement so no adjustment is untracked. */
async function applyStockChange(
  productId: string,
  nextStockRaw: number,
  opts: { movementType: InventoryMovementType; reason: string; orderId?: string },
): Promise<InventoryItem | null> {
  await requireStaff();
  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("inventory")
    .select("stock, alert_at")
    .eq("product_id", productId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!current) return null;

  const previousStock = current.stock;
  const newStock = Math.max(0, Math.round(nextStockRaw));
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("inventory")
    .update({ stock: newStock, updated_at: now })
    .eq("product_id", productId);
  if (updateError) throw new Error(updateError.message);

  if (newStock !== previousStock) {
    const { userId, userName } = await actor();
    const { error: movementError } = await supabase.from("inventory_movements").insert({
      product_id: productId,
      user_id: userId,
      user_name: userName,
      movement_type: opts.movementType,
      quantity: newStock - previousStock,
      previous_stock: previousStock,
      new_stock: newStock,
      reason: opts.reason.trim() || "No reason provided",
      order_id: opts.orderId ?? null,
    });
    if (movementError) throw new Error(movementError.message);
  }

  return { productId, stock: newStock, alertAt: current.alert_at, updatedAt: now };
}

/** "(=) Set Stock" - replace the count outright (e.g. correcting a physical count). */
export async function setStock(productId: string, stock: number, reason: string) {
  return applyStockChange(productId, stock, { movementType: "adjusted", reason });
}

/** Generic signed adjustment. Positive delta increases stock, negative decreases it. */
export async function adjustStock(
  productId: string,
  delta: number,
  opts: { reason: string; movementType?: InventoryMovementType; orderId?: string },
) {
  await requireStaff();
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("inventory")
    .select("stock")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!item) return null;
  return applyStockChange(productId, item.stock + delta, {
    movementType: opts.movementType ?? "adjusted",
    reason: opts.reason,
    orderId: opts.orderId,
  });
}

export async function setAlertAt(productId: string, alertAt: number) {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .update({ alert_at: Math.max(0, alertAt) })
    .eq("product_id", productId)
    .select("product_id, stock, alert_at, updated_at")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    productId: data.product_id,
    stock: data.stock,
    alertAt: data.alert_at,
    updatedAt: data.updated_at,
  } satisfies InventoryItem;
}

export async function restockProduct(productId: string, amount: number, reason = "Restock") {
  return adjustStock(productId, Math.abs(amount), { reason, movementType: "added" });
}

export async function removeStock(productId: string, amount: number, reason: string) {
  return adjustStock(productId, -Math.abs(amount), { reason, movementType: "removed" });
}

export async function recordDamagedStock(productId: string, amount: number, reason: string) {
  return adjustStock(productId, -Math.abs(amount), { reason, movementType: "damaged" });
}

export async function recordExpiredStock(productId: string, amount: number, reason: string) {
  return adjustStock(productId, -Math.abs(amount), { reason, movementType: "expired" });
}
