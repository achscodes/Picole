import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-card bg-white p-10 text-center shadow-card">
      <p className="text-lg font-bold text-[var(--ink)]">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
