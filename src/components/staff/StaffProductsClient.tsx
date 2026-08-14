"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BrandImage } from "@/components/ui/BrandImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductFormModal } from "@/components/staff/ProductFormModal";
import { getCategoryById } from "@/data/catalog";
import {
  deleteProduct,
  listProducts,
  saveProduct,
} from "@/lib/product-store";
import {
  getAvailabilityOverrides,
  setProductAvailability,
} from "@/lib/orders";
import { formatPeso } from "@/lib/format";
import type { Product } from "@/types";

export function StaffProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

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

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage the Picolé menu, prices and images."
        action={
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Flavor</th>
                <th className="px-5 py-4 font-semibold">Price</th>
                <th className="px-5 py-4 font-semibold">Available</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const available = isAvailable(product);
                const category = getCategoryById(product.categoryId);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <BrandImage
                          src={product.image}
                          alt=""
                          variant="thumb"
                          className="bg-[var(--cream-strong)]"
                        />
                        <div>
                          <p className="font-semibold text-[var(--ink)]">
                            {product.name}
                          </p>
                          <p className="max-w-xs truncate text-xs text-[var(--ink-muted)]">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {category?.name ?? product.categoryId}
                    </td>
                    <td className="px-5 py-4 font-medium text-[var(--ink)]">
                      {formatPeso(product.price)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !available;
                          setProductAvailability(product.id, next);
                          saveProduct({ ...product, available: next });
                          refresh();
                        }}
                      >
                        <Badge tone={available ? "success" : "danger"}>
                          {available ? "Available" : "Unavailable"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 text-[var(--ink-muted)]">
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-[var(--cream-strong)]"
                          aria-label="Edit product"
                          onClick={() => setEditing(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-[var(--cream-strong)]"
                          aria-label="Delete product"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove "${product.name}" from the menu?`,
                              )
                            ) {
                              deleteProduct(product.id);
                              refresh();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== undefined && (
        <ProductFormModal
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
