"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BrandImage } from "@/components/ui/BrandImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listProducts } from "@/lib/product-store";
import {
  getInventorySummary,
  listInventory,
  restockProduct,
  setAlertAt,
  setStock,
  type InventoryItem,
} from "@/lib/inventory";
import { getStockValue } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";

export function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [needsRestockOnly, setNeedsRestockOnly] = useState(false);

  function refresh() {
    setItems(listInventory());
  }

  useEffect(() => {
    refresh();
  }, []);

  const summary = useMemo(() => getInventorySummary(), [items]);
  const stockValue = useMemo(() => getStockValue(), [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const product = listProducts().find((p) => p.id === item.productId);
      if (!product) return false;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const needsRestock =
        item.stock === 0 || item.stock <= item.alertAt;
      if (needsRestockOnly && !needsRestock) return false;
      return matchesSearch;
    });
  }, [items, search, needsRestockOnly]);

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and restock alerts for all products."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units in Stock" value={summary.unitsInStock} />
        <StatCard label="Stock Value" value={formatPeso(stockValue)} />
        <StatCard label="Low Stock" value={summary.lowStock} />
        <StatCard
          label="Out of Stock"
          value={summary.outOfStock}
          className={summary.outOfStock > 0 ? "text-[var(--brand-red)]" : undefined}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        <Button
          variant={needsRestockOnly ? "primary" : "secondary"}
          onClick={() => setNeedsRestockOnly((v) => !v)}
        >
          <AlertTriangle className="h-4 w-4" />
          Needs restock
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const product = listProducts().find((p) => p.id === item.productId);
          if (!product) return null;
          const status =
            item.stock === 0
              ? "danger"
              : item.stock <= item.alertAt
                ? "warm"
                : "success";
          const statusLabel =
            item.stock === 0
              ? "Out of stock"
              : item.stock <= item.alertAt
                ? "Low stock"
                : "In stock";

          return (
            <div
              key={item.productId}
              className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-sm"
            >
              <BrandImage
                src={product.image}
                alt=""
                variant="cart"
                className="bg-[var(--cream-strong)]"
              />
              <div className="min-w-[140px] flex-1">
                <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {formatPeso(product.price)}
                </p>
                <Badge tone={status} className="mt-2">
                  {statusLabel}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--ink-muted)]">Stock</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStock(item.productId, item.stock - 1);
                      refresh();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[var(--cream-strong)] text-sm font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.stock}
                    onChange={(e) => {
                      setStock(item.productId, Number(e.target.value));
                      refresh();
                    }}
                    className="w-14 rounded-xl border border-black/10 px-2 py-1.5 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStock(item.productId, item.stock + 1);
                      refresh();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[var(--cream-strong)] text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--ink-muted)]">Alert at</span>
                  <input
                    type="number"
                    value={item.alertAt}
                    onChange={(e) => {
                      setAlertAt(item.productId, Number(e.target.value));
                      refresh();
                    }}
                    className="w-14 rounded-xl border border-black/10 px-2 py-1.5 text-center text-sm"
                  />
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    restockProduct(item.productId, 25);
                    refresh();
                  }}
                >
                  Restock +25
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
