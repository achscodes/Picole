import { cn } from "@/lib/format";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "staff";
type Size = "sm" | "md" | "lg";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-green)] text-white shadow-sm active:scale-[0.98] hover:brightness-105",
  secondary:
    "bg-[var(--cream-strong)] text-[var(--ink)] border border-[var(--ink)]/5 active:scale-[0.98]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--ink)]/5",
  danger: "bg-danger-bg text-danger-text active:scale-[0.98]",
  /** Staff-only actions (e.g. verifying a discount) — intentionally the admin sidebar blue, not brand green. */
  staff: "bg-[var(--sidebar-active)] text-white shadow-sm active:scale-[0.98] hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size],
        styles[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
