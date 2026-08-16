"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Clock,
  ClipboardList,
  PackageCheck,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesTrendCard } from "@/components/dashboard/SalesTrendCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDashboardStats } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

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
        subtitle="Today at the Picolé stall — receive, prepare and hand off orders."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Today's Orders" value={stats.todayOrders} icon={ShoppingBag} />
        <StatCard label="Pending Orders" value={stats.pending} icon={Clock} />
        <StatCard label="Preparing" value={stats.preparing} icon={ClipboardList} />
        <StatCard label="Ready for Pickup" value={stats.ready} icon={PackageCheck} />
        <StatCard
          label="Today's Sales"
          value={formatPeso(stats.todaySales)}
          icon={Wallet}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SalesTrendCard days={7} />

        <div className="rounded-card bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Active Queue
            </h2>
            <Link
              href="/staff/orders"
              className="text-sm font-medium text-[var(--brand-green)]"
            >
              All orders
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {stats.activeQueue.length === 0 ? (
              <EmptyState
                title="No Orders Yet"
                description="Orders will appear here once customers place them."
              />
            ) : (
              stats.activeQueue.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge tone="brand">{order.orderStatus}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
