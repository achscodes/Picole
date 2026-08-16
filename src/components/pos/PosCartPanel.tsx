"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { formatPeso } from "@/lib/format";
import type { PosCart } from "@/components/pos/usePosCart";

export function PosCartPanel({
  cart,
  getProduct,
  onCheckout,
}: {
  cart: PosCart;
  getProduct: (productId: string) => Product | undefined;
  onCheckout: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-card bg-white p-4 shadow-card">
      <h2 className="font-display text-base font-bold text-[var(--ink)]">
        Current Order
      </h2>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
        {cart.items.length === 0 ? (
          <EmptyState
            title="No items yet"
            description="Tap a product to add it to the order."
          />
        ) : (
          cart.items.map((item) => {
            const product = getProduct(item.productId);
            if (!product) return null;
            const lineTotal = product.price * item.quantity;
            return (
              <div
                key={item.productId}
                className="rounded-2xl border border-black/5 bg-[var(--cream)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {formatPeso(product.price)} × {item.quantity}
                    </p>
                  </div>
                  <IconButton
                    icon={Trash2}
                    label={`Remove ${product.name}`}
                    size="sm"
                    tone="onTint"
                    onClick={() => cart.removeItem(item.productId)}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <QuantitySelector
                    quantity={item.quantity}
                    size="sm"
                    tone="white"
                    onDecrease={() => cart.decrement(item.productId)}
                    onIncrease={() => cart.increment(item.productId)}
                  />
                  <p className="text-sm font-bold text-[var(--brand-green)]">
                    {formatPeso(lineTotal)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
        <div className="flex justify-between text-base font-bold text-[var(--ink)]">
          <span>Total</span>
          <span>{formatPeso(cart.subtotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={cart.items.length === 0}
            onClick={() => setConfirmClear(true)}
          >
            Clear Order
          </Button>
          <Button disabled={cart.items.length === 0} onClick={onCheckout}>
            Checkout
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear this order?"
        message="Are you sure you want to clear this order?"
        confirmLabel="Clear Order"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          cart.clear();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}
