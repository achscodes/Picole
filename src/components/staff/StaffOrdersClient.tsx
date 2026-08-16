"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FilterPill } from "@/components/ui/FilterPill";
import { listOrders, updateOrderStatus, verifyOrderDiscount } from "@/lib/orders";
import { formatPeso } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const NEXT: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> =
  {
    pending: { label: "Confirm Order", next: "confirmed" },
    confirmed: { label: "Start Preparing", next: "preparing" },
    preparing: { label: "Mark as Ready", next: "ready" },
    ready: { label: "Complete Order", next: "completed" },
  };

const FILTERS = [
  "active",
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "all",
] as const;

type Filter = (typeof FILTERS)[number];

function DiscountVerifyPanel({
  order,
  onVerified,
}: {
  order: Order;
  onVerified: () => void;
}) {
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState("");

  if (order.discountStatus !== "pending") {
    if (order.discountStatus === "verified" && order.discountIdNumber) {
      return (
        <div className="mt-4 rounded-2xl bg-[var(--sidebar-soft)] px-4 py-3 text-sm text-[var(--sidebar)]">
          <p className="font-semibold">Discount verified</p>
          <p className="mt-1 text-xs">
            ID No. {order.discountIdNumber} · Saved{" "}
            {formatPeso(order.discountAmount ?? 0)}
          </p>
        </div>
      );
    }
    return null;
  }

  const label =
    order.customerType === "pwd" ? "PWD" : "Senior Citizen";

  return (
    <div className="mt-4 rounded-2xl border border-[var(--sidebar-active)]/20 bg-[var(--sidebar-soft)]/50 p-4">
      <p className="text-sm font-semibold text-[var(--sidebar)]">
        {label} discount pending verification
      </p>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        Ask for their ID, enter the ID number, then verify to apply{" "}
        {formatPeso(order.discountAmount ?? 0)} off.
      </p>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          ID Number
        </span>
        <input
          value={idNumber}
          onChange={(e) => {
            setIdNumber(e.target.value);
            setError("");
          }}
          placeholder="e.g. PWD-123456789"
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--sidebar-active)]"
        />
      </label>
      {error && (
        <p className="mt-2 text-xs text-danger-text">{error}</p>
      )}
      <Button
        variant="staff"
        className="mt-3"
        onClick={() => {
          const result = verifyOrderDiscount(order.id, idNumber);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setIdNumber("");
          onVerified();
        }}
      >
        Verify Discount
      </Button>
    </div>
  );
}

export function StaffOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("active");

  function refresh() {
    setOrders(listOrders());
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 2000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "active") {
      return orders.filter(
        (o) =>
          o.orderStatus !== "completed" && o.orderStatus !== "cancelled",
      );
    }
    return orders.filter((o) => o.orderStatus === filter);
  }, [orders, filter]);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Receive → Confirm → Prepare → Ready → Complete"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <FilterPill
            key={f}
            active={filter === f}
            onSelect={() => setFilter(f)}
            className="capitalize"
          >
            {f === "active" ? "Active" : f}
          </FilterPill>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState
            title="No Orders Yet"
            description="Orders will appear here once customers place them."
          />
        ) : (
          filtered.map((order) => {
            const action = NEXT[order.orderStatus];
            return (
              <article
                key={order.id}
                className="rounded-card bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-[var(--ink)]">
                      #{order.orderNumber}
                    </p>
                    {order.pickupName && (
                      <p className="text-xs text-[var(--ink-muted)]">
                        Pickup: {order.pickupName}
                      </p>
                    )}
                    {order.discountStatus === "pending" && (
                      <Badge tone="warm" casing="normal" className="mt-2">
                        {order.customerType === "pwd" ? "PWD" : "Senior"} ·
                        discount pending
                      </Badge>
                    )}
                  </div>
                  <Badge
                    tone={
                      order.orderStatus === "cancelled"
                        ? "danger"
                        : order.orderStatus === "ready"
                          ? "success"
                          : "brand"
                    }
                  >
                    {order.orderStatus}
                  </Badge>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-[var(--ink)]">
                  {order.items.map((item) => (
                    <li key={item.productId}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
                  <p>
                    Total:{" "}
                    <strong className="text-[var(--ink)]">
                      {formatPeso(order.totalAmount)}
                    </strong>
                  </p>
                  {order.discountStatus === "pending" &&
                    order.discountAmount != null && (
                      <p className="text-[var(--sidebar)]">
                        Pending discount: -{formatPeso(order.discountAmount)}
                      </p>
                    )}
                  {order.discountStatus === "verified" &&
                    order.discountAmount != null && (
                      <p className="text-[var(--brand-green-dark)]">
                        Discount applied: -{formatPeso(order.discountAmount)}
                      </p>
                    )}
                  <p>
                    Payment:{" "}
                    {order.paymentMethod === "cash" ? "Cash" : "E-Wallet"}
                  </p>
                  {order.cashReceived != null && (
                    <p>Cash provided: {formatPeso(order.cashReceived)}</p>
                  )}
                  {order.expectedChange != null && (
                    <p>Expected change: {formatPeso(order.expectedChange)}</p>
                  )}
                </div>

                <DiscountVerifyPanel order={order} onVerified={refresh} />

                <div className="mt-4 flex flex-wrap gap-2">
                  {action && (
                    <Button
                      onClick={() => {
                        updateOrderStatus(order.id, action.next);
                        refresh();
                      }}
                    >
                      {action.label}
                    </Button>
                  )}
                  {order.orderStatus !== "cancelled" &&
                    order.orderStatus !== "completed" && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Cancel order #${order.orderNumber}?`,
                            )
                          ) {
                            updateOrderStatus(order.id, "cancelled");
                            refresh();
                          }
                        }}
                      >
                        Cancel Order
                      </Button>
                    )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
