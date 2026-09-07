"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterPill } from "@/components/ui/FilterPill";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteStaffAccount, updateStaffStatus } from "@/lib/actions/staff";
import type { StaffAccount, StaffStatus } from "@/types/auth";

const TABS: Array<{ key: StaffStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export function AdminStaffManagementClient({
  initialStaff,
}: {
  initialStaff: StaffAccount[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<StaffStatus | "all">("pending");
  const [accountToDelete, setAccountToDelete] = useState<StaffAccount | null>(null);
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () => (tab === "all" ? initialStaff : initialStaff.filter((s) => s.status === tab)),
    [initialStaff, tab],
  );

  return (
    <>
      <PageHeader
        title="Staff Management"
        subtitle="Review and approve staff account registrations."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <FilterPill
            key={t.key}
            active={tab === t.key}
            onSelect={() => setTab(t.key)}
          >
            {t.label}
          </FilterPill>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState
            title="No staff accounts"
            description={
              tab === "pending"
                ? "No pending staff registrations at the moment."
                : "No staff accounts in this category."
            }
          />
        ) : (
          filtered.map((account) => (
            <article
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-white p-5 shadow-card"
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
                        startTransition(async () => {
                          await updateStaffStatus(account.id, "approved");
                          router.refresh();
                          showToast(`${account.name} was approved.`);
                        });
                      }}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        startTransition(async () => {
                          await updateStaffStatus(account.id, "rejected");
                          router.refresh();
                          showToast(`${account.name} was rejected.`);
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  aria-label={`Delete staff account for ${account.email}`}
                  title="Delete staff account"
                  onClick={() => setAccountToDelete(account)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmDialog
        open={accountToDelete !== null}
        title="Delete staff account?"
        message={`This will permanently remove the account for ${accountToDelete?.email ?? "this staff member"}.`}
        confirmLabel="Delete account"
        tone="danger"
        onCancel={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (!accountToDelete) return;
          const name = accountToDelete.name;
          const id = accountToDelete.id;
          setAccountToDelete(null);
          startTransition(async () => {
            await deleteStaffAccount(id);
            router.refresh();
            showToast(`${name}'s account was deleted.`);
          });
        }}
      />
    </>
  );
}
