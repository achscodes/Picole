import { NextResponse } from "next/server";

// Deliberately trivial: no Supabase call, no auth, not covered by
// src/proxy.ts's matcher. Polled frequently by the connectivity heartbeat
// (src/lib/offline/connectivity-store.ts) to check whether this app's own
// server is reachable at all - it says nothing about whether Supabase
// itself is up (that's inferred separately from real Server Action
// outcomes - see src/lib/offline/classify-error.ts).
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
