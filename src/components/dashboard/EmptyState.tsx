type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-bold text-[var(--ink)]">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{description}</p>
      )}
    </div>
  );
}
