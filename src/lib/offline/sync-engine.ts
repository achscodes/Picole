import { submitPosSale } from "@/lib/actions/orders";
import type { CreateOrderInput } from "@/lib/actions/orders";
import {
  deletePendingSale,
  getAllPendingSales,
  getPendingSale,
  putPendingSale,
} from "@/lib/offline/db";
import { classifyThrown } from "@/lib/offline/classify-error";
import { reportRequestOutcome, setSyncing } from "@/lib/offline/connectivity-store";
import type { PendingSale, PendingSaleSnapshotItem } from "@/lib/offline/types";
import type { Session } from "@/types/auth";

const BASE_BACKOFF_MS = 3_000;
const MAX_BACKOFF_MS = 60_000;
const ACTIONABLE_STATUSES: PendingSale["status"][] = ["pending", "failed-retryable"];

let activeSession: Session | null = null;
let processing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function emitQueueChanged() {
  for (const listener of listeners) listener();
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function backoffFor(attempts: number) {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

function withoutRetryTimer<T extends PendingSale>(sale: T): T {
  const rest = { ...sale };
  delete rest.nextRetryAt;
  return rest;
}

/**
 * Must be called (and kept current) by whatever's holding the logged-in
 * session - see useOfflineSaleQueue, mounted once in DashboardShell. The
 * sync engine never syncs a queued sale on behalf of anyone other than
 * whoever queued it (see the attribution check in processQueue), so it
 * always needs to know who's currently signed in on this device.
 */
export function setActiveSession(session: Session | null) {
  const changed = activeSession?.userId !== session?.userId;
  activeSession = session;
  if (changed && session) {
    void resumeBlockedForCurrentSession();
  }
}

/** Read by pos.ts's completePosSale to attribute a newly-queued sale to
 * whoever's actually signed in on this device right now. */
export function getActiveSession(): Session | null {
  return activeSession;
}

export interface EnqueueSaleInput {
  input: CreateOrderInput;
  session: Session;
  clientSnapshot: {
    subtotal: number;
    total: number;
    items: PendingSaleSnapshotItem[];
  };
}

/**
 * Queues a sale for later sync. `input.clientOrderId` (minted once by the
 * caller via crypto.randomUUID()) is reused verbatim on every retry - it's
 * what lets create_pos_order (0009_pos_order_idempotency.sql) recognize a
 * replay and return the existing order instead of creating a duplicate.
 */
export async function enqueueSale({
  input,
  session,
  clientSnapshot,
}: EnqueueSaleInput): Promise<string> {
  const clientOrderId = input.clientOrderId ?? crypto.randomUUID();
  const sale: PendingSale = {
    clientOrderId,
    status: "pending",
    input: { ...input, clientOrderId },
    clientSnapshot,
    queuedAt: Date.now(),
    queuedByUserId: session.userId,
    queuedByName: session.name,
    attempts: 0,
  };
  await putPendingSale(sale);
  emitQueueChanged();
  scheduleProcessing(0);
  return clientOrderId;
}

export function scheduleProcessing(delayMs = 0) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    void processQueue();
  }, delayMs);
}

/**
 * Drains pendingSales sequentially, oldest first - never in parallel, so a
 * shared terminal never fires two concurrent stock-locking RPC calls from
 * the same device and receipts settle in a predictable order. Stops early
 * (rather than skipping ahead) on the first retryable failure in a pass so
 * a struggling backend isn't hammered with the rest of the queue at once;
 * the scheduled backoff retry will pick up where it left off.
 */
