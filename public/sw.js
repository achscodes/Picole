// Hand-rolled rather than Workbox/next-pwa/Serwist: Turbopack has no
// equivalent to Workbox's injectManifest/generateSW webpack plugins today,
// so there's no automated precache-manifest generation to gain either way,
// and the strict CSP on this file's own response (next.config.ts:
// script-src 'self') rules out a third-party CDN importScripts(). The scope
// needed here (three small cache strategies, no navigation preload, no
// range requests) is small enough that hand-writing it is lower-risk than
// vendoring a runtime.
const SW_VERSION = "v2";
const STATIC_CACHE = `picole-static-${SW_VERSION}`;
const OFFLINE_URL = "/offline";

// Only fixed, known-in-advance URLs - content-hashed assets under
// /_next/static/ are cached opportunistically at runtime instead (see
// isStaticAssetRequest/cacheFirst below), which is robust across deploys
// without needing a generated manifest.
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

const STATIC_PATH_PREFIXES = ["/_next/static/", "/Assets/"];
const STATIC_EXACT_PATHS = new Set(["/icon-192.png", "/icon-512.png", "/manifest.webmanifest"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // allSettled, not addAll: one flaky/missing asset must not abort the
      // whole install (addAll is atomic and would sink /offline along with
      // it - the exact asset we most need available offline).
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
    ),
  );
  // Deliberately no self.skipWaiting() here - an update sits in "waiting"
  // until the page explicitly asks for it (see the "message" listener
  // below and src/components/pwa/UpdatePrompt.tsx), so a long-lived POS
  // session is never silently switched to a new SW mid-sale.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAssetRequest(url) {
  return STATIC_EXACT_PATHS.has(url.pathname) || STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch non-GET requests. This is what keeps every Server Action
  // POST - including the POS sale RPC - completely untouched by the SW, and
  // it's intentional, not an oversight: those writes must always go
  // straight to the network (or be queued at the application layer - see
  // src/lib/offline/sync-engine.ts - never cached/replayed by the SW).
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Deliberately never cache/serve full authenticated page HTML here -
    // Cache Storage is shared by origin, not scoped per user, and this is a
    // shared-terminal environment (multiple cashiers on one device). A
    // failed navigation always falls back to the static, non-authenticated
    // /offline page instead.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isStaticAssetRequest(url)) {
    event.respondWith(cacheFirst(request));
  }
  // Everything else (RSC/flight fetches, /api/*, etc.) is left untouched -
  // never cached, always goes straight to the network.
});
