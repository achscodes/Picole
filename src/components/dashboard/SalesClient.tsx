"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LineChart } from "@/components/dashboard/LineChart";
import { filterOrdersByPeriod, getSalesByDay } from "@/lib/dashboard";
import { formatPeso, cn } from "@/lib/format";
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
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              period === p
                ? "bg-[var(--brand-green)] text-white"
                : "border border-black/10 bg-white text-[var(--ink)]",
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Sales" value={formatPeso(totalSales)} />
        <StatCard label="Orders" value={completed.length} />
        <StatCard label="Cash Sales" value={formatPeso(cashSales)} />
      </div>

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
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

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {completed.length === 0 ? (
          <EmptyState title="No sales recorded" />
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
              {completed.map((order) => (
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