export async function processQueue(): Promise<void> {
  if (processing) return;
  const session = activeSession;
  if (!session) return;

  processing = true;
  setSyncing(true);
  try {
    const sales = await getAllPendingSales();

    for (const sale of sales) {
      if (sale.queuedByUserId !== session.userId) {
        if (sale.status !== "blocked-other-session" && ACTIONABLE_STATUSES.includes(sale.status)) {
          await putPendingSale({ ...sale, status: "blocked-other-session" });
          emitQueueChanged();
        }
        continue;
      }

      if (!ACTIONABLE_STATUSES.includes(sale.status)) continue;
      if (sale.nextRetryAt && sale.nextRetryAt > Date.now()) continue;

      await putPendingSale({ ...sale, status: "syncing" });
      emitQueueChanged();

      try {
        const result = await submitPosSale(sale.input);
        reportRequestOutcome(null);

        if (result.ok) {
          const discrepancy = result.order.totalAmount !== sale.clientSnapshot.total;
          await putPendingSale(
            withoutRetryTimer({
              ...sale,
              status: discrepancy ? "synced-with-discrepancy" : "synced",
              resultOrderId: result.order.id,
              resultOrderNumber: result.order.orderNumber,
              attempts: sale.attempts + 1,
              lastAttemptAt: Date.now(),
            }),
          );
          emitQueueChanged();
          continue;
        }

        if (result.kind === "auth") {
          await putPendingSale({
            ...sale,
            status: "blocked-auth",
            attempts: sale.attempts + 1,
            lastAttemptAt: Date.now(),
            lastError: { kind: result.kind, message: result.message },
          });
          emitQueueChanged();
          // A session that can no longer authenticate can't sync anything
          // else in this pass either.
          break;
        }

        if (
          result.kind === "stock" ||
          result.kind === "product_unavailable" ||
          result.kind === "validation"
        ) {
          // Server-confirmed rejection, not a connectivity problem - stop
          // auto-retrying and surface it for a human to resolve (see
          // PendingSyncIndicator). Never silently drop or auto-adjust.
          await putPendingSale(
            withoutRetryTimer({
              ...sale,
              status: "failed-terminal",
              attempts: sale.attempts + 1,
              lastAttemptAt: Date.now(),
              lastError: { kind: result.kind, message: result.message },
            }),
          );
          emitQueueChanged();
          continue;
        }

        // "unknown" - the backend was reached but errored unexpectedly
        // (e.g. Supabase itself is down). Retryable, but stop draining the
        // rest of the queue this pass.
        const attempts = sale.attempts + 1;
        await putPendingSale({
          ...sale,
          status: "failed-retryable",
          attempts,
          lastAttemptAt: Date.now(),
          nextRetryAt: Date.now() + backoffFor(attempts),
          lastError: { kind: result.kind, message: result.message },
        });
        emitQueueChanged();
        scheduleProcessing(backoffFor(attempts));
        break;
      } catch (err) {
        // The Server Action invocation itself failed to reach the server -
        // a genuine network failure, not a server-side rejection.
        reportRequestOutcome(err);
        const attempts = sale.attempts + 1;
        await putPendingSale({
          ...sale,
          status: "failed-retryable",
          attempts,
          lastAttemptAt: Date.now(),
          nextRetryAt: Date.now() + backoffFor(attempts),
          lastError: {
            kind: classifyThrown(err) === "network" ? "network" : "unknown",
            message: err instanceof Error ? err.message : "Network error.",
          },
        });
        emitQueueChanged();
        scheduleProcessing(backoffFor(attempts));
        break;
      }
    }
  } finally {
    processing = false;
    setSyncing(false);
  }
}

export async function retrySale(clientOrderId: string) {
  const sale = await getPendingSale(clientOrderId);
  if (!sale) return;
  await putPendingSale(withoutRetryTimer({ ...sale, status: "pending" }));
  emitQueueChanged();
  scheduleProcessing(0);
}

/** User-initiated give-up on a terminally-failed or blocked sale (e.g. the
 * product really is gone and there's nothing left to sync). Does not touch
 * anything server-side - the order was never created. */
export async function cancelSale(clientOrderId: string) {
  await deletePendingSale(clientOrderId);
  emitQueueChanged();
}

async function resumeBlockedForCurrentSession() {
  if (!activeSession) return;
  const session = activeSession;
  const sales = await getAllPendingSales();
  let changed = false;
  for (const sale of sales) {
    if (
      (sale.status === "blocked-auth" || sale.status === "blocked-other-session") &&
      sale.queuedByUserId === session.userId
    ) {
      await putPendingSale(withoutRetryTimer({ ...sale, status: "pending" }));
      changed = true;
    }
  }
  if (changed) {
    emitQueueChanged();
    scheduleProcessing(0);
  }
}
