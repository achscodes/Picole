"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Smartphone, HeartHandshake } from "lucide-react";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectableChip } from "@/components/ui/SelectableChip";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { useCart } from "@/lib/cart-context";
import { getProductById } from "@/lib/product-store";
import {
  calcCartSubtotal,
  calcDiscount,
  createOrder,
  needsDiscountVerification,
  PWD_SENIOR_DISCOUNT_RATE,
} from "@/lib/orders";
import { cn, formatPeso } from "@/lib/format";
import type { CustomerType, PaymentMethod } from "@/types";

const CUSTOMER_TYPES: Array<{
  id: CustomerType;
  label: string;
  hint: string;
}> = [
  { id: "regular", label: "Regular", hint: "Standard pricing" },
  {
    id: "pwd",
    label: "PWD",
    hint: `${PWD_SENIOR_DISCOUNT_RATE * 100}% off after ID check · cash only`,
  },
  {
    id: "senior",
    label: "Senior Citizen",
    hint: `${PWD_SENIOR_DISCOUNT_RATE * 100}% off after ID check · cash only`,
  },
];

export function CheckoutClient() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [customerType, setCustomerType] = useState<CustomerType>("regular");
  const [pickupName, setPickupName] = useState("");
  const [cashMode, setCashMode] = useState<"exact" | "change" | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requiresIdVerification = needsDiscountVerification(customerType);

  useEffect(() => {
    if (requiresIdVerification) {
      setPaymentMethod("cash");
      setCashMode(null);
      setCashAmount("");
    }
  }, [requiresIdVerification]);

  const subtotalBeforeDiscount = useMemo(
    () => calcCartSubtotal(items),
    [items],
  );
  const { discountAmount, total: discountedTotal } = useMemo(
    () => calcDiscount(subtotalBeforeDiscount, customerType),
    [subtotalBeforeDiscount, customerType],
  );

  const orderTotal = requiresIdVerification
    ? subtotalBeforeDiscount
    : discountedTotal;

  const cashProvided = Number(cashAmount);
  const expectedChange = useMemo(() => {
    if (!Number.isFinite(cashProvided)) return 0;
    return Math.max(0, cashProvided - orderTotal);
  }, [cashProvided, orderTotal]);

  const canSubmit = useMemo(() => {
    if (!paymentMethod || items.length === 0) return false;
    if (paymentMethod === "ewallet") return !requiresIdVerification;
    if (cashMode === "exact") return true;
    if (cashMode === "change") {
      return Number.isFinite(cashProvided) && cashProvided >= orderTotal;
    }
    return false;
  }, [
    paymentMethod,
    items.length,
    cashMode,
    cashProvided,
    orderTotal,
    requiresIdVerification,
  ]);

  async function placeOrder() {
    if (!paymentMethod) return;
    setError("");
    setSubmitting(true);
    try {
      const cashReceived =
        paymentMethod === "cash"
          ? cashMode === "exact"
            ? orderTotal
            : cashProvided
          : undefined;

      if (
        paymentMethod === "cash" &&
        cashMode === "change" &&
        (cashReceived ?? 0) < orderTotal
      ) {
        setError(
          "Please enter an amount equal to or greater than your order total.",
        );
        setSubmitting(false);
        return;
      }

      const order = createOrder({
        cart: items,
        paymentMethod,
        pickupName,
        cashReceived,
        ewalletProvider: "GCash",
        customerType,
      });
      clear();
      router.push(`/confirmation/${order.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't submit your order. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-[var(--cream)]">
        <CustomerHeader />
        <main className="mx-auto max-w-lg px-4 py-10">
          <EmptyState
            title="Your cart is empty"
            action={
              <Link href="/" className="inline-block">
                <Button>Back to Menu</Button>
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--cream)]">
      <CustomerHeader />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-28 pt-6 lg:max-w-xl">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Checkout</h1>

        <section className="rounded-card bg-white p-4 shadow-card">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Order Summary
          </h2>
          <ul className="mt-3 space-y-2">
            {items.map((item) => {
              const product = getProductById(item.productId);
              if (!product) return null;
              return (
                <li
                  key={item.productId}
                  className="flex justify-between text-sm text-[var(--ink)]"
                >
                  <span>
                    {product.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPeso(product.price * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 space-y-1 border-t border-black/5 pt-3 text-sm">
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>Subtotal</span>
              <span>{formatPeso(subtotalBeforeDiscount)}</span>
            </div>
            {requiresIdVerification && discountAmount > 0 && (
              <p className="rounded-xl bg-[var(--brand-green-soft)] px-3 py-2 text-xs text-[var(--brand-green-dark)]">
                {customerType === "pwd" ? "PWD" : "Senior Citizen"} discount of{" "}
                {formatPeso(discountAmount)} will be applied after staff verifies
                your ID at the stall.
              </p>
            )}
            {!requiresIdVerification && discountAmount > 0 && (
              <div className="flex justify-between text-[var(--brand-green-dark)]">
                <span>PWD / Senior discount (20%)</span>
                <span>-{formatPeso(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[var(--brand-green)]">
              <span>{requiresIdVerification ? "Pay at stall" : "Total"}</span>
              <span>{formatPeso(orderTotal)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-card bg-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-[var(--brand-green)]" />
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Customer Type
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            PWD and Senior Citizen customers pay cash at the stall. Staff will
            verify your ID before applying the 20% discount.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {CUSTOMER_TYPES.map((type) => (
              <SelectableChip
                key={type.id}
                selected={customerType === type.id}
                onSelect={() => setCustomerType(type.id)}
                label={type.label}
                hint={type.hint}
              />
            ))}
          </div>
        </section>

        <section className="rounded-card bg-white p-4 shadow-card">
          <label className="text-sm font-semibold text-[var(--ink)]">
            Name for pickup (optional)
          </label>
          <input
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
            placeholder="e.g. Ana"
            className="mt-2 w-full rounded-full border border-black/10 bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </section>

        <section className="rounded-card bg-white p-4 shadow-card">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Payment Method
          </h2>
          {requiresIdVerification && (
            <p className="mt-1 text-xs font-medium text-[var(--brand-green-dark)]">
              Cash payment is required for PWD / Senior Citizen orders.
            </p>
          )}
          <div
            className={cn(
              "mt-3 grid gap-3",
              requiresIdVerification ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
            )}
          >
            <SelectableChip
              selected={paymentMethod === "cash"}
              onSelect={() => {
                setPaymentMethod("cash");
                setCashMode(null);
              }}
              icon={Banknote}
              label="Cash"
              hint={
                requiresIdVerification
                  ? "Required — pay at the stall"
                  : "Pay at the stall"
              }
            />
            {!requiresIdVerification && (
              <SelectableChip
                selected={paymentMethod === "ewallet"}
                onSelect={() => {
                  setPaymentMethod("ewallet");
                  setCashMode(null);
                }}
                icon={Smartphone}
                label="E-Wallet"
                hint="Pay digitally"
              />
            )}
          </div>
        </section>

        {paymentMethod === "cash" && (
          <section className="rounded-card bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Will you pay the exact amount?
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant={cashMode === "exact" ? "primary" : "secondary"}
                onClick={() => setCashMode("exact")}
              >
                Yes, Exact Amount
              </Button>
              <Button
                variant={cashMode === "change" ? "primary" : "secondary"}
                onClick={() => setCashMode("change")}
              >
                No, I Need Change
              </Button>
            </div>

            {cashMode === "exact" && (
              <div className="mt-4 space-y-1 text-sm">
                <p>
                  Order Total: <strong>{formatPeso(orderTotal)}</strong>
                </p>
                <p>
                  Cash Payment: <strong>{formatPeso(orderTotal)}</strong>
                </p>
                <p>
                  Expected Change: <strong>{formatPeso(0)}</strong>
                </p>
                {requiresIdVerification && (
                  <p className="text-xs text-[var(--ink-muted)]">
                    Change will be recalculated after staff verifies your ID.
                  </p>
                )}
              </div>
            )}

            {cashMode === "change" && (
              <div className="mt-4 space-y-3">
                <label className="text-sm font-medium">Enter cash amount</label>
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[var(--cream)] px-4 py-3">
                  <span className="font-semibold">₱</span>
                  <input
                    inputMode="decimal"
                    value={cashAmount}
                    onChange={(e) =>
                      setCashAmount(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="200"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    Order Total: <strong>{formatPeso(orderTotal)}</strong>
                  </p>
                  <p>
                    Cash Provided:{" "}
                    <strong>
                      {Number.isFinite(cashProvided) && cashAmount
                        ? formatPeso(cashProvided)
                        : "—"}
                    </strong>
                  </p>
                  <p className="text-lg font-bold text-[var(--brand-green)]">
                    Expected Change: {formatPeso(expectedChange)}
                  </p>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">
                  {requiresIdVerification
                    ? "Change will be recalculated after staff verifies your ID and applies the discount."
                    : "Change shown is the expected change. Please verify the actual cash payment with our staff."}
                </p>
              </div>
            )}
          </section>
        )}

        {paymentMethod === "ewallet" && !requiresIdVerification && (
          <section className="rounded-card bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              E-Wallet payment
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Amount to pay: <strong>{formatPeso(orderTotal)}</strong>
            </p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Provider is configurable (demo uses GCash manual verification).
              Show your payment confirmation to staff at the stall.
            </p>
          </section>
        )}

        {error && (
          <p className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {error}
          </p>
        )}
      </main>

      <StickyActionBar
        onClick={placeOrder}
        disabled={!canSubmit || submitting}
        left={
          paymentMethod
            ? submitting
              ? "Placing order…"
              : "Place Order"
            : requiresIdVerification
              ? "Select cash payment option"
              : "Select a payment method"
        }
        right={formatPeso(orderTotal)}
      />
    </div>
  );
}
