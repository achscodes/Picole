import { cn } from "@/lib/format";

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "warm" | "muted" | "success" | "danger";
  className?: string;
}) {
  const tones = {
    brand:
      "border border-[var(--brand-green)]/20 bg-white/90 text-[var(--brand-green-dark)]",
    warm: "bg-[#FFF1C2] text-[#8A5A00]",
    muted: "bg-[var(--ink)]/5 text-[var(--ink-muted)]",
    success: "bg-[#E7F8EF] text-[#067647]",
    danger: "bg-[#FDE8E8] text-[#B42318]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
