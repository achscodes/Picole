"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function FilterPill({
  active,
  onSelect,
  children,
  className,
}: {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--brand-green)] text-white shadow-sm"
          : "border border-black/10 bg-white text-[var(--ink)] hover:bg-[var(--cream-strong)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
