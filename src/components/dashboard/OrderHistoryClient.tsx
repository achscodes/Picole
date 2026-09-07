"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPill } from "@/components/ui/FilterPill";
import { Badge } from "@/components/ui/Badge";
import { PosReceipt } from "@/components/pos/PosReceipt";
import { filterOrdersByPeriod, formatShortDate, formatShortTime } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";
import type { Order } from "@/types";

const PERIODS = ["today", "week", "month", "all"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export function OrderHistoryClient({ initialOrders }: { initialOrders: Order[] }) {
  const orders = initialOrders;
  const [period, setPeriod] = useState<Period>("today");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const completed = useMemo(() => {
    const filtered = filterOrdersByPeriod(orders, period);
    return filtered.filter((o) => o.orderStatus === "completed");
  }, [orders, period]);

  const visibleTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completed;
    return completed.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }, [completed, search]);

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Completed sales and pickups."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <FilterPill key={p} active={period === p} onSelect={() => setPeriod(p)}>
            {PERIOD_LABELS[p]}
          </FilterPill>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          type="search"
          placeholder="Search by order number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-green)]"
        />
      </div>

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        {visibleTransactions.length === 0 ? (
          <EmptyState
            title={search ? "No matching transactions" : "No completed orders"}
            description={
              search
                ? "Try a different order number."
                : period === "today"
                  ? "Today's completed orders will appear here."
                  : "Completed orders will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Items</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Cash Received</th>
                  <th className="px-5 py-4">Change</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-black/[0.02]"
                  >
                    <td className="px-5 py-4 font-medium text-[var(--ink)]">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {formatShortDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {formatShortTime(order.createdAt)}
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
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {order.cashReceived != null ? formatPeso(order.cashReceived) : "—"}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {order.expectedChange != null ? formatPeso(order.expectedChange) : "—"}
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

      {selectedOrder && (
        <PosReceipt order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
}
