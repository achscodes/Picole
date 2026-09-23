"use client";

import { useEffect, useState } from "react";

/** Small "how fresh is this" note for any view backed by usePolledAction.
 * Re-renders itself periodically so the relative time stays roughly
 * accurate without the parent needing to re-render for unrelated reasons. */
export function LastUpdatedNote({
  lastUpdatedAt,
  isStale,
  className = "text-xs text-[var(--ink-muted)]",
}: {
  lastUpdatedAt: number | null;
  isStale?: boolean;
  className?: string;
}) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (lastUpdatedAt === null) return null;

  return (
    <p className={className}>
      {isStale ? "May be outdated · " : ""}
      Updated {formatRelativeTime(lastUpdatedAt)}
    </p>
  );
}

function formatRelativeTime(ts: number) {
  const seconds = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
