import { listProducts } from "@/lib/product-store";

const INVENTORY_KEY = "picole.inventory.v1";

export interface InventoryItem {
  productId: string;
  stock: number;
  alertAt: number;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function defaultInventory(): Record<string, InventoryItem> {
  const map: Record<string, InventoryItem> = {};
  for (const product of listProducts()) {
    map[product.id] = {
      productId: product.id,
      stock: 50,
      alertAt: 10,
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
      if (stored[product.id]) {
        merged[product.id] = stored[product.id];
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

export function listInventory() {
  return Object.values(readInventory());
}

export function getInventoryItem(productId: string) {
  return readInventory()[productId];
}

export function setStock(productId: string, stock: number) {
  const map = readInventory();
  if (!map[productId]) return null;
  map[productId] = { ...map[productId], stock: Math.max(0, stock) };
  writeInventory(map);
  return map[productId];
}

export function adjustStock(productId: string, delta: number) {
  const item = getInventoryItem(productId);
  if (!item) return null;
  return setStock(productId, item.stock + delta);
}

export function setAlertAt(productId: string, alertAt: number) {
  const map = readInventory();
  if (!map[productId]) return null;
  map[productId] = { ...map[productId], alertAt: Math.max(0, alertAt) };
  writeInventory(map);
  return map[productId];
}

export function restockProduct(productId: string, amount = 25) {
  return adjustStock(productId, amount);
}

export function getInventorySummary() {
  const items = listInventory();
  const unitsInStock = items.reduce((sum, i) => sum + i.stock, 0);
  const lowStock = items.filter((i) => i.stock > 0 && i.stock <= i.alertAt).length;
  const outOfStock = items.filter((i) => i.stock === 0).length;

  return { unitsInStock, lowStock, outOfStock, itemCount: items.length };
}

export function deductStockForItems(
  items: Array<{ productId: string; quantity: number }>,
) {
  for (const item of items) {
    adjustStock(item.productId, -item.quantity);
  }
}

export function resetInventory() {
  writeInventory(defaultInventory());
}
