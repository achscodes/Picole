"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import type { InventoryItem } from "@/lib/inventory";
import type { Product } from "@/types";

export function InventoryAlerts({
  items,
  getProduct,
}: {
  items: InventoryItem[];
  getProduct: (productId: string) => Product | undefined;
}) {
  const outOfStock = items.filter((i) => i.stock <= 0);
  const lowStock = items.filter((i) => i.stock > 0 && i.stock <= i.alertAt);

  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="mb-6 space-y-3 rounded-card bg-white p-5 shadow-card">
      <h2 className="font-display text-base font-bold text-[var(--ink)]">
        Inventory Alerts
      </h2>

      <div className="space-y-2">
        {outOfStock.map((item) => {
          const product = getProduct(item.productId);
          if (!product) return null;
          return (
            <div
              key={item.productId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-danger-bg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0 text-danger-text" />
                <p className="text-sm text-danger-text">
                  <strong>{product.name}</strong> is out of stock.
                </p>
              </div>
              <span className="text-sm font-semibold text-danger-text">
                0 remaining
              </span>
            </div>
          );
        })}
        {lowStock.map((item) => {
          const product = getProduct(item.productId);
          if (!product) return null;
          return (
            <div
              key={item.productId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FFF1C2] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#8A5A00]" />
                <p className="text-sm text-[#8A5A00]">
                  <strong>{product.name}</strong> is low in stock.
                </p>
              </div>
              <span className="text-sm font-semibold text-[#8A5A00]">
                {item.stock} remaining
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
