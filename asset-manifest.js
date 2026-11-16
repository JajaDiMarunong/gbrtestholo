self.APP_VERSION = "1.10.31";

const MUSEUM_ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./profanity-filter.js", "./offline-store.js", "./manifest.webmanifest",
  "./recaptcha.js", "./asset-manifest.js", "./sw.js", "./guestbook.html", "./guestbook.css",
  "./guestbook.js", "./admin.html", "./admin-manifest.webmanifest", "./admin.css", "./admin.js",
  "./assets/background.jpg", "./assets/logo.png", "./assets/icon-192.png",
  "./assets/icons/aichat.webp", "./assets/icons/arcamera.webp", "./assets/icons/artwork.webp",
  "./assets/icons/badge.webp", "./assets/icons/leaderboard.webp",
  "https://aframe.io/releases/1.5.0/aframe.min.js",
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
  "https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v7.0.0/dist/aframe-extras.min.js"
];

if (typeof self !== "undefined") self.MUSEUM_ASSETS = MUSEUM_ASSETS;
