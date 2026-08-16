"use client";

import { useCallback, useMemo, useState } from "react";
import type { CartItem, Product } from "@/types";

export function usePosCart(getProduct: (productId: string) => Product | undefined) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

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
