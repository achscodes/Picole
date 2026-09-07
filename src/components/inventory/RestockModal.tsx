"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { restockProduct } from "@/lib/actions/inventory";
import type { Product } from "@/types";

export function RestockModal({
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
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("New supplier delivery");
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
    quantity.trim() !== "" && Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const newStock = currentStock + (validQuantity ? parsedQuantity : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validQuantity) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    await restockProduct(product.id, parsedQuantity, reason.trim());
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-sm rounded-modal bg-[var(--cream)] shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restock-title"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2
            id="restock-title"
            className="font-display text-lg font-bold text-[var(--ink)]"
          >
            Restock Product
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <p className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {error}
            </p>
          )}

          <p className="text-sm font-semibold text-[var(--ink)]">{product.name}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Current Stock
              </p>
              <p className="mt-1 text-xl font-bold text-[var(--ink)]">{currentStock}</p>
            </div>
            <div className="rounded-2xl bg-[var(--brand-green-soft)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-green-dark)]">
                New Stock
              </p>
              <p className="mt-1 text-xl font-bold text-[var(--brand-green-dark)]">
                {newStock}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              Quantity to Add
            </span>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
              className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              placeholder="e.g. 20"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">Reason</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              required
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Confirm Restock</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
