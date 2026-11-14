importScripts("./asset-manifest.js");

const CACHE_NAME = "gbr-museum-assets-v55";
const DATA_CACHE = "gbr-museum-runtime-v55";

// reCAPTCHA v3 (recaptcha.js) needs google.com for its loader script, its
// hidden anchor iframe and its badge image; siteverify itself is called from
// the recaptcha-verify edge function, not from the page.
const CSP_HEADER = "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://aframe.io https://www.gstatic.com https://www.google.com https://recaptcha.google.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://www.gstatic.com https://www.google.com https://recaptcha.google.com; connect-src 'self' blob: https://*.firebasedatabase.app https://*.supabase.co https://twkgioiyfjfkppzerdii.functions.supabase.co https://cdn.jsdelivr.net https://www.gstatic.com https://aframe.io https://gbrmuseumtest.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://twkgioiyfjfkppzerdii.supabase.co https://www.google.com https://recaptcha.google.com wss://*.firebasedatabase.app; frame-src https://www.google.com https://recaptcha.google.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled((self.MUSEUM_ASSETS || []).map(async (asset) => {
      const request = new Request(asset, { mode: asset.startsWith("http") ? "no-cors" : "same-origin" });
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) await cache.put(request, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith("gbr-museum-") && name !== CACHE_NAME && name !== DATA_CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function addSecurityHeaders(response) {
  if (!response || response.status === 0) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', CSP_HEADER);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.hostname === "gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app") return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return addSecurityHeaders(cached);
    try {
      const controller = new AbortController();
      const timeoutMs = event.request.destination === "document" ? 4000 : 6000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(event.request, { signal: controller.signal }).finally(() => clearTimeout(timer));
      if (response && (response.ok || response.type === "opaque")) {
        const cache = await caches.open(DATA_CACHE);
        const securedResponse = addSecurityHeaders(response);
        cache.put(event.request, securedResponse.clone());
        return securedResponse;
      }
      if (!response || response.status === 0) {
        const fallback = await caches.match("./index.html");
        if (event.request.mode === "navigate" && fallback) return addSecurityHeaders(fallback);
        return new Response("", { status: 504, statusText: "Gateway Timeout" });
      }
      return addSecurityHeaders(response);
    } catch (error) {
      const fallback = await caches.match("./index.html");
      if (event.request.mode === "navigate" && fallback) return addSecurityHeaders(fallback);
      return new Response("", { status: 504, statusText: "Gateway Timeout" });
    }
  })());
});