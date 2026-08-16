"use client";

import { useMemo, useState } from "react";
import { Banknote, ChevronDown, HeartHandshake, Smartphone } from "lucide-react";
import type { CustomerType, Order, PaymentMethod, Product } from "@/types";
import { PosPaymentCash } from "@/components/pos/PosPaymentCash";
import { PosPaymentEwallet } from "@/components/pos/PosPaymentEwallet";
import { SelectableChip } from "@/components/ui/SelectableChip";
import {
  calcDiscount,
  needsDiscountVerification,
  PWD_SENIOR_DISCOUNT_RATE,
} from "@/lib/orders";
import { completePosSale } from "@/lib/pos";
import { cn, formatPeso } from "@/lib/format";
import type { PosCart } from "@/components/pos/usePosCart";

const CUSTOMER_TYPES: Array<{ id: CustomerType; label: string; hint: string }> = [
  { id: "regular", label: "Regular", hint: "Standard pricing" },
  {
    id: "pwd",
    label: "PWD",
    hint: `${PWD_SENIOR_DISCOUNT_RATE * 100}% off · ID required · cash only`,
  },
  {
    id: "senior",
    label: "Senior Citizen",
    hint: `${PWD_SENIOR_DISCOUNT_RATE * 100}% off · ID required · cash only`,
  },
];

export function PosCheckoutPanel({
  cart,
  getProduct,
  onBack,
  onSaleComplete,
}: {
  cart: PosCart;
  getProduct: (productId: string) => Product | undefined;
  onBack: () => void;
  onSaleComplete: (order: Order) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("regular");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requiresIdVerification = needsDiscountVerification(customerType);

  const discountAmount = useMemo(
    () => calcDiscount(cart.subtotal, customerType).discountAmount,
    [cart.subtotal, customerType],
  );

  function selectCustomerType(type: CustomerType) {
    setCustomerType(type);
    if (needsDiscountVerification(type)) {
      setPaymentMethod("cash");
    }
  }

  function handleComplete(details: { cashReceived?: number; discountIdNumber?: string }) {
    if (!paymentMethod) return;
    setError("");
    setSubmitting(true);
    try {
      const order = completePosSale({
        cart: cart.items,
        paymentMethod,
        pickupName: customerName,
        cashReceived: details.cashReceived,
        customerType,
        discountIdNumber: details.discountIdNumber,
      });
      cart.clear();
      onSaleComplete(order);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't complete this sale. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-card bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          Checkout
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[var(--brand-green)]"
        >
          Back to Order
        </button>
      </div>

      <div className="mt-3 flex-1 space-y-4 overflow-y-auto">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Order Summary
          </h3>
          <ul className="mt-2 space-y-1.5">
            {cart.items.map((item) => {
              const product = getProduct(item.productId);
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
          <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-base font-bold text-[var(--brand-green)]">
            <span>Total</span>
            <span>{formatPeso(cart.subtotal)}</span>
          </div>
          {requiresIdVerification && discountAmount > 0 && (
            <p className="mt-2 rounded-xl bg-[var(--sidebar-soft)] px-3 py-2 text-xs text-[var(--sidebar)]">
              {customerType === "pwd" ? "PWD" : "Senior Citizen"} discount of{" "}
              {formatPeso(discountAmount)} will be applied after ID verification.
            </p>
          )}
        </section>

        <section>
          <label className="text-sm font-semibold text-[var(--ink)]">
            Customer Name (Optional)
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Ana"
            className="mt-2 w-full rounded-full border border-black/10 bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </section>

        <section>
          <button
            type="button"
            onClick={() => setDiscountOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-[var(--ink)]"
          >
            <span className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-[var(--brand-green)]" />
              PWD / Senior Citizen discount
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition", discountOpen && "rotate-180")}
            />
          </button>
          {discountOpen && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CUSTOMER_TYPES.map((type) => (
                <SelectableChip
                  key={type.id}
                  selected={customerType === type.id}
                  onSelect={() => selectCustomerType(type.id)}
                  label={type.label}
                  hint={type.hint}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Payment Method
          </h3>
          <div
            className={cn(
              "mt-2 grid gap-2",
              requiresIdVerification ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            <SelectableChip
              selected={paymentMethod === "cash"}
              onSelect={() => setPaymentMethod("cash")}
              icon={Banknote}
              label="Cash"
            />
            {!requiresIdVerification && (
              <SelectableChip
                selected={paymentMethod === "ewallet"}
                onSelect={() => setPaymentMethod("ewallet")}
                icon={Smartphone}
                label="E-Wallet"
              />
            )}
          </div>
        </section>

        {paymentMethod === "cash" && (
          <PosPaymentCash
            totalDue={cart.subtotal}
            requiresIdVerification={requiresIdVerification}
            submitting={submitting}
            onComplete={handleComplete}
          />
        )}
        {paymentMethod === "ewallet" && (
          <PosPaymentEwallet
            totalDue={cart.subtotal}
            submitting={submitting}
            onComplete={() => handleComplete({})}
          />
        )}

        {error && (
          <p className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
