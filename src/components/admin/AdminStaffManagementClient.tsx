"use client";

import { useEffect, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  deleteStaffAccount,
  listStaffAccounts,
  updateStaffStatus,
} from "@/lib/auth";
import type { StaffAccount, StaffStatus } from "@/types/auth";
import { cn } from "@/lib/format";

const TABS: Array<{ key: StaffStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export function AdminStaffManagementClient() {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [tab, setTab] = useState<StaffStatus | "all">("pending");

  function refresh() {
    setStaff(listStaffAccounts(tab === "all" ? undefined : tab));
  }

  useEffect(() => {
    refresh();
  }, [tab]);

  return (
    <>
      <PageHeader
        title="Staff Management"
        subtitle="Review and approve staff account registrations."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-[var(--brand-green)] text-white"
                : "border border-black/10 bg-white text-[var(--ink)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {staff.length === 0 ? (
          <EmptyState
            title="No staff accounts"
            description={
              tab === "pending"
                ? "No pending staff registrations at the moment."
                : "No staff accounts in this category."
            }
          />
        ) : (
          staff.map((account) => (
            <article
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-lg font-bold text-[var(--ink)]">
                  {account.name}
                </p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {account.email}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Registered{" "}
                  {new Date(account.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  tone={
                    account.status === "approved"
                      ? "success"
                      : account.status === "rejected"
                        ? "danger"
                        : "warm"
                  }
                >
                  {account.status}
                </Badge>

                {account.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        updateStaffStatus(account.id, "approved");
                        refresh();
                      }}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        updateStaffStatus(account.id, "rejected");
                        refresh();
                      }}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove staff account for ${account.email}?`,
                      )
                    ) {
                      deleteStaffAccount(account.id);
                      refresh();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
