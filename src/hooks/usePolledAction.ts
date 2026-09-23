"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { classifyThrown } from "@/lib/offline/classify-error";
import { reportRequestOutcome } from "@/lib/offline/connectivity-store";
import { getDashboardCache, putDashboardCache } from "@/lib/offline/db";

const MAX_BACKOFF_MS = 30_000;
const MAX_BACKOFF_STEPS = 4;

export interface UsePolledActionOptions<T> {
  /** IndexedDB dashboardCache key. Omit to skip persistence (no last-known
   * value survives a remount, but backoff/error-handling still apply). */
  cacheKey?: string;
  intervalMs?: number;
  initialData: T;
}

export interface UsePolledActionResult<T> {
  data: T;
  /** True once the most recent poll attempt failed - `data` is whatever was
   * last successfully fetched (or the IndexedDB-cached value), not live. */
  isStale: boolean;
  lastUpdatedAt: number | null;
  refresh: () => void;
}

/**
 * Replaces the hand-rolled `useEffect` + `setInterval` polling pattern used
 * across the dashboard/POS screens, which had no `.catch` anywhere - a
 * failed tick on a network hiccup threw silently and the UI simply went
 * stale with zero feedback. This hook: (1) never lets a poll failure go
 * unhandled, (2) skips a tick if the previous one hasn't resolved yet
 * (never piles up overlapping requests on a slow connection), (3) backs off
 * exponentially after repeated failures instead of hammering a struggling
 * connection every few seconds, and (4) persists the last-good result to
 * IndexedDB (when `cacheKey` is given) so a remount - not just a failed
 * poll - still has something to show instantly, with an honest "how old is
 * this" timestamp.
 */
export function usePolledAction<T>(
  fetcher: () => Promise<T>,
  { cacheKey, intervalMs = 3000, initialData }: UsePolledActionOptions<T>,
): UsePolledActionResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const inFlight = useRef(false);
  const consecutiveFailures = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const tick = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const result = await fetcherRef.current();
      reportRequestOutcome(null);
      consecutiveFailures.current = 0;
      setIsStale(false);
      setData(result);
      const now = Date.now();
      setLastUpdatedAt(now);
      if (cacheKey) void putDashboardCache({ key: cacheKey, data: result, cachedAt: now });
    } catch (err) {
      if (classifyThrown(err) === "server-error") reportRequestOutcome(err);
      consecutiveFailures.current += 1;
      setIsStale(true);
      console.warn(`[offline] poll failed${cacheKey ? ` (${cacheKey})` : ""}:`, err);
    } finally {
      inFlight.current = false;
    }
  }, [cacheKey]);

  const refresh = useCallback(() => {
    void tick();
  }, [tick]);

  useEffect(() => {
    let cancelled = false;

    if (cacheKey) {
      void getDashboardCache<T>(cacheKey).then((cached) => {
        if (!cancelled && cached) {
          setData(cached.data);
          setLastUpdatedAt(cached.cachedAt);
        }
      });
    }

    function scheduleNext() {
      const failures = Math.min(consecutiveFailures.current, MAX_BACKOFF_STEPS);
      const delay =
        failures === 0 ? intervalMs : Math.min(intervalMs * 2 ** failures, MAX_BACKOFF_MS);
      timerRef.current = setTimeout(runAndReschedule, delay);
    }

    async function runAndReschedule() {
      if (cancelled) return;
      await tick();
      if (!cancelled) scheduleNext();
    }

    void runAndReschedule();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cacheKey, intervalMs, tick]);

  return { data, isStale, lastUpdatedAt, refresh };
}
