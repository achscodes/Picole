"use client";

import { useCallback, useMemo, useState } from "react";
import type { CartItem, Product } from "@/types";

export function usePosCart(
  getProduct: (productId: string) => Product | undefined,
  getMaxQuantity: (productId: string) => number = () => Number.MAX_SAFE_INTEGER,
) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      const max = getMaxQuantity(productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(i.quantity + quantity, max) }
            : i,
        );
      }
      if (max <= 0) return prev;
      return [...prev, { productId, quantity: Math.min(quantity, max) }];
    });
  }, [getMaxQuantity]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      const nextQuantity = Math.min(quantity, getMaxQuantity(productId));
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: nextQuantity } : i,
      );
    });
  }, [getMaxQuantity]);

  const increment = useCallback(
    (productId: string) => {
      const current = items.find((i) => i.productId === productId)?.quantity ?? 0;
      setQuantity(productId, current + 1);
    },
    [items, setQuantity],
  );

  const decrement = useCallback(
    (productId: string) => {
      const current = items.find((i) => i.productId === productId)?.quantity ?? 0;
      setQuantity(productId, current - 1);
    },
    [items, setQuantity],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) map[item.productId] = item.quantity;
    return map;
  }, [items]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = getProduct(item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0),
    [items, getProduct],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  return {
    items,
    quantities,
    itemCount,
    subtotal,
    addItem,
    increment,
    decrement,
    setQuantity,
    removeItem,
    clear,
  };
}

export type PosCart = ReturnType<typeof usePosCart>;
