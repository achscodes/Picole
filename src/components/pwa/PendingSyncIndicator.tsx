"use client";

import { useState } from "react";
import { CloudUpload, RotateCw, X } from "lucide-react";
import type { PendingSale } from "@/lib/offline/types";
import { cn, formatPeso } from "@/lib/format";

const STATUS_LABEL: Record<PendingSale["status"], string> = {
  pending: "Pending",
  syncing: "Syncing…",
  synced: "Synced",
  "synced-with-discrepancy": "Synced (check total)",
  "failed-retryable": "Retrying…",
  "failed-terminal": "Needs review",
  "blocked-auth": "Sign in to sync",
  "blocked-other-session": "Queued by another cashier",
};

const RETRYABLE_STATUSES: PendingSale["status"][] = [
  "failed-retryable",
  "failed-terminal",
  "blocked-auth",
];

const SETTLED_STATUSES: PendingSale["status"][] = ["synced", "synced-with-discrepancy"];

/**
 * Count + expandable list of this cashier's queued sales, with status chips
 * and a manual retry/discard for anything that needs a human. Presentational
 * only - the queue state and actions come from useOfflineSaleQueue, called
 * once in DashboardShell (never here) so there's only one active sync-engine
 * subscription per page.
 */
export function PendingSyncIndicator({
  pendingSales,
  onRetry,
  onCancel,
}: {
  pendingSales: PendingSale[];
  onRetry: (clientOrderId: string) => void;
  onCancel: (clientOrderId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (pendingSales.length === 0) return null;

  const unsettled = pendingSales.filter((sale) => !SETTLED_STATUSES.includes(sale.status));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
          unsettled.length > 0
            ? "bg-[var(--sidebar-soft)] text-[var(--sidebar)]"
            : "bg-[var(--brand-green-soft)] text-[var(--brand-green-dark)]",
        )}
      >
        <CloudUpload className="h-3.5 w-3.5" />
        {unsettled.length > 0
          ? `${unsettled.length} pending sale${unsettled.length === 1 ? "" : "s"}`
          : "All synced"}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white p-3 shadow-modal">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-sm font-semibold text-[var(--ink)]">Offline sales</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-[var(--ink-muted)]" />
              </button>
            </div>
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {pendingSales
                .slice()
                .sort((a, b) => b.queuedAt - a.queuedAt)
                .map((sale) => (
                  <li
                    key={sale.clientOrderId}
                    className="rounded-xl border border-black/5 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--ink)]">
                        {formatPeso(sale.clientSnapshot.total)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          SETTLED_STATUSES.includes(sale.status)
                            ? "bg-[var(--brand-green-soft)] text-[var(--brand-green-dark)]"
                            : sale.status === "failed-terminal" || sale.status === "blocked-auth"
                              ? "bg-danger-bg text-danger-text"
                              : "bg-[var(--sidebar-soft)] text-[var(--sidebar)]",
                        )}
                      >
                        {STATUS_LABEL[sale.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {sale.clientSnapshot.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </p>
                    {sale.lastError && (
                      <p className="mt-1 text-xs text-danger-text">{sale.lastError.message}</p>
                    )}
                    {RETRYABLE_STATUSES.includes(sale.status) && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onRetry(sale.clientOrderId)}
                          className="flex items-center gap-1 rounded-full bg-[var(--sidebar-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--sidebar)]"
                        >
                          <RotateCw className="h-3 w-3" />
                          Retry
                        </button>
                        {sale.status === "failed-terminal" && (
                          <button
                            type="button"
                            onClick={() => onCancel(sale.clientOrderId)}
                            className="rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--ink-muted)]"
                          >
                            Discard
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
