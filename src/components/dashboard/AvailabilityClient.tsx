"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BrandImage } from "@/components/ui/BrandImage";
import { Badge } from "@/components/ui/Badge";
import { getCategoryById } from "@/data/catalog";
import { listProducts, saveProduct } from "@/lib/product-store";
import { getAvailabilityOverrides, setProductAvailability } from "@/lib/orders";
import { formatPeso } from "@/lib/format";
import type { Product } from "@/types";

export function AvailabilityClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  function refresh() {
    setProducts(listProducts());
    setAvailability(getAvailabilityOverrides());
  }

  useEffect(() => {
    refresh();
  }, []);

  function isAvailable(product: Product) {
    return availability[product.id] ?? product.available;
  }

  const availableCount = useMemo(
    () => products.filter(isAvailable).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, availability],
  );

  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="Mark products available or sold out — the POS respects this instantly."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Available" value={availableCount} />
        <StatCard
          label="Sold Out"
          value={products.length - availableCount}
          className={
            products.length - availableCount > 0
              ? "text-[var(--brand-red)]"
              : undefined
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const available = isAvailable(product);
          const category = getCategoryById(product.categoryId);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                const next = !available;
                setProductAvailability(product.id, next);
                saveProduct({ ...product, available: next });
                refresh();
              }}
              className="flex flex-col items-center gap-3 rounded-card bg-white p-5 text-center shadow-card transition hover:shadow-md"
            >
              <BrandImage
                src={product.image}
                alt=""
                variant="thumb"
                className="h-16 w-16 bg-[var(--cream-strong)]"
              />
              <div>
                <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {category?.name ?? product.categoryId} ·{" "}
                  {formatPeso(product.price)}
                </p>
              </div>
              <Badge tone={available ? "success" : "danger"}>
                {available ? "Available" : "Sold Out"}
              </Badge>
            </button>
          );
        })}
      </div>
    </>
  );
}
