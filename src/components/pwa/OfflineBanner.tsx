"use client";

import { CloudAlert, WifiOff } from "lucide-react";
import { useConnectivity } from "@/hooks/useConnectivity";

/** Shown only for offline/server-unavailable - never for poor-connection,
 * so the app isn't constantly flashing alarming messages while it's
 * actually functioning, just slowly. */
export function OfflineBanner() {
  const state = useConnectivity();

  if (state !== "offline" && state !== "server-unavailable") return null;

  const isOffline = state === "offline";
  const Icon = isOffline ? WifiOff : CloudAlert;

  return (
    <div className="flex items-center gap-2 border-b border-black/5 bg-[var(--ink)] px-4 py-2 text-xs font-medium text-white sm:px-6">
      <Icon className="h-4 w-4 shrink-0" />
      {isOffline
        ? "You're offline. Sales can still be recorded here and will sync automatically once you're back online."
        : "We can reach the network, but the server is having trouble. Some actions may fail until it recovers."}
    </div>
  );
}
