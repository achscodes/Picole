"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/data/catalog";
import { resetDemoOrders } from "@/lib/orders";
import { resetInventory } from "@/lib/inventory";
import { resetProductStore } from "@/lib/product-store";

export function SettingsClient() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Stall details and demo access."
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

        <div className="rounded-card bg-[var(--brand-green-soft)] p-6">
          <h2 className="font-display text-base font-bold text-[var(--brand-green-dark)]">
            Demo Access
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-green-dark)]">
            Admin · Email <strong>admin@picole.com</strong> · Password{" "}
            <strong>admin123</strong>
          </p>
          <p className="mt-1 text-sm text-[var(--brand-green-dark)]">
            Staff · Email <strong>staff@picole.com</strong> · Password{" "}
            <strong>staff123</strong>
          </p>
          <p className="mt-1 text-xs text-[var(--brand-green-dark)]/70">
            For demonstration purposes only.
          </p>
        </div>

        <div className="rounded-card bg-white p-6 shadow-card">
          <h2 className="font-display text-base font-bold text-[var(--ink)]">
            Data
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Prototype data is stored on this device. Reset it to restore the
            sample menu and orders.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              if (window.confirm("Reset all demo orders and inventory?")) {
                resetDemoOrders();
                resetInventory();
                resetProductStore();
                window.location.reload();
              }
            }}
          >
            Reset demo data
          </Button>
        </div>
      </div>
    </>
  );
}
