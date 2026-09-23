"use client";

import Link from "next/link";
import { ShoppingBag, Wallet, Receipt, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesTrendCard } from "@/components/dashboard/SalesTrendCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { LastUpdatedNote } from "@/components/ui/LastUpdatedNote";
import { getDashboardStats, getPendingStaffSummary } from "@/lib/actions/dashboard";
import { formatPeso } from "@/lib/format";
import { usePolledAction } from "@/hooks/usePolledAction";
import type { StaffAccount } from "@/types/auth";

const EMPTY_STATS = {
  todaySales: 0,
  todayTransactions: 0,
  averageSale: 0,
  productsAvailable: 0,
  productsSoldOut: 0,
  recentTransactions: [] as Awaited<ReturnType<typeof getDashboardStats>>["recentTransactions"],
};

const EMPTY_PENDING_STAFF: { count: number; preview: StaffAccount[] } = {
  count: 0,
  preview: [],
};

async function fetchAdminOverview() {
  const [stats, pendingStaff] = await Promise.all([
    getDashboardStats(),
    getPendingStaffSummary(),
  ]);
  return { stats, pendingStaff };
}

export function AdminDashboardClient() {
  const { data, isStale, lastUpdatedAt } = usePolledAction(fetchAdminOverview, {
    cacheKey: "admin-dashboard-overview",
    initialData: { stats: EMPTY_STATS, pendingStaff: EMPTY_PENDING_STAFF },
  });
  const { stats, pendingStaff } = data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Today's overview of stall operations."
      />
      <LastUpdatedNote lastUpdatedAt={lastUpdatedAt} isStale={isStale} className="-mt-4 mb-4 text-xs text-[var(--ink-muted)]" />

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
