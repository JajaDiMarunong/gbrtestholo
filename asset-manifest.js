/* Update this list whenever a deployable asset is added. It is shared by the
   first-launch downloader and the service worker. */

/* Release checklist — keep these four steps together so a deploy can be
   recognised from inside the app (Settings) and the admin console (Account):
     1. Bump APP_VERSION below.
     2. Bump the ?v= suffix on app.js in index.html and admin.js in admin.html.
     3. Bump CACHE_NAME / DATA_CACHE in sw.js.
     4. Bump the ?v= suffix of any CSS file you edited.
   The build number shown on screen is read from the ?v= suffix the browser
   actually loaded, so it can never drift from the deployed files. */
self.APP_VERSION = "1.9.6";

const MUSEUM_ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./offline-store.js", "./manifest.webmanifest",
  "./asset-manifest.js", "./sw.js", "./guestbook.html", "./guestbook.css",
  "./guestbook.js", "./admin.html", "./admin-manifest.webmanifest", "./admin.css", "./admin.js",
  "./assets/background.jpg", "./assets/logo.png", "./assets/icon-192.png",
  "./assets/icons/aichat.webp", "./assets/icons/arcamera.webp", "./assets/icons/artwork.webp",
  "./assets/icons/badge.webp", "./assets/icons/leaderboard.webp",
  "./assets/crisanto-marker.jpg",
  "./assets/mcarthurmarker.jpg",
  "./assets/targets.mind",
  "./assets/crisanto.glb", "./assets/mcarthur.optimized.glb",
  "./assets/crisantoskybox.optimized.glb", "./assets/beachskybox.optimized.glb",
  "https://aframe.io/releases/1.5.0/aframe.min.js",
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
  "https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v7.0.0/dist/aframe-extras.min.js"
];

if (typeof self !== "undefined") self.MUSEUM_ASSETS = MUSEUM_ASSETS;
