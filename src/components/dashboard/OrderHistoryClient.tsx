"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { filterOrdersByPeriod, formatShortDate } from "@/lib/dashboard";
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

export function OrderHistoryClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    setOrders(listOrders());
  }, []);

  const completed = useMemo(() => {
    const filtered = filterOrdersByPeriod(orders, period);
    return filtered.filter((o) => o.orderStatus === "completed");
  }, [orders, period]);

  return (
    <>
      <PageHeader
        title="Order History"
        subtitle="Completed and picked-up orders."
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

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {completed.length === 0 ? (
          <EmptyState
            title="No completed orders"
            description="Completed orders will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Items</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-[var(--ink)]">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {order.pickupName ?? "Walk-in"}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {formatShortDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {order.items
                        .map((i) => `${i.name} ×${i.quantity}`)
                        .join(", ")}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {formatPeso(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4 capitalize text-[var(--ink-muted)]">
                      {order.paymentMethod === "cash" ? "Cash" : "E-Wallet"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="success">Completed</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
