"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { getFlavorCategories } from "@/data/catalog";
import { createProduct, saveProduct } from "@/lib/actions/products";
import { readImageAttachment } from "@/lib/image";
import { cn } from "@/lib/format";
import type { FlavorCategoryId } from "@/data/catalog";
import type { Product } from "@/types";

type ProductFormModalProps = {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  categoryId: FlavorCategoryId;
  image: string;
  available: boolean;
  bestSeller: boolean;
};

export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);
  const flavors = getFlavorCategories();

  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    categoryId: (product?.categoryId as FlavorCategoryId) ?? "juicy",
    image: product?.image ?? "",
    available: product?.available ?? true,
    bestSeller: product?.bestSeller ?? false,
  });
  const [error, setError] = useState("");
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await readImageAttachment(file);
      setForm((f) => ({ ...f, image: dataUrl }));
      setPreviewName(file.name);
      setError("");
    } catch {
      setError("Could not read the selected image.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const price = Number(form.price);
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(price)) {
      setError("Name, description, and price are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      categoryId: form.categoryId,
      image: form.image,
      available: form.available,
      bestSeller: form.bestSeller,
    };

    if (isEdit && product) {
      await saveProduct({ ...product, ...payload });
    } else {
      await createProduct(payload);
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-modal bg-[var(--cream)] shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2
            id="product-form-title"
            className="font-display text-lg font-bold text-[var(--ink)]"
          >
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <p className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              Flavor Name
            </span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="mt-1.5 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Price (₱)
              </span>
              <input
                inputMode="decimal"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value.replace(/[^\d.]/g, ""),
                  })
                }
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--ink-muted)]">
                Category
              </span>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId: e.target.value as FlavorCategoryId,
                  })
                }
                className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-green)]"
              >
                {flavors.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="block">
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              Product Image
            </span>
            <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white px-4 py-6 text-center transition hover:border-[var(--brand-green)]">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt=""
                  className="mb-2 h-24 w-24 rounded-2xl object-contain"
                />
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  Tap to attach an image
                </p>
              )}
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {previewName ?? "PNG, JPG, or AVIF"}
              </p>
            </label>
          </div>

          <div className="space-y-3 rounded-2xl bg-[var(--brand-green-soft)] p-4">
            {(
              [
                ["available", "Available on menu"],
                ["bestSeller", "Best seller"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between text-sm font-medium text-[var(--ink)]"
              >
                {label}
                <button
                  type="button"
                  role="switch"
                  aria-checked={form[key]}
                  onClick={() => setForm({ ...form, [key]: !form[key] })}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition",
                    form[key] ? "bg-[var(--brand-green)]" : "bg-black/15",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                      form[key] ? "left-5" : "left-0.5",
                    )}
                  />
                </button>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Save Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
