"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wallet, Receipt, ShoppingBag, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { getDashboardStats, formatShortTime } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";

export function StaffDashboardClient() {
  const [stats, setStats] = useState(getDashboardStats());

  useEffect(() => {
    function refresh() {
      setStats(getDashboardStats());
    }
    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Today at the Picolé stall."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={formatPeso(stats.todaySales)}
          icon={Wallet}
        />
        <StatCard
          label="Transactions"
          value={stats.todayTransactions}
          icon={Receipt}
        />
        <StatCard
          label="Avg. Sale"
          value={formatPeso(stats.averageSale)}
          icon={ShoppingBag}
        />
        <StatCard
          label="Products Available"
          value={stats.productsAvailable}
          icon={Package}
        />
      </div>

      <div className="mt-6 rounded-card bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Recent Transactions
          </h2>
          <Link
            href="/staff/transactions"
            className="text-sm font-medium text-[var(--brand-green)]"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {stats.recentTransactions.length === 0 ? (
            <EmptyState
              title="No Transactions Yet"
              description="Completed POS sales will appear here."
            />
          ) : (
            stats.recentTransactions.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""} ·{" "}
                    {formatShortTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--ink)]">
                    {formatPeso(order.totalAmount)}
                  </p>
                  <Badge tone="muted" className="mt-1">
                    {order.paymentMethod === "cash" ? "Cash" : "E-Wallet"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
