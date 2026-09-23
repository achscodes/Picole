import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  CachedDashboardEntry,
  CachedInventoryItem,
  CachedOrder,
  CachedProduct,
  DraftCart,
  MetaEntry,
  PendingSale,
} from "@/lib/offline/types";

interface PicoleOfflineDB extends DBSchema {
  pendingSales: {
    key: string;
    value: PendingSale;
    indexes: {
      "by-status": string;
      "by-queuedAt": number;
      "by-queuedByUserId": string;
    };
  };
  draftCart: {
    key: string;
    value: DraftCart;
  };
  productsCache: {
    key: string;
    value: CachedProduct;
  };
  inventoryCache: {
    key: string;
    value: CachedInventoryItem;
  };
  ordersCache: {
    key: string;
    value: CachedOrder;
    indexes: {
      "by-createdAt": string;
      "by-orderNumber": string;
    };
  };
  dashboardCache: {
    key: string;
    value: CachedDashboardEntry;
  };
  meta: {
    key: string;
    value: MetaEntry;
  };
}

const DB_NAME = "picole-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PicoleOfflineDB>> | null = null;

function openPicoleDb() {
  if (!dbPromise) {
    dbPromise = openDB<PicoleOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sales = db.createObjectStore("pendingSales", {
          keyPath: "clientOrderId",
        });
        sales.createIndex("by-status", "status");
        sales.createIndex("by-queuedAt", "queuedAt");
        sales.createIndex("by-queuedByUserId", "queuedByUserId");

        db.createObjectStore("draftCart", { keyPath: "id" });
        db.createObjectStore("productsCache", { keyPath: "id" });
        db.createObjectStore("inventoryCache", { keyPath: "productId" });

        const orders = db.createObjectStore("ordersCache", { keyPath: "id" });
        orders.createIndex("by-createdAt", "createdAt");
        orders.createIndex("by-orderNumber", "orderNumber", { unique: true });

        db.createObjectStore("dashboardCache", { keyPath: "key" });
        db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

/**
 * Every exported helper degrades to a safe no-op/undefined when IndexedDB is
 * unavailable (private browsing, quota exceeded, disabled by policy) or the
 * call itself throws, rather than propagating - offline queueing/caching is
 * a progressive enhancement layered on top of the network-only app, never a
 * requirement for it to function.
 */
async function withDb<T>(
  fn: (db: IDBPDatabase<PicoleOfflineDB>) => Promise<T>,
): Promise<T | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  try {
    const db = await openPicoleDb();
    return await fn(db);
  } catch (err) {
    dbPromise = null;
    console.warn("[offline] IndexedDB operation failed:", err);
    return undefined;
  }
}

export function isOfflineStorageAvailable() {
  return typeof indexedDB !== "undefined";
}

// --- pendingSales -----------------------------------------------------

export async function putPendingSale(sale: PendingSale) {
  await withDb((db) => db.put("pendingSales", sale));
}

export async function getPendingSale(clientOrderId: string) {
  return withDb((db) => db.get("pendingSales", clientOrderId));
}

export async function getAllPendingSales(): Promise<PendingSale[]> {
  return (
    (await withDb((db) => db.getAllFromIndex("pendingSales", "by-queuedAt"))) ?? []
  );
}

export async function deletePendingSale(clientOrderId: string) {
  await withDb((db) => db.delete("pendingSales", clientOrderId));
}

// --- draftCart -----------------------------------------------------

export async function getDraftCart(): Promise<DraftCart | undefined> {
  return withDb((db) => db.get("draftCart", "draft"));
}

export async function putDraftCart(draft: DraftCart) {
  await withDb((db) => db.put("draftCart", draft));
}

export async function clearDraftCart() {
  await withDb((db) => db.delete("draftCart", "draft"));
}

// --- read caches -----------------------------------------------------

export async function putProductsCache(products: CachedProduct[]) {
  await withDb(async (db) => {
    const tx = db.transaction("productsCache", "readwrite");
    await Promise.all(products.map((p) => tx.store.put(p)));
    await tx.done;
  });
}

export async function getProductsCache(): Promise<CachedProduct[]> {
  return (await withDb((db) => db.getAll("productsCache"))) ?? [];
}

export async function putInventoryCache(items: CachedInventoryItem[]) {
  await withDb(async (db) => {
    const tx = db.transaction("inventoryCache", "readwrite");
    await Promise.all(items.map((i) => tx.store.put(i)));
    await tx.done;
  });
}

export async function getInventoryCache(): Promise<CachedInventoryItem[]> {
  return (await withDb((db) => db.getAll("inventoryCache"))) ?? [];
}

export async function putOrdersCache(orders: CachedOrder[]) {
  await withDb(async (db) => {
    const tx = db.transaction("ordersCache", "readwrite");
    await Promise.all(orders.map((o) => tx.store.put(o)));
    await tx.done;
  });
}

export async function getOrdersCache(): Promise<CachedOrder[]> {
  return (await withDb((db) => db.getAll("ordersCache"))) ?? [];
}

export async function putDashboardCache(entry: CachedDashboardEntry) {
  await withDb((db) => db.put("dashboardCache", entry));
}

export async function getDashboardCache<T>(
  key: string,
): Promise<CachedDashboardEntry<T> | undefined> {
  return withDb((db) => db.get("dashboardCache", key)) as Promise<
    CachedDashboardEntry<T> | undefined
  >;
}

// --- meta -----------------------------------------------------

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const entry = await withDb((db) => db.get("meta", key));
  return entry?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown) {
  await withDb((db) => db.put("meta", { key, value }));
}

// --- clearing -----------------------------------------------------

/**
 * Wipes every disposable read cache plus the in-progress draft cart. Never
 * touches pendingSales - an un-synced sale is real, unrecorded revenue and
 * must survive a sign-out or a different cashier logging in on a shared
 * terminal (see src/lib/offline/sync-engine.ts and DashboardShell's sign-out
 * flow, which warns instead of blocking when non-terminal sales exist).
 */
export async function clearReadCaches() {
  await withDb(async (db) => {
    await db.clear("productsCache");
    await db.clear("inventoryCache");
    await db.clear("ordersCache");
    await db.clear("dashboardCache");
    await db.clear("draftCart");
  });
}
