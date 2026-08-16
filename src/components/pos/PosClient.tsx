"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PosCartPanel } from "@/components/pos/PosCartPanel";
import { PosCategoryTabs } from "@/components/pos/PosCategoryTabs";
import { PosCheckoutPanel } from "@/components/pos/PosCheckoutPanel";
import { PosMobileCartBar } from "@/components/pos/PosMobileCartBar";
import { PosProductGrid } from "@/components/pos/PosProductGrid";
import { PosReceipt } from "@/components/pos/PosReceipt";
import { SearchBar } from "@/components/ui/SearchBar";
import { usePosCart } from "@/components/pos/usePosCart";
import { filterProductsByCategory, searchProducts } from "@/data/catalog";
import { getAvailabilityOverrides } from "@/lib/orders";
import { isProductAvailable } from "@/lib/pos";
import { listProducts } from "@/lib/product-store";
import type { CategoryId, Order, Product } from "@/types";

type Screen = "catalog" | "checkout" | "receipt";

export function PosClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [screen, setScreen] = useState<Screen>("catalog");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function refresh() {
      setProducts(listProducts());
      setAvailability(getAvailabilityOverrides());
    }
    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => window.clearInterval(id);
  }, []);

  const getProduct = useCallback(
    (productId: string) => products.find((p) => p.id === productId),
    [products],
  );

  const cart = usePosCart(getProduct);

  const isAvailable = useCallback(
    (product: Product) => isProductAvailable(product, availability),
    [availability],
  );

  const visibleProducts = useMemo(
    () => searchProducts(filterProductsByCategory(products, activeCategory), searchQuery),
    [products, activeCategory, searchQuery],
  );

  function handleAdd(productId: string) {
    const product = getProduct(productId);
    if (!product || !isAvailable(product)) return;
    cart.addItem(productId, 1);
  }

  function handleSaleComplete(order: Order) {
    setCompletedOrder(order);
    setScreen("receipt");
    setMobileCartOpen(false);
  }

  function handleNewOrder() {
    setCompletedOrder(null);
    setScreen("catalog");
    setSearchQuery("");
    setActiveCategory("all");
    setMobileCartOpen(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (mobileCartOpen) {
          setMobileCartOpen(false);
          return;
        }
        if (screen === "checkout") {
          setScreen("catalog");
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileCartOpen, screen]);

  return (
    <>
      <PageHeader title="New Order" subtitle="Select products to start a new order." />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <SearchBar ref={searchInputRef} value={searchQuery} onChange={setSearchQuery} />
          <PosCategoryTabs activeId={activeCategory} onSelect={setActiveCategory} />
          <PosProductGrid
            products={visibleProducts}
            isAvailable={isAvailable}
            quantities={cart.quantities}
            onAdd={handleAdd}
          />
        </div>

        <div className="hidden md:sticky md:top-20 md:flex md:h-[calc(100dvh-6rem)] md:w-[360px] md:flex-col">
          {screen === "checkout" ? (
            <PosCheckoutPanel
              cart={cart}
              getProduct={getProduct}
              onBack={() => setScreen("catalog")}
              onSaleComplete={handleSaleComplete}
            />
          ) : (
            <PosCartPanel
              cart={cart}
              getProduct={getProduct}
              onCheckout={() => setScreen("checkout")}
            />
          )}
        </div>
      </div>

      <PosMobileCartBar
        itemCount={cart.itemCount}
        subtotal={cart.subtotal}
        onOpen={() => setMobileCartOpen(true)}
      />

      {mobileCartOpen && (
        <>
          <button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-y-auto rounded-t-modal bg-[var(--cream)] p-4 shadow-modal md:hidden">
            {screen === "checkout" ? (
              <PosCheckoutPanel
                cart={cart}
                getProduct={getProduct}
                onBack={() => setScreen("catalog")}
                onSaleComplete={handleSaleComplete}
              />
            ) : (
              <PosCartPanel
                cart={cart}
                getProduct={getProduct}
                onCheckout={() => setScreen("checkout")}
              />
            )}
          </div>
        </>
      )}

      {screen === "receipt" && completedOrder && (
        <PosReceipt order={completedOrder} onNewOrder={handleNewOrder} />
      )}
    </>
  );
}
