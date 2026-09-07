"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, Wallet, Receipt, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesTrendCard } from "@/components/dashboard/SalesTrendCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { getDashboardStats, getPendingStaffSummary } from "@/lib/actions/dashboard";
import { formatPeso } from "@/lib/format";
import type { StaffAccount } from "@/types/auth";

const EMPTY_STATS = {
  todaySales: 0,
  todayTransactions: 0,
  averageSale: 0,
  productsAvailable: 0,
  productsSoldOut: 0,
  recentTransactions: [] as Awaited<ReturnType<typeof getDashboardStats>>["recentTransactions"],
};

export function AdminDashboardClient() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pendingStaff, setPendingStaff] = useState<{
    count: number;
    preview: StaffAccount[];
  }>({ count: 0, preview: [] });

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const [nextStats, nextPending] = await Promise.all([
        getDashboardStats(),
        getPendingStaffSummary(),
      ]);
      if (!cancelled) {
        setStats(nextStats);
        setPendingStaff(nextPending);
      }
    }
    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Today's overview of stall operations."
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SalesTrendCard days={7} />

        <div className="rounded-card bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Pending Staff Approvals
              {pendingStaff.count > 0 ? ` (${pendingStaff.count})` : ""}
            </h2>
            <Link
              href="/admin/staff-management"
              className="text-sm font-medium text-[var(--brand-green)]"
            >
              Manage staff
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {pendingStaff.preview.length === 0 ? (
              <EmptyState
                title="No Pending Approvals"
                description="New staff registrations will appear here for review."
              />
            ) : (
              pendingStaff.preview.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {staff.name}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {staff.email}
                    </p>
                  </div>
                  <Badge tone="warm">Pending</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
