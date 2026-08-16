"use client";

import { Plus } from "lucide-react";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { BrandImage } from "@/components/ui/BrandImage";
import { Button } from "@/components/ui/Button";
import { cn, formatPeso } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

export function ProductCard({
  product,
  onOpen,
  variant = "grid",
}: {
  product: Product;
  onOpen: (product: Product) => void;
  /** "grid" is the full menu card; "compact" is a horizontal thumb card for carousels. */
  variant?: "grid" | "compact";
}) {
  const { addItem, isAvailable } = useCart();
  const available = isAvailable(product.id);

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="flex min-w-[220px] items-center gap-3 rounded-card bg-white p-3 text-left shadow-card transition active:scale-[0.98] lg:min-w-0"
      >
        <BrandImage
          src={product.image}
          alt={product.name}
          variant="thumb"
          className={cn("h-14 w-14 shrink-0", !available && "opacity-60 grayscale")}
          sizes="56px"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {product.name}
          </p>
          <p className="text-sm font-bold text-[var(--brand-green)]">
            {available ? formatPeso(product.price) : "Sold Out"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-card bg-white shadow-card">
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="relative block w-full text-left"
      >
        <div className="relative">
          <BrandImage
            src={product.image}
            alt={product.name}
            variant="card"
            sizes="(max-width: 640px) 50vw, 280px"
            className={!available ? "opacity-60 grayscale" : undefined}
          />
          {product.bestSeller && (
            <Badge tone="warm" className="absolute left-3 top-3">
              Best Seller
            </Badge>
          )}
          {!available && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--ink)] shadow-sm">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </button>

      <div className="space-y-3 p-3.5">
        <div>
          <h3 className="line-clamp-2 min-h-[2.625rem] text-[15px] font-bold leading-snug text-[var(--ink)]">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-[var(--ink-muted)]">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-bold text-[var(--brand-green)]">
            {formatPeso(product.price)}
          </p>
          <Button
            size="sm"
            disabled={!available}
            onClick={() => addItem(product.id, 1)}
            aria-label={`Add ${product.name}`}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}
