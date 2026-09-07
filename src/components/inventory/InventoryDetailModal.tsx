"use client";

import { useEffect, useState } from "react";
import { X, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { RestockModal } from "@/components/inventory/RestockModal";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import {
  getInventoryItemAction,
  getMovements,
  setAlertAt,
} from "@/lib/actions/inventory";
import { getStockStatus, type InventoryMovement, type InventoryMovementType } from "@/lib/inventory";
import { formatShortDate, formatShortTime } from "@/lib/dashboard";
import { cn } from "@/lib/format";
import type { InventoryItem } from "@/lib/inventory";
import type { Product } from "@/types";

const STATUS_BADGE = {
  "in-stock": { tone: "success" as const, label: "In Stock" },
  "low-stock": { tone: "warm" as const, label: "Low Stock" },
  "out-of-stock": { tone: "danger" as const, label: "Out of Stock" },
};

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  added: "Added",
  removed: "Removed",
  adjusted: "Adjusted",
  sale: "Sold",
  damaged: "Damaged",
  expired: "Expired",
};

export function InventoryDetailModal({
  product,
  onClose,
  onChanged,
}: {
  product: Product;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [item, setItem] = useState<InventoryItem | undefined>(undefined);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [thresholdInput, setThresholdInput] = useState("");
  const [openModal, setOpenModal] = useState<"restock" | "adjust" | null>(null);

  async function refresh() {
    const [next, recentMovements] = await Promise.all([
      getInventoryItemAction(product.id),
      getMovements({ productId: product.id, limit: 5 }),
    ]);
    setItem(next);
    if (next) setThresholdInput(String(next.alertAt));
    setMovements(recentMovements);
    onChanged();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetches inventory detail when the viewed product changes
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !openModal) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, openModal]);

  if (!item) return null;
  const status = getStockStatus(item);
  const badge = STATUS_BADGE[status];

  async function saveThreshold() {
    const value = Number(thresholdInput);
    if (!Number.isFinite(value) || value < 0) return;
    await setAlertAt(product.id, value);
    refresh();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-modal bg-[var(--cream)] shadow-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inventory-detail-title"
        >
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2
              id="inventory-detail-title"
              className="font-display text-lg font-bold text-[var(--ink)]"
            >
              {product.name}
            </h2>
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Current Stock
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{item.stock}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Status
                </p>
                <Badge tone={badge.tone} className="mt-2">
                  {badge.label}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Low Stock Threshold
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  onBlur={saveThreshold}
                  className="w-24 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
                />
                <p className="text-xs text-[var(--ink-muted)]">
                  Becomes &quot;Low Stock&quot; at or below this count.
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--ink-muted)]">
              Last stock update: {formatShortDate(item.updatedAt)} ·{" "}
              {formatShortTime(item.updatedAt)}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setOpenModal("restock")}>
                <PackagePlus className="h-4 w-4" />
                Restock
              </Button>
              <Button variant="secondary" onClick={() => setOpenModal("adjust")}>
                <SlidersHorizontal className="h-4 w-4" />
                Adjust Stock
              </Button>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Recent Movements
              </p>
              <div className="mt-2 space-y-2">
                {movements.length === 0 ? (
                  <p className="text-sm text-[var(--ink-muted)]">
                    No movements recorded yet.
                  </p>
                ) : (
                  movements.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--ink)]">
                          {TYPE_LABELS[m.movementType]} · {m.reason}
                        </p>
                        <p className="text-xs text-[var(--ink-muted)]">
                          {formatShortDate(m.createdAt)} · {m.userName}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-semibold",
                          m.quantity >= 0
                            ? "text-[var(--brand-green-dark)]"
                            : "text-danger-text",
                        )}
                      >
                        {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {openModal === "restock" && (
        <RestockModal
          product={product}
          currentStock={item.stock}
          onClose={() => setOpenModal(null)}
          onSaved={refresh}
        />
      )}
      {openModal === "adjust" && (
        <StockAdjustmentModal
          product={product}
          currentStock={item.stock}
          onClose={() => setOpenModal(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
