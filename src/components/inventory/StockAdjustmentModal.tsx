"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/format";
import {
  recordDamagedStock,
  recordExpiredStock,
  removeStock,
  restockProduct,
  setStock,
} from "@/lib/inventory";
import type { Product } from "@/types";

type AdjustmentType = "add" | "remove" | "set";
type RemovalReason = "removed" | "damaged" | "expired";

const TYPES: Array<{ id: AdjustmentType; label: string }> = [
  { id: "add", label: "(+) Add Stock" },
  { id: "remove", label: "(−) Remove Stock" },
  { id: "set", label: "(=) Set Stock" },
];

const REMOVAL_REASONS: Array<{ id: RemovalReason; label: string }> = [
  { id: "removed", label: "Manual removal" },
  { id: "damaged", label: "Damaged" },
  { id: "expired", label: "Expired" },
];

export function StockAdjustmentModal({
  product,
  currentStock,
  onClose,
  onSaved,
}: {
  product: Product;
  currentStock: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<AdjustmentType>("add");
  const [removalReason, setRemovalReason] = useState<RemovalReason>("removed");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsedQuantity = Number(quantity);
  const validQuantity =
    quantity.trim() !== "" && Number.isFinite(parsedQuantity) && parsedQuantity >= 0;

  const previewStock = (() => {
    if (!validQuantity) return currentStock;
    if (type === "add") return currentStock + parsedQuantity;
    if (type === "remove") return Math.max(0, currentStock - parsedQuantity);
    return parsedQuantity;
  })();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validQuantity) {
      setError("Enter a valid quantity.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }

    const trimmedReason = reason.trim();
    if (type === "add") {
      restockProduct(product.id, parsedQuantity, trimmedReason);
    } else if (type === "remove") {
      if (removalReason === "damaged") {
        recordDamagedStock(product.id, parsedQuantity, trimmedReason);
      } else if (removalReason === "expired") {
        recordExpiredStock(product.id, parsedQuantity, trimmedReason);
      } else {
        removeStock(product.id, parsedQuantity, trimmedReason);
      }
    } else {
      setStock(product.id, parsedQuantity, trimmedReason);
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-modal bg-[var(--cream)] shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-title"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2
            id="adjust-title"
            className="font-display text-lg font-bold text-[var(--ink)]"
          >
            Adjust Inventory
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <p className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {error}
            </p>
          )}

          <div>
            <p className="text-sm font-medium text-[var(--ink-muted)]">Product</p>
            <p className="text-base font-semibold text-[var(--ink)]">{product.name}</p>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Current Stock
            </p>
            <p className="mt-1 text-xl font-bold text-[var(--ink)]">{currentStock}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--ink-muted)]">Adjustment Type</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "rounded-2xl border px-2 py-2.5 text-xs font-semibold transition",
                    type === t.id
                      ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)] text-[var(--brand-green-dark)]"
                      : "border-black/10 bg-white text-[var(--ink)]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {type === "remove" && (
            <div>
              <p className="text-sm font-medium text-[var(--ink-muted)]">Removal Reason</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {REMOVAL_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRemovalReason(r.id)}
                    className={cn(
                      "rounded-2xl border px-2 py-2.5 text-xs font-semibold transition",
                      removalReason === r.id
                        ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)] text-[var(--brand-green-dark)]"
                        : "border-black/10 bg-white text-[var(--ink)]",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">Quantity</span>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
              className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              placeholder="0"
              required
            />
          </label>

          {validQuantity && (
            <p className="text-sm text-[var(--ink-muted)]">
              New stock will be{" "}
              <span className="font-semibold text-[var(--ink)]">{previewStock}</span>
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">Reason</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New delivery, stock count correction"
              className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              required
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Adjustment</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
