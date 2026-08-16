"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { BrandImage } from "@/components/ui/BrandImage";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { formatPeso } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

export function ProductSheet({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const { addItem, isAvailable } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) setQty(1);
  }, [open, product?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !product) return null;
  const available = isAvailable(product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/40"
        aria-label="Close product details"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-modal bg-white p-4 shadow-modal sm:rounded-modal sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)]">{product.name}</h2>
            {product.bestSeller && (
              <Badge tone="warm" className="mt-2">
                Best Seller
              </Badge>
            )}
          </div>
          <IconButton icon={X} label="Close" tone="surface" onClick={onClose} />
        </div>

        <BrandImage
          src={product.image}
          alt={product.name}
          variant="sheet"
          sizes="100vw"
        />

        <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
          {product.description}
        </p>
        {product.caloriesNote && (
          <p className="mt-2 text-xs font-medium text-[var(--brand-green-dark)]">
            {product.caloriesNote}
          </p>
        )}

        <p className="mt-4 text-2xl font-bold text-[var(--brand-green)]">
          {formatPeso(product.price)}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <QuantitySelector
            quantity={qty}
            onDecrease={() => setQty((q) => Math.max(1, q - 1))}
            onIncrease={() => setQty((q) => q + 1)}
          />

          <Button
            disabled={!available}
            className="flex-1"
            onClick={() => {
              addItem(product.id, qty);
              onClose();
            }}
          >
            {available ? "Add to Cart" : "Unavailable"}
          </Button>
        </div>
      </div>
    </div>
  );
}
