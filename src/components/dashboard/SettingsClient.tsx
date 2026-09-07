"use client";

import { useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { BRAND } from "@/data/catalog";
import { resetDemoData, seedDemoData } from "@/lib/actions/settings";

export function SettingsClient() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const { showToast } = useToast();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Stall details and sample data."
      />

      <div className="max-w-xl space-y-6">
        <div className="rounded-card bg-white p-6 shadow-card">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Stall Details
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Business", `${BRAND.name} ${BRAND.tagline}`],
              ["Pickup Location", BRAND.pickupLocation],
              ["E-Wallet", "GCash (manual verification)"],
              ["Currency", "PHP (₱)"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">{label}</dt>
                <dd className="text-right font-medium text-[var(--ink)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-card bg-white p-6 shadow-card">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Data
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Load 14 days of generated sample transactions to see the
            dashboards, sales, and inventory reports populated, or reset back
            to a clean slate.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setConfirmSeed(true)}>
              Load sample data
            </Button>
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>
              Reset demo data
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSeed}
        title="Load sample data?"
        message="This will replace current orders and inventory history with 14 days of generated sample transactions."
        confirmLabel="Load sample data"
        onCancel={() => setConfirmSeed(false)}
        onConfirm={async () => {
          setConfirmSeed(false);
          await seedDemoData();
          showToast("Sample data loaded.");
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="This will permanently clear all orders and inventory history, and reset every product's stock."
        confirmLabel="Reset data"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await resetDemoData();
          showToast("Demo data was reset.");
        }}
      />
    </>
  );
}
