"use client";

import { ShoppingCart } from "lucide-react";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { formatPeso } from "@/lib/format";

export function PosMobileCartBar({
  itemCount,
  subtotal,
  onOpen,
}: {
  itemCount: number;
  subtotal: number;
  onOpen: () => void;
}) {
  if (itemCount === 0) return null;

  return (
    <StickyActionBar
      onClick={onOpen}
      icon={ShoppingCart}
      left={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
      right={formatPeso(subtotal)}
      wrapperClassName="md:hidden"
    />
  );
}
