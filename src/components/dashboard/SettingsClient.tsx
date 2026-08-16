"use client";

import { useEffect, useState } from "react";
import { Download, Printer, QrCode } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/data/catalog";
import { resetDemoOrders } from "@/lib/orders";
import { resetInventory } from "@/lib/inventory";
import { resetProductStore } from "@/lib/product-store";

export function SettingsClient() {
  const [menuUrl, setMenuUrl] = useState("");

  useEffect(() => {
    setMenuUrl(window.location.origin);
  }, []);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Stall QR code and demo access details."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[var(--brand-green)]" />
            <h2 className="font-display text-base font-bold text-[var(--ink)]">
              Picolé Ordering QR Code
            </h2>
          </div>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Print this and display it at the stall. Scanning opens the customer
            menu.
          </p>

          <div className="mt-6 flex flex-col items-center rounded-2xl bg-[var(--cream-strong)] p-6">
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
              <QrCode className="h-32 w-32 text-[var(--ink)]" strokeWidth={1} />
            </div>
            <p className="mt-4 break-all text-center text-xs text-[var(--ink-muted)]">
              {menuUrl}
            </p>
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              Menu URL
            </span>
            <input
              readOnly
              value={menuUrl}
              className="mt-1.5 w-full rounded-2xl border border-black/10 bg-[var(--cream)] px-4 py-3 text-sm"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
            <Button variant="secondary">
              <Printer className="h-4 w-4" />
              Print QR Code
            </Button>
          </div>
        </div>

        <div className="space-y-6">
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
              Demo Admin Access
            </h2>
            <p className="mt-2 text-sm text-[var(--brand-green-dark)]">
              Email <strong>admin@picole.com</strong> · Password{" "}
              <strong>admin123</strong>
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
      </div>
    </>
  );
}
