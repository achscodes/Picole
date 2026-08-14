"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Leaf, Sparkles, Sun, ShoppingBag } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { filterProducts, listProducts } from "@/lib/product-store";
import type { CategoryId, Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BrandImage } from "@/components/ui/BrandImage";
import { ProductCard } from "@/components/customer/ProductCard";
import { ProductSheet } from "@/components/customer/ProductSheet";
import { formatPeso } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/format";

export function MenuClient() {
  const [category, setCategory] = useState<CategoryId>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const { itemCount, subtotal } = useCart();

  const products = useMemo(() => filterProducts(category), [category]);
  const favorites = useMemo(
    () => listProducts().filter((p) => p.bestSeller).slice(0, 3),
    [],
  );
  const activeCategory = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="pb-28">
      <section className="hero-gradient px-4 pb-10 pt-8 sm:pb-12 sm:pt-10">
        <div className="mx-auto max-w-lg text-center lg:max-w-3xl">
          <Badge tone="brand" className="mx-auto mb-4 normal-case">
            <Leaf className="h-3 w-3" />
            Made with real fruit
          </Badge>
          <h1 className="font-[family-name:var(--font-display)] text-[2rem] font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-[2.5rem] lg:text-[3rem]">
            Fresh. Healthy. Made to Refresh.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            Choose your favorite Picolé and order directly from our stall.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="#menu">
              <Button className="w-full sm:min-w-[220px]">
                Start Your Order
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link href="/order">
              <Button variant="secondary" className="w-full sm:min-w-[220px]">
                Track my order
              </Button>
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--ink-muted)] sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-[var(--brand-green)]" /> Made
              fresh daily
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-green)]" /> No
              artificial flavors
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-[var(--brand-green)]" />{" "}
              Pick up at the stall
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-lg px-4 pt-8 lg:max-w-6xl">
        <h2 className="text-lg font-bold text-[var(--ink)] sm:text-xl">
          Today&apos;s favorites
        </h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible">
          {favorites.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelected(product)}
              className="flex min-w-[220px] items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_6px_18px_rgba(26,46,26,0.05)] lg:min-w-0"
            >
              <BrandImage
                src={product.image}
                alt={product.name}
                variant="thumb"
                className="h-14 w-14 shrink-0"
                sizes="56px"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-[var(--brand-green)]">
                  {formatPeso(product.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section
        id="menu"
        className="mx-auto max-w-lg scroll-mt-20 px-4 pt-8 lg:max-w-6xl lg:pt-10"
      >
        <h2 className="text-lg font-bold text-[var(--ink)] sm:text-xl">
          Our Menu
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)] sm:text-sm">
          Official Picolé flavor lines — demo prices until client pricing is
          set.
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                category === cat.id
                  ? "bg-[var(--brand-green)] text-white shadow-sm"
                  : "bg-white text-[var(--ink)] shadow-sm",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {activeCategory?.image && (
          <BrandImage
            src={activeCategory.image}
            alt={activeCategory.name}
            variant="banner"
            className="mt-4 bg-transparent"
            sizes="(max-width: 1024px) 100vw, 960px"
          />
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={setSelected}
            />
          ))}
        </div>
      </section>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <Link
            href="/cart"
            className="mx-auto flex max-w-lg items-center justify-between rounded-full bg-[var(--brand-green)] px-5 py-3.5 text-white shadow-lg lg:max-w-xl"
          >
            <span className="text-sm font-semibold">
              View Cart · {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            <span className="text-sm font-bold">{formatPeso(subtotal)}</span>
          </Link>
        </div>
      )}

      <ProductSheet
        product={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
