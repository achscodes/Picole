"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Wallet, Receipt, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesTrendCard } from "@/components/dashboard/SalesTrendCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { listStaffAccounts } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { formatPeso } from "@/lib/format";

export function AdminDashboardClient() {
  const [stats, setStats] = useState(getDashboardStats());
  const pendingStaff = useMemo(
    () => listStaffAccounts("pending").length,
    [stats],
  );

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
              Pending Staff Approvals{pendingStaff > 0 ? ` (${pendingStaff})` : ""}
            </h2>
            <Link
              href="/admin/staff-management"
              className="text-sm font-medium text-[var(--brand-green)]"
            >
              Manage staff
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {listStaffAccounts("pending").length === 0 ? (
              <EmptyState
                title="No Pending Approvals"
                description="New staff registrations will appear here for review."
              />
            ) : (
              listStaffAccounts("pending")
                .slice(0, 5)
                .map((staff) => (
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
