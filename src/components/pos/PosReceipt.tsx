"use client";

import Image from "next/image";
import { CloudUpload, PartyPopper, Printer } from "lucide-react";
import type { Order } from "@/types";
import { BRAND } from "@/data/catalog";
import { Button } from "@/components/ui/Button";
import { formatPeso } from "@/lib/format";

export function PosReceipt({
  order,
  queued,
  onNewOrder,
  onClose,
}: {
  order: Order;
  /** True when this sale couldn't reach the server and was queued locally
   * instead (src/lib/offline/sync-engine.ts) - it'll sync automatically once
   * connectivity returns. The transaction number shown is provisional. */
  queued?: boolean;
  onNewOrder?: () => void;
  onClose?: () => void;
}) {
  const createdAt = new Date(order.createdAt);
  const dateLabel = createdAt.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = createdAt.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--ink)]/40 p-4 sm:items-center print:bg-white print:p-0">
      <div
        id="pos-receipt"
        className="w-full max-w-sm rounded-modal bg-white p-6 shadow-modal print:rounded-none print:shadow-none"
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            width={56}
            height={56}
            className="h-12 w-auto object-contain"
          />
          <h1 className="mt-3 font-display text-lg font-bold text-[var(--ink)]">
            {BRAND.name.toUpperCase()} HEALTHY ICE POPS
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-green-dark)]">
            <PartyPopper className="h-4 w-4" />
            Sale Completed
          </p>
        </div>

        {queued && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--sidebar-soft)] px-4 py-3 text-sm text-[var(--sidebar)] print:hidden">
            <CloudUpload className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              You&apos;re offline right now - this sale is recorded and will sync
              automatically once you&apos;re back online.
            </span>
          </div>
        )}

        <div className="mt-4 space-y-1 border-y border-dashed border-black/15 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">Transaction #</span>
            <span className="font-bold text-[var(--ink)]">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">Date</span>
            <span className="text-[var(--ink)]">{dateLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">Time</span>
            <span className="text-[var(--ink)]">{timeLabel}</span>
          </div>
          {order.pickupName && (
            <div className="flex justify-between">
              <span className="text-[var(--ink-muted)]">Customer</span>
              <span className="text-[var(--ink)]">{order.pickupName}</span>
            </div>
          )}
        </div>

        <ul className="mt-3 space-y-1.5 border-b border-dashed border-black/15 pb-3 text-sm">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span className="text-[var(--ink)]">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium text-[var(--ink)]">
                {formatPeso(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-1 text-sm">
          {order.discountAmount != null && order.discountAmount > 0 && (
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>Subtotal</span>
              <span>{formatPeso(order.subtotalBeforeDiscount ?? order.totalAmount)}</span>
            </div>
          )}
          {order.discountAmount != null && order.discountAmount > 0 && (
            <div className="flex justify-between text-[var(--brand-green-dark)]">
              <span>Discount</span>
              <span>-{formatPeso(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-[var(--ink)]">
            <span>TOTAL</span>
            <span>{formatPeso(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-[var(--ink-muted)]">
            <span>Payment</span>
            <span className="uppercase">
              {order.paymentMethod === "cash" ? "Cash" : "E-Wallet"}
            </span>
          </div>
          {order.cashReceived != null && (
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>Cash Received</span>
              <span>{formatPeso(order.cashReceived)}</span>
            </div>
          )}
          {order.expectedChange != null && (
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>Change</span>
              <span>{formatPeso(order.expectedChange)}</span>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-sm font-semibold text-[var(--brand-green-dark)]">
          Thank you!
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          {onNewOrder && <Button onClick={onNewOrder}>New Order</Button>}
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
