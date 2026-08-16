"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPill } from "@/components/ui/FilterPill";
import { LineChart } from "@/components/dashboard/LineChart";
import { filterOrdersByPeriod, getSalesByDay } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";
import { listOrders } from "@/lib/orders";
import type { Order } from "@/types";

const PERIODS = ["today", "week", "month", "all"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export function SalesClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("today");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setOrders(listOrders());
    const id = window.setInterval(() => setOrders(listOrders()), 3000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(
    () => filterOrdersByPeriod(orders, period),
    [orders, period],
  );

  const completed = filtered.filter((o) => o.orderStatus === "completed");
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

  const chart = useMemo(
    () =>
      getSalesByDay(14).map((d) => ({
        label: d.label,
        value: d.amount,
      })),
    [orders],
  );

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Recorded sales per period."
      />

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
          Daily sales (last 14 days)
        </h2>
        <div className="mt-4">
          <LineChart
            data={chart}
            valueFormatter={(v) =>
              v >= 1000 ? `₱${Math.round(v / 100) / 10}k` : `₱${v}`
            }
          />
        </div>
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
