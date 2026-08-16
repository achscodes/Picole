"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

export function SelectableChip({
  selected,
  onSelect,
  label,
  hint,
  icon: Icon,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-field border p-4 text-left transition",
        selected
          ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]"
          : "border-black/10 bg-white",
        className,
      )}
    >
      {Icon && <Icon className="mb-2 h-5 w-5 text-[var(--brand-green)]" />}
      <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
      {hint && <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p>}
    </button>
  );
}
