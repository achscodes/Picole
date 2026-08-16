"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { BrandImage } from "@/components/ui/BrandImage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { getProductById } from "@/lib/product-store";
import { useCart } from "@/lib/cart-context";
import { formatPeso } from "@/lib/format";

export function CartClient() {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  return (
    <div className="min-h-dvh bg-[var(--cream)]">
      <CustomerHeader active="cart" />
      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 lg:max-w-xl">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Your Cart</h1>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Your cart is empty"
              description="Browse the menu and add a Picolé."
              action={
                <Link href="/" className="inline-block">
                  <Button>Back to Menu</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item) => {
              const product = getProductById(item.productId);
              if (!product) return null;
              return (
                <div
                  key={item.productId}
                  className="rounded-card bg-white p-3.5 shadow-card"
                >
                  <div className="flex gap-3">
                    <BrandImage
                      src={product.image}
                      alt={product.name}
                      variant="cart"
                      sizes="80px"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--ink)]">
                        {product.name}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {formatPeso(product.price)} each
                      </p>
                      <p className="mt-1 font-bold text-[var(--brand-green)]">
                        {formatPeso(product.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <QuantitySelector
                      quantity={item.quantity}
                      onDecrease={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      onIncrease={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-muted)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="rounded-card bg-white p-4 shadow-card">
              <div className="flex justify-between text-sm text-[var(--ink-muted)]">
                <span>Subtotal</span>
                <span>{formatPeso(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-lg font-bold text-[var(--brand-green)]">
                <span>Total</span>
                <span>{formatPeso(subtotal)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {items.length > 0 && (
        <StickyActionBar
          href="/checkout"
          left="Proceed to Checkout"
          right={formatPeso(subtotal)}
        />
      )}
    </div>
  );
}
