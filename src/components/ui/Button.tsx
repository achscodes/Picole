import { cn } from "@/lib/format";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-green)] text-white shadow-sm active:scale-[0.98] hover:brightness-105",
  secondary:
    "bg-[var(--cream-strong)] text-[var(--ink)] border border-[var(--ink)]/5 active:scale-[0.98]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--ink)]/5",
  danger: "bg-[#FDE8E8] text-[#B42318] active:scale-[0.98]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
