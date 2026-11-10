/* Offline data cache, Firebase write queue, first-launch asset downloader, and the
   page-shell touches both apps share: service worker registration and the guard
   against the browser's pull-to-refresh gesture. */
(function () {
  "use strict";
  const DB_NAME = "gbr-museum-offline";
  const DB_VERSION = 1;
  const DATA_STORE = "responses";
  const QUEUE_STORE = "queue";
  const ASSET_CACHE = "gbr-museum-assets-v10";
  const FIREBASE_HOST = "gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
  const nativeFetch = window.fetch.bind(window);

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DATA_STORE)) db.createObjectStore(DATA_STORE);
        if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function read(store, key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(store, "readonly").objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function write(store, value, key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(store, "readwrite").objectStore(store).put(value, key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function remove(store, key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(store, "readwrite").objectStore(store).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function allQueued() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(QUEUE_STORE, "readonly").objectStore(QUEUE_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function firebaseUrl(url) {
    try { return new URL(url, location.href).host === FIREBASE_HOST; } catch (_) { return false; }
  }

  function isEphemeral(url) {
    const path = new URL(url, location.href).pathname;
    // Presence and visit pings become meaningless while offline and would grow
    // forever during a long disconnected session. Visitor-created content is queued.
    return path.startsWith("/presence/") || path.startsWith("/analytics_visits");
  }

  function collectionUrl(url) {
    const parsed = new URL(url, location.href);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length > 1) parsed.pathname = `/${parts[0]}.json`;
    return parsed.href;
  }

  async function cacheJson(url, data) {
    await write(DATA_STORE, { data, updatedAt: Date.now() }, new URL(url, location.href).href);
  }

  async function cachedJson(url) {
    const saved = await read(DATA_STORE, new URL(url, location.href).href);
    return saved ? saved.data : undefined;
  }

  async function applyQueuedChange(entry) {
    const target = new URL(entry.url, location.href);
    const pieces = target.pathname.split("/").filter(Boolean);
    const collection = collectionUrl(entry.url);
    let data = await cachedJson(collection);
    if (!data || typeof data !== "object") data = {};
    const key = pieces.length > 1 ? pieces[1].replace(/\.json$/, "") : null;
    const body = entry.body ? JSON.parse(entry.body) : null;
    if (entry.method === "POST" && !key) data[`offline-${entry.id}`] = body;
    if (entry.method === "PUT" && key) data[key] = body;
    if (entry.method === "DELETE" && key) delete data[key];
    if (entry.method === "DELETE" && !key) data = {};
    await cacheJson(collection, data);
  }

  function timeoutFetch(url, init = {}, timeoutMs = 2000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("Network timeout")), timeoutMs);
    const signal = init.signal || controller.signal;
    return nativeFetch(url, { ...init, signal }).finally(() => clearTimeout(timer));
  }

  async function getAuthToken() {
    if (typeof firebase !== "undefined" && firebase.auth?.currentUser) {
      try {
        // Pass false so it uses the cached token without forcing a network refresh
        const tokenPromise = firebase.auth().currentUser.getIdToken(false);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 800));
        return await Promise.race([tokenPromise, timeoutPromise]);
      } catch (_) {}
    }
    return null;
  }

  async function enqueue(url, init) {
    const token = await getAuthToken();
    const authUrl = token && url.includes("firebasedatabase.app") ? `${url}${url.includes("?") ? "&" : "?"}auth=${token}` : url;
    const entry = {
      url: new URL(authUrl, location.href).href,
      method: (init.method || "POST").toUpperCase(),
      headers: init.headers || {},
      body: init.body || null,
      createdAt: Date.now()
    };
    const db = await openDb();
    const id = await new Promise((resolve, reject) => {
      const request = db.transaction(QUEUE_STORE, "readwrite").objectStore(QUEUE_STORE).add(entry);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    entry.id = id;
    await applyQueuedChange(entry);
    window.dispatchEvent(new CustomEvent("museum-offline-queued", { detail: entry }));
  }

  async function flushQueue() {
    if (!navigator.onLine) return;
    const entries = await allQueued();
    for (const entry of entries) {
      try {
        const token = await getAuthToken();
        let url = entry.url;
        if (token && url.includes("firebasedatabase.app")) {
          url = `${url}${url.includes("?") ? "&" : "?"}auth=${token}`;
        }
        const response = await timeoutFetch(url, { method: entry.method, headers: entry.headers, body: entry.body }, 4000);
        if (!response.ok) break;
        await remove(QUEUE_STORE, entry.id);
      } catch (_) { break; }
    }
  }

  window.fetch = async function offlineAwareFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input.url;
    const method = (init.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    if (!firebaseUrl(url)) return nativeFetch(input, init);

    if (method === "GET") {
      // 1. Instant offline check
      if (!navigator.onLine) {
        const offlineData = await cachedJson(url);
        if (offlineData !== undefined) {
          return new Response(JSON.stringify(offlineData), {
            status: 200,
            headers: { "Content-Type": "application/json", "X-Museum-Offline": "true" }
          });
        }
      }

      // 2. Check local IndexedDB cache
      const cached = await cachedJson(url);

      // 3. Fast timeout: If we already have cached data, don't stall the user!
      // Only wait 1200ms for network; if slow or stalling, immediately return cached data.
      const timeoutMs = cached !== undefined ? 1200 : 3000;

      try {
        const token = await getAuthToken();
        const authUrl = token && url.includes("firebasedatabase.app") ? `${url}${url.includes("?") ? "&" : "?"}auth=${token}` : url;
        const response = await timeoutFetch(authUrl, init, timeoutMs);
        if (response.ok) {
          cacheJson(url, await response.clone().json()).catch(() => {});
        }
        return response;
      } catch (error) {
        if (cached !== undefined) {
          console.warn("[offline-store] Network slow or timed out, returning cached data for:", url);
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { "Content-Type": "application/json", "X-Museum-Offline": "true" }
          });
        }
        throw error;
      }
    }

    if (!navigator.onLine) {
      if (isEphemeral(url)) return new Response(null, { status: 202 });
      await enqueue(url, init);
      return new Response(JSON.stringify({ queued: true }), { status: 202, headers: { "Content-Type": "application/json", "X-Museum-Queued": "true" } });
    }
    try {
      const token = await getAuthToken();
      const authUrl = token && url.includes("firebasedatabase.app") ? `${url}${url.includes("?") ? "&" : "?"}auth=${token}` : url;
      return await timeoutFetch(authUrl, init, 3000);
    } catch (_) {
      if (isEphemeral(url)) return new Response(null, { status: 202 });
      await enqueue(url, init);
      return new Response(JSON.stringify({ queued: true }), { status: 202, headers: { "Content-Type": "application/json", "X-Museum-Queued": "true" } });
    }
  };

  async function preloadAssets(onProgress) {
    const assets = Array.from(new Set(window.MUSEUM_ASSETS || []));
    if (!assets.length || !window.caches) return { completed: 0, total: 0, failed: 0 };
    const cache = await caches.open(ASSET_CACHE);
    let completed = 0, failed = 0;
    for (const asset of assets) {
      const request = new Request(asset, { mode: asset.startsWith("http") ? "no-cors" : "same-origin" });
      try {
        if (!(await cache.match(request))) {
          if (!navigator.onLine) throw new Error("offline");
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const response = await nativeFetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
          if (!response || (!response.ok && response.type !== "opaque")) throw new Error("download failed");
          await cache.put(request, response.clone());
        }
      } catch (error) {
        failed++;
        console.warn("Offline asset skipped or not cached:", asset, error);
      }
      completed++;
      onProgress?.({ completed, total: assets.length, failed, asset });
    }
    return { completed, total: assets.length, failed };
  }

  // Pulling the page down while it is already at the top is the browser's own
  // reload gesture, and on this app it throws away the AR session, the scanner
  // position, and anything typed but not saved yet. Chrome and Firefox can be told
  // to leave it alone in CSS (style.css and admin.css set overscroll-behavior), but
  // Safari ignores those rules, so cancel that one gesture here. Only a drag with
  // nothing left to scroll is cancelled, so lists, drawers, and modals keep
  // scrolling exactly as before.
  (function blockPullToRefresh() {
    let startY = null;
    const canScrollUp = (node) => {
      for (let el = node; el && el !== document.body; el = el.parentElement) {
        if (el.scrollTop > 0) return true;
      }
      return false;
    };
    document.addEventListener("touchstart", (event) => {
      startY = event.touches.length === 1 ? event.touches[0].clientY : null;
    }, { passive: true });
    document.addEventListener("touchend", () => { startY = null; }, { passive: true });
    document.addEventListener("touchcancel", () => { startY = null; }, { passive: true });
    document.addEventListener("touchmove", (event) => {
      if (startY === null || event.touches.length !== 1) return;
      if (event.touches[0].clientY - startY <= 0) return;
      const page = document.scrollingElement || document.documentElement;
      if (page && page.scrollTop > 0) return;
      if (canScrollUp(event.target)) return;
      if (event.cancelable) event.preventDefault();
    }, { passive: false });
  })();

  window.MuseumOffline = { preloadAssets, flushQueue, cachedJson };
  window.addEventListener("online", () => flushQueue().catch(console.warn));
  window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
    flushQueue().catch(console.warn);
  });
})();
