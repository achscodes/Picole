"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { Button } from "@/components/ui/Button";
import { getOrderById } from "@/lib/orders";
import { formatPeso } from "@/lib/format";
import type { Order } from "@/types";

export function ConfirmationClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    setOrder(getOrderById(orderId) ?? null);
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-dvh bg-[var(--cream)]">
        <CustomerHeader />
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p className="text-sm text-[var(--ink-muted)]">Order not found.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Back to Menu</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--cream)]">
      <CustomerHeader active="order" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <PartyPopper className="mx-auto h-8 w-8 text-[var(--brand-green)]" />
          <h1 className="mt-3 text-2xl font-bold text-[var(--ink)]">
            Order Confirmed!
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Thank you for ordering from Picolé!
          </p>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Your order number
          </p>
          <p className="text-3xl font-extrabold text-[var(--brand-green)]">
            #{order.orderNumber}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-[var(--ink)]">Order details</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPeso(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-black/5 pt-3 text-sm">
            {order.discountStatus === "pending" &&
              order.discountAmount != null &&
              order.discountAmount > 0 && (
                <>
                  <p>
                    Subtotal:{" "}
                    <strong>{formatPeso(order.subtotalBeforeDiscount ?? order.totalAmount)}</strong>
                  </p>
                  <p className="text-[var(--sidebar)]">
                    {order.customerType === "pwd" ? "PWD" : "Senior Citizen"}{" "}
                    discount ({formatPeso(order.discountAmount)}) pending staff
                    ID verification at the stall.
                  </p>
                </>
              )}
            {order.discountStatus === "verified" &&
              order.subtotalBeforeDiscount != null &&
              order.discountAmount != null &&
              order.discountAmount > 0 && (
                <>
                  <p>
                    Subtotal:{" "}
                    <strong>{formatPeso(order.subtotalBeforeDiscount)}</strong>
                  </p>
                  <p className="text-[var(--brand-green-dark)]">
                    {order.customerType === "pwd" ? "PWD" : "Senior Citizen"}{" "}
                    discount: <strong>-{formatPeso(order.discountAmount)}</strong>
                  </p>
                </>
              )}
            <p>
              Total: <strong>{formatPeso(order.totalAmount)}</strong>
            </p>
            <p>
              Payment:{" "}
              <strong>
                {order.paymentMethod === "cash" ? "Cash" : "E-Wallet"}
              </strong>
            </p>
            {order.cashReceived != null && (
              <p>
                Cash Provided: <strong>{formatPeso(order.cashReceived)}</strong>
              </p>
            )}
            {order.expectedChange != null && (
              <p>
                Expected Change:{" "}
                <strong>{formatPeso(order.expectedChange)}</strong>
              </p>
            )}
          </div>
        </section>

        <div className="grid gap-3">
          <Link href={`/order/${order.id}`}>
            <Button fullWidth>View Order Status</Button>
          </Link>
          <Link href="/">
            <Button fullWidth variant="secondary">
              Back to Menu
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
