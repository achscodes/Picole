"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/format";

type Size = "sm" | "md";
type Tone = "cream" | "white";

const sizeStyles: Record<Size, { btn: string; icon: string; value: string }> = {
  md: { btn: "rounded-full p-2", icon: "h-4 w-4", value: "min-w-8 text-sm" },
  sm: { btn: "rounded-full p-1.5", icon: "h-3.5 w-3.5", value: "min-w-7 text-sm" },
};

const toneStyles: Record<Tone, string> = {
  cream: "bg-[var(--cream-strong)]",
  white: "bg-white",
};

export function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  size = "md",
  tone = "cream",
  className,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  size?: Size;
  tone?: Tone;
  className?: string;
}) {
  const s = sizeStyles[size];
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full p-1",
        toneStyles[tone],
        className,
      )}
    >
      <button
        type="button"
        className={s.btn}
        onClick={onDecrease}
        aria-label="Decrease quantity"
      >
        <Minus className={s.icon} />
      </button>
      <span className={cn("text-center font-bold text-[var(--ink)]", s.value)}>
        {quantity}
      </span>
      <button
        type="button"
        className={s.btn}
        onClick={onIncrease}
        aria-label="Increase quantity"
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
}
