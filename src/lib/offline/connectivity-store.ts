import { classifyThrown } from "@/lib/offline/classify-error";
import type { ConnectivityState } from "@/lib/offline/types";

const HEARTBEAT_INTERVAL_MS = 20_000;
const HEARTBEAT_TIMEOUT_MS = 4_000;
const SLOW_HEARTBEAT_MS = 1_500;
const HEARTBEAT_HISTORY = 5;
const SERVER_ERROR_WINDOW_MS = 30_000;

type Listener = () => void;

let state: ConnectivityState = "online";
let syncing = false;
let lastServerErrorAt: number | null = null;
const heartbeatOk: boolean[] = [];
const heartbeatLatency: number[] = [];
const listeners = new Set<Listener>();
let started = false;

function emit() {
  for (const listener of listeners) listener();
}

/**
 * navigator.onLine only reflects whether the device has *a* network
 * interface up - it says nothing about whether this app's server or
 * Supabase is actually reachable (captive portals, DNS failures, or the
 * backend being down all still read as "online"). It's treated here as one
 * input among several, never as proof of reachability on its own.
 */
function computeState(): ConnectivityState {
  if (syncing) return "reconnecting";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";

  const recent = heartbeatOk.slice(-HEARTBEAT_HISTORY);
  const allFailed = recent.length > 0 && recent.every((ok) => !ok);
  if (allFailed) return "offline";

  if (lastServerErrorAt !== null && Date.now() - lastServerErrorAt < SERVER_ERROR_WINDOW_MS) {
    return "server-unavailable";
  }

  const someFailed = recent.some((ok) => !ok);
  const avgLatency =
    heartbeatLatency.length > 0
      ? heartbeatLatency.reduce((a, b) => a + b, 0) / heartbeatLatency.length
      : 0;
  if (someFailed || avgLatency > SLOW_HEARTBEAT_MS) return "poor-connection";

  return "online";
}

function recompute() {
  const next = computeState();
  if (next !== state) {
    state = next;
    emit();
  }
}

function pushSample(ok: boolean, latencyMs: number) {
  heartbeatOk.push(ok);
  heartbeatLatency.push(latencyMs);
  if (heartbeatOk.length > HEARTBEAT_HISTORY) heartbeatOk.shift();
  if (heartbeatLatency.length > HEARTBEAT_HISTORY) heartbeatLatency.shift();
}

async function heartbeat() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch("/api/health", {
      cache: "no-store",
      signal: controller.signal,
    });
    pushSample(res.ok, Date.now() - startedAt);
  } catch {
    pushSample(false, HEARTBEAT_TIMEOUT_MS);
  } finally {
    clearTimeout(timeout);
    recompute();
  }
}

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("online", () => {
    void heartbeat();
  });
  window.addEventListener("offline", recompute);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void heartbeat();
  });

  void heartbeat();
  setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);
}

/**
 * Fed by real Server Action call sites (usePolledAction, the offline sync
 * engine) with the actual outcome of a request - a stronger, more specific
 * signal than the generic heartbeat alone. Pass `null` on success (clears a
 * stale server-error flag) or the thrown/rejected value on failure.
 */
export function reportRequestOutcome(error: unknown | null) {
  if (error === null) {
    lastServerErrorAt = null;
  } else if (classifyThrown(error) === "server-error") {
    lastServerErrorAt = Date.now();
  }
  recompute();
}

/** The offline sync engine calls this while actively draining the queue so
 * the badge can show "Reconnecting" instead of a plain "Online" mid-sync. */
export function setSyncing(value: boolean) {
  syncing = value;
  recompute();
}

export function getConnectivitySnapshot(): ConnectivityState {
  ensureStarted();
  return state;
}

export function getConnectivityServerSnapshot(): ConnectivityState {
  return "online";
}

export function subscribeConnectivity(listener: Listener): () => void {
  ensureStarted();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
