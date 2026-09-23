"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllPendingSales } from "@/lib/offline/db";
import {
  cancelSale,
  retrySale,
  scheduleProcessing,
  setActiveSession,
  subscribeQueue,
} from "@/lib/offline/sync-engine";
import type { PendingSale } from "@/lib/offline/types";
import type { Session } from "@/types/auth";

const SAFETY_NET_INTERVAL_MS = 30_000;

const UNSETTLED_STATUSES: PendingSale["status"][] = [
  "pending",
  "syncing",
  "failed-retryable",
  "blocked-auth",
  "blocked-other-session",
];

/**
 * Mount once near the root of the authenticated shell (DashboardShell) so
 * the sync engine always knows who's currently signed in on this device,
 * and so the queue keeps draining in the background regardless of which
 * page is open. Also usable anywhere that needs to render queue state
 * (PendingSyncIndicator).
 */
export function useOfflineSaleQueue(session: Session) {
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  const refresh = useCallback(() => {
    void getAllPendingSales().then(setPendingSales);
  }, []);

  useEffect(() => {
    setActiveSession(session);
    refresh();
    return subscribeQueue(refresh);
  }, [session, refresh]);

  useEffect(() => {
    function onOnline() {
      scheduleProcessing(0);
    }
    function onVisible() {
      if (document.visibilityState === "visible") scheduleProcessing(0);
    }
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(() => scheduleProcessing(0), SAFETY_NET_INTERVAL_MS);
    scheduleProcessing(0);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  const mine = pendingSales.filter((sale) => sale.queuedByUserId === session.userId);
  const pendingCount = mine.filter((sale) => UNSETTLED_STATUSES.includes(sale.status)).length;
  const hasUnsynced = mine.some(
    (sale) => sale.status !== "synced" && sale.status !== "synced-with-discrepancy",
  );

  return {
    pendingSales: mine,
    pendingCount,
    hasUnsynced,
    retry: retrySale,
    cancel: cancelSale,
  };
}
