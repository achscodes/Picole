"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPeso } from "@/lib/format";

const QUICK_CASH = [50, 100, 200, 500, 1000];

export function PosPaymentCash({
  totalDue,
  requiresIdVerification,
  submitting,
  onComplete,
}: {
  totalDue: number;
  requiresIdVerification: boolean;
  submitting: boolean;
  onComplete: (details: { cashReceived: number; discountIdNumber?: string }) => void;
}) {
  const [cashAmount, setCashAmount] = useState("");
  const [discountIdNumber, setDiscountIdNumber] = useState("");

  const cashProvided = Number(cashAmount);
  const hasAmount = cashAmount.trim() !== "" && Number.isFinite(cashProvided);
  const expectedChange = useMemo(
    () => (hasAmount ? Math.max(0, cashProvided - totalDue) : 0),
    [hasAmount, cashProvided, totalDue],
  );
  const insufficient = hasAmount && cashProvided < totalDue;
  const idOk = !requiresIdVerification || discountIdNumber.trim() !== "";
  const canComplete = hasAmount && cashProvided >= totalDue && idOk;

  return (
    <section className="rounded-2xl border border-black/10 bg-[var(--cream)] p-4">
      <h3 className="text-sm font-semibold text-[var(--ink)]">Cash Payment</h3>

      <div className="mt-3 space-y-1 text-sm">
        <p className="text-[var(--ink-muted)]">Total Due</p>
        <p className="text-2xl font-bold text-[var(--ink)]">{formatPeso(totalDue)}</p>
      </div>

      <label className="mt-4 block text-sm font-medium text-[var(--ink)]">
        Cash Received
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3">
        <span className="font-semibold">₱</span>
        <input
          inputMode="decimal"
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUICK_CASH.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setCashAmount(String(amount))}
            className="rounded-full border border-black/10 bg-white px-2 py-2 text-xs font-semibold text-[var(--ink)] transition active:scale-[0.98] hover:bg-[var(--cream-strong)]"
          >
            ₱{amount}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCashAmount(String(totalDue))}
          className="col-span-3 rounded-full bg-[var(--brand-green-soft)] px-2 py-2 text-xs font-semibold text-[var(--brand-green-dark)] transition active:scale-[0.98] sm:col-span-1"
        >
          Exact Amount
        </button>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        {insufficient ? (
          <div className="rounded-xl bg-danger-bg px-3 py-2 text-danger-text">
            <p className="font-semibold">Insufficient payment</p>
            <p className="text-xs">
              Additional {formatPeso(totalDue - cashProvided)} required
            </p>
          </div>
        ) : (
          <p className="text-lg font-bold text-[var(--brand-green)]">
            Change: {formatPeso(hasAmount ? expectedChange : 0)}
          </p>
        )}
      </div>

      {requiresIdVerification && (
        <label className="mt-4 block">
          <span className="text-sm font-medium text-[var(--ink)]">
            Customer ID Number
          </span>
          <input
            value={discountIdNumber}
            onChange={(e) => setDiscountIdNumber(e.target.value)}
            placeholder="e.g. PWD-123456789"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </label>
      )}

      <Button
        fullWidth
        className="mt-4"
        disabled={!canComplete || submitting}
        onClick={() =>
          onComplete({
            cashReceived: cashProvided,
            discountIdNumber: requiresIdVerification ? discountIdNumber : undefined,
          })
        }
      >
        {submitting ? "Completing…" : "Complete Sale"}
      </Button>
    </section>
  );
}
