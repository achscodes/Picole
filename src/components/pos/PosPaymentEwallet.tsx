"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPeso } from "@/lib/format";

export function PosPaymentEwallet({
  totalDue,
  requiresIdVerification,
  submitting,
  onComplete,
}: {
  totalDue: number;
  requiresIdVerification: boolean;
  submitting: boolean;
  onComplete: (discountIdNumber?: string) => void;
}) {
  const [received, setReceived] = useState(false);
  const [discountIdNumber, setDiscountIdNumber] = useState("");
  const idOk = !requiresIdVerification || discountIdNumber.trim() !== "";

  return (
    <section className="rounded-2xl border border-black/10 bg-[var(--cream)] p-4">
      <h3 className="text-sm font-semibold text-[var(--ink)]">E-Wallet Payment</h3>

      <div className="mt-3 space-y-1 text-sm">
        <p className="text-[var(--ink-muted)]">Amount Due</p>
        <p className="text-2xl font-bold text-[var(--ink)]">{formatPeso(totalDue)}</p>
      </div>

      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        Ask the customer to scan the merchant GCash QR at the counter, then confirm
        the payment before marking it as received.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[var(--brand-green)]/40 bg-white p-3">
        <QrCode className="h-12 w-12 shrink-0 text-[var(--brand-green)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Merchant QR payment</p>
          <p className="text-xs text-[var(--ink-muted)]">Scan the configured QR displayed at the counter.</p>
        </div>
      </div>

      {requiresIdVerification && (
        <label className="mt-4 block">
          <span className="text-sm font-medium text-[var(--ink)]">Customer ID Number</span>
          <input
            value={discountIdNumber}
            onChange={(e) => setDiscountIdNumber(e.target.value)}
            placeholder="e.g. PWD-123456789"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </label>
      )}

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--ink)]">Status:</span>
        <Badge tone={received ? "success" : "warm"}>
          {received ? "Payment Received" : "Payment Pending"}
        </Badge>
      </div>

      {!received ? (
        <Button fullWidth className="mt-4" disabled={!idOk} onClick={() => setReceived(true)}>
          Mark Payment as Received
        </Button>
      ) : (
        <Button
          fullWidth
          className="mt-4"
          disabled={submitting}
          onClick={() => onComplete(requiresIdVerification ? discountIdNumber : undefined)}
        >
          {submitting ? "Completing…" : "Complete Transaction"}
        </Button>
      )}
    </section>
  );
}
