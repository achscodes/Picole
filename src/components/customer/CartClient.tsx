"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { BrandImage } from "@/components/ui/BrandImage";
import { Button } from "@/components/ui/Button";
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
          <div className="mt-10 rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[var(--ink-muted)]">
              Your cart is empty. Browse the menu and add a Picolé.
            </p>
            <Link href="/" className="mt-5 inline-block">
              <Button>Back to Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item) => {
              const product = getProductById(item.productId);
              if (!product) return null;
              return (
                <div
                  key={item.productId}
                  className="rounded-3xl bg-white p-3.5 shadow-sm"
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
                    <div className="inline-flex items-center rounded-full bg-[var(--cream-strong)] p-1">
                      <button
                        type="button"
                        className="rounded-full p-2"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="rounded-full p-2"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
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

            <div className="rounded-3xl bg-white p-4 shadow-sm">
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
        <div className="fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            href="/checkout"
            className="mx-auto flex max-w-lg items-center justify-between rounded-full bg-[var(--brand-green)] px-5 py-3.5 text-white shadow-lg"
          >
            <span className="font-semibold">Proceed to Checkout</span>
            <span className="font-bold">{formatPeso(subtotal)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
