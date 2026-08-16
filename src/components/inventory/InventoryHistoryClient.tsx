"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { FilterPill } from "@/components/ui/FilterPill";
import {
  listMovements,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventory";
import { listProducts } from "@/lib/product-store";
import { formatShortDate, formatShortTime } from "@/lib/dashboard";
import { cn } from "@/lib/format";
import type { Product } from "@/types";

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  added: "Stock Added",
  removed: "Stock Removed",
  adjusted: "Adjustment",
  sale: "Sold",
  damaged: "Damaged",
  expired: "Expired",
};

const TYPE_TONES: Record<
  InventoryMovementType,
  "success" | "danger" | "warm" | "muted" | "brand"
> = {
  added: "success",
  removed: "warm",
  adjusted: "brand",
  sale: "muted",
  damaged: "danger",
  expired: "danger",
};

const TYPE_FILTERS: Array<{ key: InventoryMovementType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "added", label: "Added" },
  { key: "removed", label: "Removed" },
  { key: "adjusted", label: "Adjusted" },
  { key: "sale", label: "Sold" },
  { key: "damaged", label: "Damaged" },
  { key: "expired", label: "Expired" },
];

export function InventoryHistoryClient() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InventoryMovementType | "all">("all");

  useEffect(() => {
    setMovements(listMovements());
    setProducts(listProducts());
  }, []);

  function getProduct(productId: string) {
    return products.find((p) => p.id === productId);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((m) => {
      if (typeFilter !== "all" && m.movementType !== typeFilter) return false;
      if (!q) return true;
      const product = getProduct(m.productId);
      return (
        product?.name.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, products, search, typeFilter]);

  return (
    <>
      <PageHeader
        title="Inventory History"
        subtitle="Every stock movement, with who made it and why."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((t) => (
          <FilterPill
            key={t.key}
            active={typeFilter === t.key}
            onSelect={() => setTypeFilter(t.key)}
          >
            {t.label}
          </FilterPill>
        ))}
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          type="search"
          placeholder="Search product, reason, or staff…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-green)]"
        />
      </div>

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        {filtered.length === 0 ? (
          <EmptyState
            title="No movements yet"
            description="Stock changes will show up here as they happen."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Time</th>
                  <th className="px-5 py-4 font-semibold">Product</th>
                  <th className="px-5 py-4 font-semibold">Movement</th>
                  <th className="px-5 py-4 font-semibold">Qty</th>
                  <th className="px-5 py-4 font-semibold">Previous</th>
                  <th className="px-5 py-4 font-semibold">New</th>
                  <th className="px-5 py-4 font-semibold">Reason</th>
                  <th className="px-5 py-4 font-semibold">Staff</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const product = getProduct(m.productId);
                  return (
                    <tr key={m.id} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-4 text-[var(--ink-muted)]">
                        {formatShortDate(m.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-[var(--ink-muted)]">
                        {formatShortTime(m.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-medium text-[var(--ink)]">
                        {product?.name ?? m.productId}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={TYPE_TONES[m.movementType]}>
                          {TYPE_LABELS[m.movementType]}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          "px-5 py-4 font-semibold",
                          m.quantity >= 0
                            ? "text-[var(--brand-green-dark)]"
                            : "text-danger-text",
                        )}
                      >
                        {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-5 py-4 text-[var(--ink-muted)]">
                        {m.previousStock}
                      </td>
                      <td className="px-5 py-4 text-[var(--ink-muted)]">{m.newStock}</td>
                      <td className="px-5 py-4 text-[var(--ink-muted)]">{m.reason}</td>
                      <td className="px-5 py-4 text-[var(--ink-muted)]">{m.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
