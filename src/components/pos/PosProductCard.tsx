"use client";

import type { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { BrandImage } from "@/components/ui/BrandImage";
import { formatPeso } from "@/lib/format";

export function PosProductCard({
  product,
  available,
  outOfStock = false,
  quantityInCart = 0,
  onAdd,
}: {
  product: Product;
  available: boolean;
  /** True specifically when stock has hit zero, vs. a manual "sold out" override. */
  outOfStock?: boolean;
  quantityInCart?: number;
  onAdd: (productId: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => onAdd(product.id)}
      className="overflow-hidden rounded-card bg-white text-left shadow-card transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100"
    >
      <div className="relative">
        <BrandImage
          src={product.image}
          alt={product.name}
          variant="card"
          sizes="(max-width: 640px) 50vw, 240px"
          className={!available ? "opacity-60 grayscale" : undefined}
        />
        {product.bestSeller && (
          <Badge tone="warm" className="absolute left-3 top-3">
            Best Seller
          </Badge>
        )}
        {quantityInCart > 0 && available && (
          <span className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--brand-green)] px-2 text-xs font-bold text-white shadow-sm">
            ×{quantityInCart}
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--ink)] shadow-sm">
              {outOfStock ? "Out of Stock" : "Sold Out"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1 p-3.5">
        <h3 className="line-clamp-2 min-h-[2.625rem] text-[15px] font-bold leading-snug text-[var(--ink)]">
          {product.name}
        </h3>
        <p className="text-base font-bold text-[var(--brand-green)]">
          {formatPeso(product.price)}
        </p>
      </div>
    </button>
  );
}
