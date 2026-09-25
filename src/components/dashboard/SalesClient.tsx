"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPill } from "@/components/ui/FilterPill";
import { LastUpdatedNote } from "@/components/ui/LastUpdatedNote";
import { LineChart } from "@/components/dashboard/LineChart";
import { filterOrdersByPeriod, formatChartDate } from "@/lib/dashboard";
import { getCategoryById } from "@/data/catalog";
import { formatPeso } from "@/lib/format";
import { getOrders } from "@/lib/actions/orders";
import { usePolledAction } from "@/hooks/usePolledAction";
import type { Order, Product } from "@/types";

const PERIODS = ["today", "week", "month", "all"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export function SalesClient({
  initialOrders,
  initialProducts,
}: {
  initialOrders: Order[];
  initialProducts: Product[];
}) {
  const [period, setPeriod] = useState<Period>("today");
  const [search, setSearch] = useState("");
  const {
    data: orders,
    isStale,
    lastUpdatedAt,
  } = usePolledAction(getOrders, {
    cacheKey: "sales-orders",
    initialData: initialOrders,
  });

  const filtered = useMemo(
    () => filterOrdersByPeriod(orders, period),
    [orders, period],
  );

  const completed = useMemo(
    () => filtered.filter((o) => o.orderStatus === "completed"),
    [filtered],
  );
  const totalSales = completed.reduce((s, o) => s + o.totalAmount, 0);
  const cashSales = completed
    .filter((o) => o.paymentMethod === "cash")
    .reduce((s, o) => s + o.totalAmount, 0);
  const ewalletSales = completed
    .filter((o) => o.paymentMethod === "ewallet")
    .reduce((s, o) => s + o.totalAmount, 0);
  const avgTransaction = completed.length ? totalSales / completed.length : 0;

  const searchQuery = search.trim().toLowerCase();
  const visibleTransactions = !searchQuery
    ? completed
    : completed.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchQuery) ||
          (o.pickupName?.toLowerCase().includes(searchQuery) ?? false),
      );

  const chart = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const order of completed) {
      const date = order.createdAt.slice(0, 10);
      byDate.set(date, (byDate.get(date) ?? 0) + order.totalAmount);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ label: formatChartDate(date), value }));
  }, [completed]);

  const { categorySales, flavorSales } = useMemo(() => {
    const products = new Map(initialProducts.map((product) => [product.id, product]));
    const categories = new Map<string, { name: string; units: number; revenue: number }>();
    const flavors = new Map<string, { name: string; category: string; units: number; revenue: number }>();

    for (const order of completed) {
      const beforeDiscount =
        order.subtotalBeforeDiscount ??
        order.items.reduce((sum, item) => sum + item.subtotal, 0);
      const revenueFactor = beforeDiscount > 0 ? order.totalAmount / beforeDiscount : 1;

      for (const item of order.items) {
        const product = products.get(item.productId);
        const categoryId = product?.categoryId ?? item.productId.split("-")[0];
        const categoryName = getCategoryById(categoryId)?.name ?? "Uncategorized";
        const revenue = item.subtotal * revenueFactor;

        const category = categories.get(categoryId) ?? {
          name: categoryName,
          units: 0,
          revenue: 0,
        };
        category.units += item.quantity;
        category.revenue += revenue;
        categories.set(categoryId, category);

        const flavor = flavors.get(item.productId) ?? {
          name: item.name,
          category: categoryName,
          units: 0,
          revenue: 0,
        };
        flavor.units += item.quantity;
        flavor.revenue += revenue;
        flavors.set(item.productId, flavor);
      }
    }

    const byRevenue = <T extends { revenue: number }>(a: T, b: T) =>
      b.revenue - a.revenue;
    return {
      categorySales: Array.from(categories.values()).sort(byRevenue),
      flavorSales: Array.from(flavors.values()).sort(byRevenue),
    };
  }, [completed, initialProducts]);

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Recorded sales per period."
      />
      <LastUpdatedNote lastUpdatedAt={lastUpdatedAt} isStale={isStale} className="-mt-4 mb-4 text-xs text-[var(--ink-muted)]" />

      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <FilterPill key={p} active={period === p} onSelect={() => setPeriod(p)}>
            {PERIOD_LABELS[p]}
          </FilterPill>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Sales" value={formatPeso(totalSales)} />
        <StatCard label="Orders" value={completed.length} />
        <StatCard label="Average Transaction" value={formatPeso(avgTransaction)} />
        <StatCard label="Cash Sales" value={formatPeso(cashSales)} />
        <StatCard label="E-Wallet Sales" value={formatPeso(ewalletSales)} />
      </div>

      <div className="mb-6 rounded-card bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          Sales trend ({PERIOD_LABELS[period].toLowerCase()})
        </h2>
        <div className="mt-4">
          <LineChart
            data={chart}
            valueFormat="peso"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <SalesBreakdown
          title="Sales by Category"
          nameLabel="Category"
          rows={categorySales}
        />
        <SalesBreakdown
          title="Sales by Flavor"
          nameLabel="Flavor"
          rows={flavorSales}
          showCategory
        />
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          type="search"
          placeholder="Search by order # or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-green)]"
        />
      </div>

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        {visibleTransactions.length === 0 ? (
          <EmptyState
            title={search ? "No matching transactions" : "No sales recorded"}
            description={search ? "Try a different order # or name." : undefined}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((order) => (
                <tr key={order.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-4 font-medium">{order.orderNumber}</td>
                  <td className="px-5 py-4 text-[var(--ink-muted)]">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 capitalize text-[var(--ink-muted)]">
                    {order.paymentMethod === "cash" ? "Cash" : "E-Wallet"}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {formatPeso(order.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function SalesBreakdown({
  title,
  nameLabel,
  rows,
  showCategory = false,
}: {
  title: string;
  nameLabel: string;
  rows: Array<{ name: string; category?: string; units: number; revenue: number }>;
  showCategory?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No sales for this period"
            description="Completed sales will appear in this breakdown."
          />
        </div>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="px-5 py-3">{nameLabel}</th>
                {showCategory && <th className="px-5 py-3">Category</th>}
                <th className="px-5 py-3 text-right">Units</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.category ?? "category"}-${row.name}`} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-[var(--ink)]">{row.name}</td>
                  {showCategory && (
                    <td className="px-5 py-3 text-[var(--ink-muted)]">{row.category}</td>
                  )}
                  <td className="px-5 py-3 text-right text-[var(--ink-muted)]">{row.units}</td>
                  <td className="px-5 py-3 text-right font-semibold text-[var(--brand-green)]">
                    {formatPeso(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
