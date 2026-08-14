"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { BRAND } from "@/data/catalog";
import { cn } from "@/lib/format";

export function CustomerHeader({
  active = "menu",
}: {
  active?: "menu" | "order" | "cart";
}) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ink)]/5 bg-[var(--cream)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 lg:max-w-6xl lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={BRAND.logo}
            alt="Picolé Healthy Ice Pops"
            width={112}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium text-[var(--ink)]">
          <Link
            href="/"
            className={cn(
              "rounded-full px-3 py-2 transition",
              active === "menu"
                ? "bg-[var(--cream-strong)]"
                : "hover:bg-[var(--cream-strong)]/70",
            )}
          >
            Menu
          </Link>
          <Link
            href="/order"
            className={cn(
              "rounded-full px-3 py-2 transition",
              active === "order"
                ? "bg-[var(--cream-strong)]"
                : "hover:bg-[var(--cream-strong)]/70",
            )}
          >
            My Order
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart with ${itemCount} items`}
            className="relative ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-green)] text-white shadow-sm"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-red)] px-1 text-[11px] font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
