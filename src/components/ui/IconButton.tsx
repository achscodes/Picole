"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Size = "sm" | "md";
type Tone = "muted" | "surface" | "onTint";

const sizeStyles: Record<Size, string> = {
  sm: "p-1.5",
  md: "p-2",
};

const iconSizes: Record<Size, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

const toneStyles: Record<Tone, string> = {
  muted: "text-[var(--ink-muted)] hover:bg-[var(--ink)]/5",
  surface: "bg-[var(--ink)]/5 text-[var(--ink-muted)] hover:bg-[var(--ink)]/10",
  onTint: "text-[var(--ink-muted)] hover:bg-white",
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: Size;
  tone?: Tone;
}

export function IconButton({
  icon: Icon,
  label,
  size = "md",
  tone = "muted",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "shrink-0 rounded-full transition",
        sizeStyles[size],
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}
