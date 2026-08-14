type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
