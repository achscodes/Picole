"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { Button } from "@/components/ui/Button";
import { getOrderById, listOrders } from "@/lib/orders";
import { cn } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Order Received" },
  { key: "confirmed", label: "Order Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "completed", label: "Completed" },
];

function statusIndex(status: OrderStatus) {
  if (status === "cancelled") return -1;
  return STEPS.findIndex((s) => s.key === status);
}

export function OrderStatusClient({ orderId }: { orderId?: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [lookup, setLookup] = useState("");

  useEffect(() => {
    if (orderId) {
      setOrder(getOrderById(orderId) ?? null);
      return;
    }
    const latest = listOrders()[0];
    setOrder(latest ?? null);
  }, [orderId]);

  const idx = useMemo(
    () => (order ? statusIndex(order.orderStatus) : -1),
    [order],
  );

  return (
    <div className="min-h-dvh bg-[var(--cream)]">
      <CustomerHeader active="order" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">My Order</h1>

        {!orderId && (
          <form
            className="rounded-3xl bg-white p-4 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const found = getOrderById(lookup.trim());
              setOrder(found ?? null);
            }}
          >
            <label className="text-sm font-semibold">Find order by number</label>
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="PCL-1001"
              className="mt-2 w-full rounded-full border border-black/10 bg-[var(--cream)] px-4 py-3 text-sm outline-none"
            />
            <Button type="submit" className="mt-3" fullWidth>
              Track order
            </Button>
          </form>
        )}

        {!order ? (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-[var(--ink-muted)]">
              No order found yet. Place an order from the menu.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <>
            {order.orderStatus === "ready" && (
              <section className="rounded-3xl bg-[var(--brand-green-soft)] p-5 text-center">
                <h2 className="text-xl font-bold text-[var(--brand-green)]">
                  Your Picolé is Ready!
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Please proceed to the pickup area at the stall.
                </p>
              </section>
            )}

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Order
              </p>
              <p className="text-2xl font-bold text-[var(--brand-green)]">
                #{order.orderNumber}
              </p>

              <h2 className="mt-5 font-semibold text-[var(--ink)]">
                Order Status
              </h2>
              <ol className="mt-4 space-y-3">
                {STEPS.map((step, i) => {
                  const done = idx > i;
                  const current = idx === i;
                  return (
                    <li key={step.key} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2",
                          done || current
                            ? "border-[var(--brand-green)] bg-[var(--brand-green)]"
                            : "border-black/20",
                        )}
                      >
                        {(done || current) && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          done || current
                            ? "font-semibold text-[var(--ink)]"
                            : "text-[var(--ink-muted)]",
                        )}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
