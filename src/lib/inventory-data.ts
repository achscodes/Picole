import "server-only";

import {
  computeInventoryOverview,
  type InventoryItem,
  type InventoryMovement,
} from "@/lib/inventory";
import { listProducts } from "@/lib/product-store";
import { createClient } from "@/lib/supabase/server";

type InventoryRow = {
  product_id: string;
  stock: number;
  alert_at: number;
  updated_at: string;
};

type MovementRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  movement_type: InventoryMovement["movementType"];
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  order_id: string | null;
  created_at: string;
};

function mapInventoryRow(row: InventoryRow): InventoryItem {
  return {
    productId: row.product_id,
    stock: row.stock,
    alertAt: row.alert_at,
    updatedAt: row.updated_at,
  };
}

function mapMovementRow(row: MovementRow): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id ?? "system",
    userName: row.user_name,
    movementType: row.movement_type,
    quantity: row.quantity,
    previousStock: row.previous_stock,
    newStock: row.new_stock,
    reason: row.reason,
    orderId: row.order_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listInventory(): Promise<InventoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("product_id, stock, alert_at, updated_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapInventoryRow);
}

export async function getInventoryItem(
  productId: string,
): Promise<InventoryItem | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("product_id, stock, alert_at, updated_at")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapInventoryRow(data) : undefined;
}

export async function listMovements(filters?: {
  productId?: string;
  limit?: number;
}): Promise<InventoryMovement[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_movements")
    .select(
      "id, product_id, user_id, user_name, movement_type, quantity, previous_stock, new_stock, reason, order_id, created_at",
    )
    .order("created_at", { ascending: false });
  if (filters?.productId) {
    query = query.eq("product_id", filters.productId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMovementRow);
}

export async function getInventoryOverview() {
  const [items, products] = await Promise.all([listInventory(), listProducts()]);
  const priceById = new Map(products.map((p) => [p.id, p.price]));
  return computeInventoryOverview(items, priceById);
}
