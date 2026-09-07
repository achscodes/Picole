"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BrandImage } from "@/components/ui/BrandImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { ProductFormModal } from "@/components/staff/ProductFormModal";
import { getCategoryById } from "@/data/catalog";
import { deleteProduct, getProducts, saveProduct } from "@/lib/actions/products";
import { formatPeso } from "@/lib/format";
import type { Product } from "@/types";

export function StaffProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { showToast } = useToast();

  async function refresh() {
    setProducts(await getProducts());
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

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Price</th>
                <th className="px-5 py-4 font-semibold">Available</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const available = product.available;
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
                        onClick={async () => {
                          const next = !available;
                          await saveProduct({ ...product, available: next });
                          refresh();
                          showToast(`${product.name} is now ${next ? "available" : "unavailable"}.`);
                        }}
                      >
                        <Badge tone={available ? "success" : "danger"}>
                          {available ? "Available" : "Unavailable"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <IconButton
                          icon={Pencil}
                          label="Edit product"
                          onClick={() => setEditing(product)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete product"
                          onClick={() => setProductToDelete(product)}
                        />
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
          onSaved={() => {
            refresh();
            showToast(editing ? "Product updated." : "Product added.");
          }}
        />
      )}

      <ConfirmDialog
        open={productToDelete !== null}
        title="Delete product?"
        message={`This will remove “${productToDelete?.name ?? "this product"}” from the menu.`}
        confirmLabel="Delete product"
        tone="danger"
        onCancel={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (!productToDelete) return;
          const name = productToDelete.name;
          await deleteProduct(productToDelete.id);
          setProductToDelete(null);
          refresh();
          showToast(`${name} was deleted.`);
        }}
      />
    </>
  );
}
