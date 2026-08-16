import { listProducts } from "@/lib/product-store";
import { getSession } from "@/lib/auth";

const INVENTORY_KEY = "picole.inventory.v1";
const MOVEMENTS_KEY = "picole.inventory-movements.v1";

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
  movementType: InventoryMovementType;
  /** Signed change in stock: positive when stock increased, negative when it decreased. */
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  createdAt: string;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

function canUseStorage() {
  return typeof window !== "undefined";
}

function defaultInventory(): Record<string, InventoryItem> {
  const map: Record<string, InventoryItem> = {};
  const now = new Date().toISOString();
  for (const product of listProducts()) {
    map[product.id] = {
      productId: product.id,
      stock: 50,
      alertAt: 10,
      updatedAt: now,
    };
  }
  return map;
}

function readInventory(): Record<string, InventoryItem> {
  if (!canUseStorage()) return defaultInventory();
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    const stored = raw
      ? (JSON.parse(raw) as Record<string, InventoryItem>)
      : {};
    const merged = defaultInventory();
    for (const product of listProducts()) {
      const existing = stored[product.id];
      if (existing) {
        // Legacy records predate updatedAt — backfill so callers always get a string.
        merged[product.id] = {
          ...existing,
          updatedAt: existing.updatedAt ?? merged[product.id].updatedAt,
        };
      }
    }
    return merged;
  } catch {
    return defaultInventory();
  }
}

function writeInventory(map: Record<string, InventoryItem>) {
  if (!canUseStorage()) return;
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(map));
}

function readMovements(): InventoryMovement[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(MOVEMENTS_KEY);
    return raw ? (JSON.parse(raw) as InventoryMovement[]) : [];
  } catch {
    return [];
  }
}

function writeMovements(movements: InventoryMovement[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

function actor() {
  const session = getSession();
  return {
    userId: session?.userId ?? "system",
    userName: session?.name ?? "System",
  };
}

function recordMovement(entry: Omit<InventoryMovement, "id" | "createdAt">) {
  const movements = readMovements();
  const movement: InventoryMovement = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  movements.unshift(movement);
  writeMovements(movements);
  return movement;
}

/** Single write path for every stock change — always logs a movement so no adjustment is untracked. */
function applyStockChange(
  productId: string,
  nextStockRaw: number,
  opts: {
    movementType: InventoryMovementType;
    reason: string;
    orderId?: string;
  },
): InventoryItem | null {
  const map = readInventory();
  const current = map[productId];
  if (!current) return null;

  const previousStock = current.stock;
  const newStock = Math.max(0, Math.round(nextStockRaw));
  const now = new Date().toISOString();
  map[productId] = { ...current, stock: newStock, updatedAt: now };
  writeInventory(map);

  if (newStock !== previousStock) {
    const { userId, userName } = actor();
    recordMovement({
      productId,
      userId,
      userName,
      movementType: opts.movementType,
      quantity: newStock - previousStock,
      previousStock,
      newStock,
      reason: opts.reason.trim() || "No reason provided",
      orderId: opts.orderId,
    });
  }

  return map[productId];
}

export function listInventory() {
  return Object.values(readInventory());
}

export function getInventoryItem(productId: string) {
  return readInventory()[productId];
}

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.stock <= 0) return "out-of-stock";
  if (item.stock <= item.alertAt) return "low-stock";
  return "in-stock";
}

/** "(=) Set Stock" — replace the count outright (e.g. correcting a physical count). */
export function setStock(productId: string, stock: number, reason: string) {
  return applyStockChange(productId, stock, { movementType: "adjusted", reason });
}

/** Generic signed adjustment. Positive delta increases stock, negative decreases it. */
export function adjustStock(
  productId: string,
  delta: number,
  opts: { reason: string; movementType?: InventoryMovementType; orderId?: string },
) {
  const item = getInventoryItem(productId);
  if (!item) return null;
  return applyStockChange(productId, item.stock + delta, {
    movementType: opts.movementType ?? "adjusted",
    reason: opts.reason,
    orderId: opts.orderId,
  });
}

export function setAlertAt(productId: string, alertAt: number) {
  const map = readInventory();
  if (!map[productId]) return null;
  map[productId] = { ...map[productId], alertAt: Math.max(0, alertAt) };
  writeInventory(map);
  return map[productId];
}

export function restockProduct(productId: string, amount: number, reason = "Restock") {
  return adjustStock(productId, Math.abs(amount), { reason, movementType: "added" });
}

export function removeStock(productId: string, amount: number, reason: string) {
  return adjustStock(productId, -Math.abs(amount), { reason, movementType: "removed" });
}

export function recordDamagedStock(productId: string, amount: number, reason: string) {
  return adjustStock(productId, -Math.abs(amount), { reason, movementType: "damaged" });
}

export function recordExpiredStock(productId: string, amount: number, reason: string) {
  return adjustStock(productId, -Math.abs(amount), { reason, movementType: "expired" });
}

/** Deducts stock for a completed POS sale and links the movement back to the order. */
export function deductStockForSale(
  items: Array<{ productId: string; quantity: number }>,
  orderId: string,
) {
  for (const item of items) {
    adjustStock(item.productId, -item.quantity, {
      reason: "POS Sale",
      movementType: "sale",
      orderId,
    });
  }
}

export function listMovements(filters?: { productId?: string; limit?: number }) {
  let movements = readMovements().sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  if (filters?.productId) {
    movements = movements.filter((m) => m.productId === filters.productId);
  }
  if (filters?.limit) {
    movements = movements.slice(0, filters.limit);
  }
  return movements;
}

export function getInventoryOverview() {
  const items = listInventory();
  const products = listProducts();
  const priceById = new Map(products.map((p) => [p.id, p.price]));

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

export function resetInventory() {
  writeInventory(defaultInventory());
  writeMovements([]);
}
