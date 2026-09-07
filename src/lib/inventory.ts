export interface InventoryItem {
  productId: string;
  stock: number;
  alertAt: number;
  updatedAt: string;
}

export type InventoryMovementType =
  | "added"
  | "removed"
  | "adjusted"
  | "sale"
  | "damaged"
  | "expired";

export interface InventoryMovement {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  /** Signed change in stock: positive when stock increased, negative when it decreased. */
  quantity: number;
  movementType: InventoryMovementType;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  createdAt: string;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.stock <= 0) return "out-of-stock";
  if (item.stock <= item.alertAt) return "low-stock";
  return "in-stock";
}

export function computeInventoryOverview(
  items: InventoryItem[],
  priceById: Map<string, number>,
) {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let unitsInStock = 0;
  let stockValue = 0;

  for (const item of items) {
    unitsInStock += item.stock;
    stockValue += (priceById.get(item.productId) ?? 0) * item.stock;
    const status = getStockStatus(item);
    if (status === "in-stock") inStock++;
    else if (status === "low-stock") lowStock++;
    else outOfStock++;
  }

  return {
    totalProducts: items.length,
    inStock,
    lowStock,
    outOfStock,
    unitsInStock,
    stockValue,
  };
}
