"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPeso } from "@/lib/format";

export function PosPaymentEwallet({
  totalDue,
  submitting,
  onComplete,
}: {
  totalDue: number;
  submitting: boolean;
  onComplete: () => void;
}) {
  const [received, setReceived] = useState(false);

  return (
    <section className="rounded-2xl border border-black/10 bg-[var(--cream)] p-4">
      <h3 className="text-sm font-semibold text-[var(--ink)]">E-Wallet Payment</h3>

      <div className="mt-3 space-y-1 text-sm">
        <p className="text-[var(--ink-muted)]">Amount Due</p>
        <p className="text-2xl font-bold text-[var(--ink)]">{formatPeso(totalDue)}</p>
      </div>

      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        Provider is configurable (demo uses GCash manual verification). Confirm the
        customer&apos;s payment before marking it as received.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--ink)]">Status:</span>
        <Badge tone={received ? "success" : "warm"}>
          {received ? "Payment Received" : "Payment Pending"}
        </Badge>
      </div>

      {!received ? (
        <Button fullWidth className="mt-4" onClick={() => setReceived(true)}>
          Mark Payment as Received
        </Button>
      ) : (
        <Button fullWidth className="mt-4" disabled={submitting} onClick={onComplete}>
          {submitting ? "Completing…" : "Complete Transaction"}
        </Button>
      )}
    </section>
  );
}
