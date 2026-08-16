"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, History as HistoryIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BrandImage } from "@/components/ui/BrandImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterPill } from "@/components/ui/FilterPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { InventoryAlerts } from "@/components/inventory/InventoryAlerts";
import { InventoryDetailModal } from "@/components/inventory/InventoryDetailModal";
import { getCategoryById, getFlavorCategories } from "@/data/catalog";
import { listProducts } from "@/lib/product-store";
import {
  getInventoryOverview,
  getStockStatus,
  listInventory,
  type InventoryItem,
  type StockStatus,
} from "@/lib/inventory";
import { formatShortDate } from "@/lib/dashboard";
import type { Product } from "@/types";

const STATUS_FILTERS: Array<{ key: StockStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "in-stock", label: "In Stock" },
  { key: "low-stock", label: "Low Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
];

const STATUS_BADGE: Record<
  StockStatus,
  { tone: "success" | "warm" | "danger"; label: string }
> = {
  "in-stock": { tone: "success", label: "In Stock" },
  "low-stock": { tone: "warm", label: "Low Stock" },
  "out-of-stock": { tone: "danger", label: "Out of Stock" },
};

type Row = { item: InventoryItem; product: Product; status: StockStatus };

export function InventoryManagementClient({ historyHref }: { historyHref: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [managingProductId, setManagingProductId] = useState<string | null>(null);

  function refresh() {
    setProducts(listProducts());
    setItems(listInventory());
  }

  useEffect(() => {
    refresh();
  }, []);

  function getProduct(productId: string) {
    return products.find((p) => p.id === productId);
  }

  const overview = useMemo(
    () => getInventoryOverview(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, products],
  );
  const categories = getFlavorCategories();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .map((item): Row | null => {
        const product = getProduct(item.productId);
        if (!product) return null;
        return { item, product, status: getStockStatus(item) };
      })
      .filter((r): r is Row => Boolean(r))
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (categoryFilter !== "all" && r.product.categoryId !== categoryFilter) {
          return false;
        }
        if (!q) return true;
        const category = getCategoryById(r.product.categoryId);
        return (
          r.product.name.toLowerCase().includes(q) ||
          category?.name.toLowerCase().includes(q) ||
          r.product.id.toLowerCase().includes(q)
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, products, search, statusFilter, categoryFilter]);

  const managingProduct = managingProductId ? getProduct(managingProductId) : null;

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels, restock, and review inventory alerts."
        action={
          <Link href={historyHref}>
            <Button variant="secondary">
              <HistoryIcon className="h-4 w-4" />
              View History
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={overview.totalProducts} />
        <StatCard label="In Stock" value={overview.inStock} />
        <StatCard
          label="Low Stock"
          value={overview.lowStock}
          className={overview.lowStock > 0 ? "text-[#8A5A00]" : undefined}
        />
        <StatCard
          label="Out of Stock"
          value={overview.outOfStock}
          className={overview.outOfStock > 0 ? "text-[var(--brand-red)]" : undefined}
        />
      </div>

      <InventoryAlerts items={items} getProduct={getProduct} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="search"
            placeholder="Search by name, category, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <FilterPill
            key={s.key}
            active={statusFilter === s.key}
            onSelect={() => setStatusFilter(s.key)}
          >
            {s.label}
          </FilterPill>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try a different search term or filter."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-card bg-white shadow-card sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Current Stock</th>
                    <th className="px-5 py-4 font-semibold">Stock Status</th>
                    <th className="px-5 py-4 font-semibold">Last Updated</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ item, product, status }) => {
                    const category = getCategoryById(product.categoryId);
                    const badge = STATUS_BADGE[status];
                    return (
                      <tr key={product.id} className="border-b border-black/5 last:border-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <BrandImage
                              src={product.image}
                              alt=""
                              variant="thumb"
                              className="bg-[var(--cream-strong)]"
                            />
                            <p className="font-semibold text-[var(--ink)]">
                              {product.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--ink-muted)]">
                          {category?.name ?? product.categoryId}
                        </td>
                        <td className="px-5 py-4 font-medium text-[var(--ink)]">
                          {item.stock}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </td>
                        <td className="px-5 py-4 text-[var(--ink-muted)]">
                          {formatShortDate(item.updatedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setManagingProductId(product.id)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {rows.map(({ item, product, status }) => {
              const category = getCategoryById(product.categoryId);
              const badge = STATUS_BADGE[status];
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-card bg-white p-4 shadow-card"
                >
                  <BrandImage
                    src={product.image}
                    alt=""
                    variant="cart"
                    className="bg-[var(--cream-strong)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {category?.name ?? product.categoryId} · Stock {item.stock}
                    </p>
                    <Badge tone={badge.tone} className="mt-2">
                      {badge.label}
                    </Badge>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setManagingProductId(product.id)}
                  >
                    Manage
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {managingProduct && (
        <InventoryDetailModal
          product={managingProduct}
          onClose={() => setManagingProductId(null)}
          onChanged={refresh}
        />
      )}
    </>
  );
}
