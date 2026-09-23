"use client";

import { CloudAlert, RefreshCw, TriangleAlert, Wifi, WifiOff } from "lucide-react";
import { useConnectivity } from "@/hooks/useConnectivity";
import { cn } from "@/lib/format";

const CONFIG = {
  online: {
    label: "Online",
    icon: Wifi,
    className: "bg-[var(--brand-green-soft)] text-[var(--brand-green-dark)]",
  },
  "poor-connection": {
    label: "Poor connection",
    icon: TriangleAlert,
    className: "bg-amber-100 text-amber-800",
  },
  reconnecting: {
    label: "Syncing…",
    icon: RefreshCw,
    className: "bg-[var(--sidebar-soft)] text-[var(--sidebar)]",
  },
  offline: {
    label: "Offline",
    icon: WifiOff,
    className: "bg-black/10 text-[var(--ink-muted)]",
  },
  "server-unavailable": {
    label: "Server unavailable",
    icon: CloudAlert,
    className: "bg-danger-bg text-danger-text",
  },
} as const;

/** Small, persistent, non-alarming pill - deliberately never shows a scary
 * color for "poor-connection" (that's what OfflineBanner is for, and only
 * for offline/server-unavailable, per the design goal of not interrupting
 * normal-but-degraded operation with alarming messaging). */
export function ConnectivityBadge() {
  const state = useConnectivity();
  const { label, icon: Icon, className } = CONFIG[state];

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", state === "reconnecting" && "animate-spin")} />
      {label}
    </span>
  );
}
