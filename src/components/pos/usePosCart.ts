"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, Product } from "@/types";
import { getActiveSession } from "@/lib/offline/sync-engine";
import { clearDraftCart, getDraftCart, putDraftCart } from "@/lib/offline/db";

const DRAFT_SAVE_DEBOUNCE_MS = 400;

export function usePosCart(
  getProduct: (productId: string) => Product | undefined,
  getMaxQuantity: (productId: string) => number = () => Number.MAX_SAFE_INTEGER,
) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore an in-progress ring-up that survived a crash or forced refresh
  // (e.g. a service-worker update reload - see UpdatePrompt) so a cashier
  // never loses items already scanned. Only restores a draft saved by
  // whoever's currently signed in on this device (see setActiveSession in
  // useOfflineSaleQueue, mounted in DashboardShell).
  useEffect(() => {
    let cancelled = false;
    const session = getActiveSession();
    if (!session) {
      hydrated.current = true;
      return;
    }
    void getDraftCart().then((draft) => {
      if (cancelled) return;
      if (draft && draft.savedByUserId === session.userId && draft.items.length > 0) {
        setItems(draft.items);
      }
      hydrated.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const session = getActiveSession();
      if (!session) return;
      if (items.length === 0) {
        void clearDraftCart();
        return;
      }
      void putDraftCart({
        id: "draft",
        items,
        savedAt: Date.now(),
        savedByUserId: session.userId,
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [items]);

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

  const clear = useCallback(() => {
    setItems([]);
    void clearDraftCart();
  }, []);

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
