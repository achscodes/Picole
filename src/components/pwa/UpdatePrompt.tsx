"use client";

import { useSyncExternalStore } from "react";
import { RefreshCw } from "lucide-react";
import {
  applyWaitingUpdate,
  getWaitingWorkerServerSnapshot,
  getWaitingWorkerSnapshot,
  subscribeWaitingWorker,
} from "@/lib/offline/sw-update-store";

/** Manual, dismissible-by-ignoring update prompt - never a forced reload,
 * since that could interrupt a cashier mid-sale. Mounted once in the root
 * layout so it's available on every page, including /login. */
export function UpdatePrompt() {
  const updateAvailable = useSyncExternalStore(
    subscribeWaitingWorker,
    getWaitingWorkerSnapshot,
    getWaitingWorkerServerSnapshot,
  );

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm text-white shadow-modal">
        <span>A new version is ready.</span>
        <button
          type="button"
          onClick={applyWaitingUpdate}
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold transition hover:bg-white/25"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Update
        </button>
      </div>
    </div>
  );
}
