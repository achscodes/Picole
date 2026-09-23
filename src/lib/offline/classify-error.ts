export type ThrownErrorKind = "network" | "server-error";

/**
 * Distinguishes "the request never reached the server" from "the server was
 * reached but the request failed". A Server Action's underlying fetch
 * throws a TypeError when the network itself is the problem (offline, DNS
 * failure, connection refused); anything else means the server ran and
 * either returned normally or threw for an application reason. This one
 * classifier backs both the connectivity heartbeat
 * (src/lib/offline/connectivity-store.ts) and the sync engine's
 * retry-vs-stop decision (src/lib/offline/sync-engine.ts), so "reachable
 * but erroring" and "unreachable" are never confused with each other.
 */
export function classifyThrown(error: unknown): ThrownErrorKind {
  if (typeof TypeError !== "undefined" && error instanceof TypeError) return "network";
  return "server-error";
}
