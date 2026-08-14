import { cn } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          {label}
        </p>
        {Icon && (
          <Icon className="h-4 w-4 shrink-0 text-[var(--brand-green)]" />
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}
