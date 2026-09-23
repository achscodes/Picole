import type { CartItem, CustomerType, Order, Product } from "@/types";
import type { InventoryItem } from "@/lib/inventory";
import type { CreateOrderInput, SubmitPosSaleErrorKind } from "@/lib/actions/orders";

export type PendingSaleStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "synced-with-discrepancy"
  | "failed-retryable"
  | "failed-terminal"
  | "blocked-auth"
  | "blocked-other-session";

export interface PendingSaleSnapshotItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface PendingSale {
  clientOrderId: string;
  status: PendingSaleStatus;
  input: CreateOrderInput;
  /** Display-only snapshot of what the cashier saw at ring-up time - never
   * sent to the server as authoritative. The RPC always recomputes price/
   * discount/total live at sync time (see 0006/0009 migrations). Used to
   * detect and flag price drift as "synced-with-discrepancy" instead of
   * silently absorbing it. */
  clientSnapshot: {
    subtotal: number;
    total: number;
    items: PendingSaleSnapshotItem[];
  };
  queuedAt: number;
  queuedByUserId: string;
  queuedByName: string;
  attempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  lastError?: { kind: SubmitPosSaleErrorKind | "network"; message: string };
  resultOrderId?: string;
  resultOrderNumber?: string;
}

export interface DraftCart {
  id: "draft";
  items: CartItem[];
  customerName?: string;
  customerType?: CustomerType;
  savedAt: number;
  savedByUserId: string;
}

/** Max size (bytes, approx.) of a product's base64 image data URL before we
 * drop it from the cached copy and fall back to a placeholder offline - one
 * oversized staff-uploaded photo shouldn't blow up device storage. */
export const MAX_CACHED_IMAGE_LENGTH = 200_000;

export type CachedProduct = Product & { cachedAt: number };
export type CachedInventoryItem = InventoryItem & { cachedAt: number };
export type CachedOrder = Order & { cachedAt: number };

export interface CachedDashboardEntry<T = unknown> {
  key: string;
  data: T;
  cachedAt: number;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

export type ConnectivityState =
  | "online"
  | "poor-connection"
  | "offline"
  | "server-unavailable"
  | "reconnecting";
