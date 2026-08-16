"use client";

import type { Product } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { PosProductCard } from "@/components/pos/PosProductCard";

export function PosProductGrid({
  products,
  isAvailable,
  isOutOfStock,
  quantities,
  onAdd,
}: {
  products: Product[];
  isAvailable: (product: Product) => boolean;
  isOutOfStock?: (product: Product) => boolean;
  quantities: Record<string, number>;
  onAdd: (productId: string) => void;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try a different search term or category."
      />
    );
  }

  return (
    // Column count dips at md because the 360px cart sidebar appears at that
    // breakpoint (see PosClient) — this is intentional, not a broken sequence.
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <PosProductCard
          key={product.id}
          product={product}
          available={isAvailable(product)}
          outOfStock={isOutOfStock?.(product) ?? false}
          quantityInCart={quantities[product.id] ?? 0}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}
