// =====================================================================
// GUESTBOOK & LEADERBOARD — TV / Museum Display
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";

// -------------------------------------------------------------------
// Config
// -------------------------------------------------------------------
const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 1000;
const NOTE_W = 180;
const NOTE_H = 200;
const NOTE_MARGIN = 60; // vertical gap between note slots (also room to scatter)
const MIN_NOTE_GAP = 24;
const BOARD_PADDING = 30;
const REFRESH_INTERVAL = 5; // seconds

// -------------------------------------------------------------------
// DOM refs
// -------------------------------------------------------------------
const notesBoardWrap = document.getElementById("notes-board-wrap");
const notesBoard = document.getElementById("notes-board");
const leaderboardList = document.getElementById("leaderboard-list");
const refreshHint = document.getElementById("refresh-hint");
const statNotesCount = document.getElementById("stat-notes-count");
const statLeaderboardCount = document.getElementById("stat-leaderboard-count");
const tvClock = document.getElementById("tv-clock");
const tickerText = document.getElementById("ticker-text");

const noteViewModal = document.getElementById("note-view-modal");
const noteViewContent = document.getElementById("note-view-content");
const noteViewName = document.getElementById("note-view-name");
const btnNoteViewClose = document.getElementById("btn-note-view-close");

// -------------------------------------------------------------------
// State
// -------------------------------------------------------------------
let boardScale = 1;
let boardX = 0;
let boardY = 0;
let allNotesCache = [];
let cachedLeaderboard = [];
let refreshTimer = null;
let countdownTimer = null;
let countdown = REFRESH_INTERVAL;
let notesSignature = "";
let loadInProgress = false;

// -------------------------------------------------------------------
// Auth initialization
// -------------------------------------------------------------------
async function initAuth() {
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        console.log("[Guestbook] Auth ready:", user.uid);
        resolve(user);
      } else {
        firebase.auth().signInAnonymously()
          .then(() => {
            // Wait for the next auth state change
            const unsub2 = firebase.auth().onAuthStateChanged((u) => {
              unsub2();
              console.log("[Guestbook] Signed in anonymously as:", u?.uid);
              resolve(u);
            });
          })
          .catch((err) => {
            console.warn("[Guestbook] Anonymous sign-in failed:", err);
            resolve(null);
          });
      }
    });
  });
}

// -------------------------------------------------------------------
// Boot
// -------------------------------------------------------------------
initAuth().then(() => {
  loadData();
  startClock();
  startAutoRefresh();
});

// -------------------------------------------------------------------
// Install as an app
// -------------------------------------------------------------------
const btnInstallGuestbook = document.getElementById("btn-install-guestbook");
const installGuestbookLabel = document.getElementById("install-guestbook-label");
const guestbookStandaloneQuery = window.matchMedia("(display-mode: standalone)");
let guestbookAppInstalled = false;

function isGuestbookAppInstalled() {
  return guestbookAppInstalled || guestbookStandaloneQuery.matches || window.navigator.standalone === true;
}

function updateGuestbookInstallButton() {
  if (!btnInstallGuestbook) return;
  if (isGuestbookAppInstalled()) {
    btnInstallGuestbook.classList.add("hidden");
    return;
  }
  // The browser only hands us a prompt when this display can be installed.
  const promptReady = Boolean(window.gbrGuestbookInstallPrompt);
  if (installGuestbookLabel) installGuestbookLabel.textContent = promptReady ? "Install App" : "How to Install";
  btnInstallGuestbook.classList.remove("hidden");
}

async function installGuestbookApp() {
  if (isGuestbookAppInstalled()) {
    updateGuestbookInstallButton();
    return;
  }
  const promptEvent = window.gbrGuestbookInstallPrompt;
  if (!promptEvent) {
    window.alert("To install the GBR Museum app, open your browser menu and choose \"Install app\" or \"Add to Home Screen\".");
    return;
  }
  window.gbrGuestbookInstallPrompt = null;
  btnInstallGuestbook.disabled = true;
  try {
    await promptEvent.prompt();
    await promptEvent.userChoice;
  } catch (error) {
    console.warn("[Guestbook] Install prompt failed:", error);
  } finally {
    btnInstallGuestbook.disabled = false;
    updateGuestbookInstallButton();
  }
}

if (btnInstallGuestbook) btnInstallGuestbook.addEventListener("click", installGuestbookApp);
window.addEventListener("gbr-install-available", updateGuestbookInstallButton);
window.addEventListener("appinstalled", () => {
  guestbookAppInstalled = true;
  window.gbrGuestbookInstallPrompt = null;
  updateGuestbookInstallButton();
});
if (guestbookStandaloneQuery.addEventListener) {
  guestbookStandaloneQuery.addEventListener("change", updateGuestbookInstallButton);
}
updateGuestbookInstallButton();


// -------------------------------------------------------------------
// Auto-refresh
// -------------------------------------------------------------------
function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    loadData();
    countdown = REFRESH_INTERVAL;
  }, REFRESH_INTERVAL * 1000);

  countdownTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) countdown = REFRESH_INTERVAL;
    refreshHint.textContent = `Live · refreshing in ${countdown}s`;
  }, 1000);
}

function refreshNow() {
  countdown = REFRESH_INTERVAL;
  refreshHint.textContent = "Live · refreshing now";
  loadData();
}

window.addEventListener("focus", refreshNow);
window.addEventListener("online", refreshNow);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshNow();
});

async function loadData() {
  if (loadInProgress) return;
  loadInProgress = true;
  try {
    await Promise.all([loadNotesBoard(), loadLeaderboard(), loadStats()]);
  } finally {
    loadInProgress = false;
  }
}

// -------------------------------------------------------------------
// Clock
// -------------------------------------------------------------------
function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}
function updateClock() {
  const now = new Date();
  tvClock.textContent = now.toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// -------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------
async function loadStats() {
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const [notesRes, lbRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/notes.json${authParam}`, { cache: "no-store" }),
      fetch(`${FIREBASE_URL}/leaderboard.json${authParam}`, { cache: "no-store" }),
    ]);
    const notesData = await notesRes.json();
    const lbData = await lbRes.json();
    statNotesCount.textContent = notesData ? Object.keys(notesData).length : 0;
    statLeaderboardCount.textContent = lbData ? Object.keys(lbData).length : 0;
  } catch (err) {
    statNotesCount.textContent = "—";
    statLeaderboardCount.textContent = "—";
  }
}

// -------------------------------------------------------------------
// Board fit to viewport
// -------------------------------------------------------------------
function fitBoardToViewport() {
  const wrapW = notesBoardWrap.clientWidth;
  const wrapH = notesBoardWrap.clientHeight;
  const boardHeight = getNotesBoardHeight(allNotesCache.length);
  notesBoard.style.width = `${BOARD_WIDTH}px`;
  notesBoard.style.height = `${boardHeight}px`;
  const scaleX = wrapW / BOARD_WIDTH;
  const scaleY = wrapH / boardHeight;
  boardScale = Math.min(scaleX, scaleY, 1);
  boardX = Math.max(0, (wrapW - BOARD_WIDTH * boardScale) / 2);
  boardY = Math.max(0, (wrapH - boardHeight * boardScale) / 2);
  applyBoardTransform();
}

window.addEventListener("load", fitBoardToViewport);
window.addEventListener("resize", fitBoardToViewport);

function applyBoardTransform() {
  notesBoard.style.transform = `translate(${boardX}px, ${boardY}px) scale(${boardScale})`;
}

// -------------------------------------------------------------------
// Load Notes
// -------------------------------------------------------------------
async function loadNotesBoard() {
  try {
    const user = firebase.auth().currentUser;
    console.log("[Guestbook] Current user:", user?.uid);
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    console.log("[Guestbook] Fetching notes with auth:", !!authParam);
    const res = await fetch(`${FIREBASE_URL}/notes.json${authParam}`, { cache: "no-store" });
    console.log("[Guestbook] Notes response:", res.status, res.statusText);
    if (!res.ok) {
      const errText = await res.text();
      console.error("[Guestbook] Notes error:", errText);
      throw new Error(`status ${res.status}: ${errText}`);
    }
    const data = await res.json();
    console.log("[Guestbook] Notes data:", data);
    const newNotes = data
      ? Object.entries(data).map(([deviceId, note]) => ({ ...note, deviceId }))
      : [];

    const signature = JSON.stringify(newNotes);
    const needsRender = signature !== notesSignature;

    allNotesCache = newNotes;
    notesSignature = signature;

    if (needsRender) {
      renderNotesBoard();
      fitBoardToViewport();
    }
  } catch (err) {
    if (allNotesCache.length === 0) {
      notesBoard.innerHTML = `<p style="color:rgba(42,35,32,0.6);padding:40px;text-align:center;font-size:18px;">Couldn't load notes.</p>`;
    }
  }
}

// -------------------------------------------------------------------
// Post-it scatter layout
// -------------------------------------------------------------------
// Notes are dropped into an invisible grid of slots so two notes can never
// sit on top of each other, then every note is nudged and tilted by a small
// seeded amount. The seed comes from the note's own key, so a note keeps its
// spot through refreshes instead of dancing around every 5 seconds.
const LAYOUT_SEED = 0x6d2b79f5;
const NOTES_BASE_ROWS = 4;      // rows kept on the board even when it is empty
const NOTE_MAX_JITTER = 26;     // px a note may drift around its slot
const NOTE_JITTER_SAFETY = 2;   // px kept free so slots never touch
const NOTE_MAX_ROTATION = 8;    // degrees of "hand pinned" tilt

let noteSlotOrderCache = { key: "", order: [] };

function hashString(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getNotesBoardColumns() {
  const usableWidth = BOARD_WIDTH - BOARD_PADDING * 2;
  return Math.max(1, Math.floor((usableWidth + MIN_NOTE_GAP) / (NOTE_W + MIN_NOTE_GAP)));
}

function getNotesBoardHorizontalGap() {
  const columns = getNotesBoardColumns();
  if (columns <= 1) return 0;
  const usableWidth = BOARD_WIDTH - BOARD_PADDING * 2;
  return (usableWidth - columns * NOTE_W) / (columns - 1);
}

function getNotesBoardRows(noteCount) {
  // Keep enough rows to fill the default board so a handful of notes still
  // scatters over the whole corkboard instead of hugging one line.
  return Math.max(NOTES_BASE_ROWS, Math.ceil(Math.max(1, noteCount) / getNotesBoardColumns()));
}

function getNotesBoardHeight(noteCount) {
  const rows = getNotesBoardRows(noteCount);
  return Math.max(
    BOARD_HEIGHT,
    BOARD_PADDING * 2 + rows * NOTE_H + (rows - 1) * NOTE_MARGIN
  );
}

function getShuffledNoteSlots(rows) {
  const columns = getNotesBoardColumns();
  const cacheKey = `${rows}x${columns}`;
  if (noteSlotOrderCache.key === cacheKey) return noteSlotOrderCache.order;

  const random = mulberry32(hashString(`guestbook-slots|${cacheKey}`) ^ LAYOUT_SEED);
  const order = Array.from({ length: rows * columns }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = order[i];
    order[i] = order[j];
    order[j] = temp;
  }
  noteSlotOrderCache = { key: cacheKey, order };
  return order;
}

function getNoteSlotPosition(slotIndex) {
  const columns = getNotesBoardColumns();
  const gap = getNotesBoardHorizontalGap();
  return {
    x: BOARD_PADDING + (slotIndex % columns) * (NOTE_W + gap),
    y: BOARD_PADDING + Math.floor(slotIndex / columns) * (NOTE_H + NOTE_MARGIN),
  };
}

function getNoteSeed(note) {
  const key = note.deviceId || note.ownerId || note.id;
  const stableKey = key ? `note:${key}` : `note:${note.timestamp || 0}`;
  return hashString(stableKey) ^ LAYOUT_SEED;
}

function getNoteRotation(note, random) {
  // The phone app already stores a random tilt for each note — keep it so the
  // TV and the phone show the same sheet of paper. Older notes without one get
  // a seeded tilt instead of lying perfectly flat.
  const saved = Number(note.rotation);
  if (Number.isFinite(saved) && Math.abs(saved) >= 1) {
    return clampNumber(saved, -NOTE_MAX_ROTATION, NOTE_MAX_ROTATION);
  }
  const tilt = NOTE_MAX_ROTATION * (random() * 2 - 1);
  return tilt >= 0 ? Math.max(1.5, tilt) : Math.min(-1.5, tilt);
}

// How much wider/taller a tilted note becomes around its untilted box. This
// is what decides how far a note may drift without ever touching a neighbour.
function getNoteExpansion(rotation) {
  const radians = (Math.abs(rotation) * Math.PI) / 180;
  return {
    x: NOTE_W * Math.cos(radians) + NOTE_H * Math.sin(radians) - NOTE_W,
    y: NOTE_W * Math.sin(radians) + NOTE_H * Math.cos(radians) - NOTE_H,
  };
}

function getNoteJitterLimit(rotation) {
  const expansion = getNoteExpansion(rotation);
  const gap = getNotesBoardHorizontalGap();
  return {
    x: Math.max(0, Math.min(NOTE_MAX_JITTER, (gap - expansion.x) / 2 - NOTE_JITTER_SAFETY)),
    y: Math.max(0, Math.min(NOTE_MAX_JITTER, (NOTE_MARGIN - expansion.y) / 2 - NOTE_JITTER_SAFETY)),
  };
}

function buildNotesLayout(notes) {
  const rows = getNotesBoardRows(notes.length);
  const slotOrder = getShuffledNoteSlots(rows);
  const boardHeight = getNotesBoardHeight(notes.length);

  return notes.map((note, index) => {
    const slot = getNoteSlotPosition(slotOrder[index]);
    const random = mulberry32(getNoteSeed(note));
    const rotation = getNoteRotation(note, random);
    const expansion = getNoteExpansion(rotation);
    const jitter = getNoteJitterLimit(rotation);

    // Keep the drift inside the note's own slot, so neighbouring notes can
    // never be covered even when the board is completely full.
    const x = clampNumber(
      slot.x + (random() * 2 - 1) * jitter.x,
      expansion.x / 2,
      BOARD_WIDTH - NOTE_W - expansion.x / 2
    );
    const y = clampNumber(
      slot.y + (random() * 2 - 1) * jitter.y,
      expansion.y / 2,
      boardHeight - NOTE_H - expansion.y / 2
    );
    return { x, y, rotation };
  });
}

function renderNotesBoard() {
  notesBoard.innerHTML = "";
  const notesForDisplay = [...allNotesCache].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0) || a.deviceId.localeCompare(b.deviceId)
  );

  // Always recalculate positions for the TV display — stored x/y were picked
  // for the phone board, and the scatter layout keeps every note readable.
  const layout = buildNotesLayout(notesForDisplay);

  notesForDisplay.forEach((note, idx) => {
    const pos = layout[idx];

    const el = document.createElement("div");
    el.className = "note-sticky" + (note.type === "photo" ? " type-photo" : "");
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
    el.style.setProperty("--rot", pos.rotation + "deg");
    el.style.transform = `rotate(${pos.rotation}deg)`;
    if (note.type !== "photo") el.style.background = note.color || "#f4d35e";
    el.style.animationDelay = (idx * 0.05) + "s";

    if (note.type === "photo") {
      el.innerHTML = `<img class="note-sticky-photo" src="${note.photo}" alt="photo" />`;
    } else if (note.type === "draw") {
      el.innerHTML = `<img class="note-sticky-drawing" src="${note.drawing}" alt="drawing" />`;
    } else {
      el.innerHTML = `<div class="note-sticky-text">${escapeHtml(note.text || "")}</div>`;
    }

    const nameTag = document.createElement("div");
    nameTag.className = "note-sticky-name";
    nameTag.textContent = note.name || "Anonymous";
    el.appendChild(nameTag);

    el.addEventListener("click", () => openNoteView(note));
    notesBoard.appendChild(el);
  });
}

// -------------------------------------------------------------------
// Board pan + zoom (touch + mouse)
// -------------------------------------------------------------------
let boardLastPinchDist = null;
let boardLastTouchX = null;
let boardLastTouchY = null;

notesBoardWrap.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    boardLastPinchDist = getPinchDistance(e.touches);
  } else if (e.touches.length === 1) {
    boardLastTouchX = e.touches[0].clientX;
    boardLastTouchY = e.touches[0].clientY;
  }
}, { passive: true });

notesBoardWrap.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2 && boardLastPinchDist !== null) {
    const newDist = getPinchDistance(e.touches);
    const factor = newDist / boardLastPinchDist;
    boardScale = Math.min(2.5, Math.max(0.3, boardScale * factor));
    boardLastPinchDist = newDist;
    applyBoardTransform();
  } else if (e.touches.length === 1 && boardLastTouchX !== null) {
    const dx = e.touches[0].clientX - boardLastTouchX;
    const dy = e.touches[0].clientY - boardLastTouchY;
    boardX += dx; boardY += dy;
    boardLastTouchX = e.touches[0].clientX;
    boardLastTouchY = e.touches[0].clientY;
    applyBoardTransform();
  }
}, { passive: true });

notesBoardWrap.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) boardLastPinchDist = null;
  if (e.touches.length < 1) { boardLastTouchX = null; boardLastTouchY = null; }
}, { passive: true });

// Mouse drag
let mouseDragging = false;
let mouseLastX = 0, mouseLastY = 0;

notesBoardWrap.addEventListener("mousedown", (e) => {
  mouseDragging = true;
  mouseLastX = e.clientX; mouseLastY = e.clientY;
  notesBoardWrap.style.cursor = "grabbing";
});
window.addEventListener("mousemove", (e) => {
  if (!mouseDragging) return;
  boardX += e.clientX - mouseLastX;
  boardY += e.clientY - mouseLastY;
  mouseLastX = e.clientX; mouseLastY = e.clientY;
  applyBoardTransform();
});
window.addEventListener("mouseup", () => {
  mouseDragging = false;
  notesBoardWrap.style.cursor = "grab";
});

// -------------------------------------------------------------------
// Leaderboard
// -------------------------------------------------------------------
// The TV board shows the top 10 only; the admin panel keeps every entry.
const TOP_LEADERBOARD_LIMIT = 10;

async function loadLeaderboard() {
  try {
    const user = firebase.auth().currentUser;
    console.log("[Guestbook] Loading leaderboard, user:", user?.uid);
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/leaderboard.json${authParam}`);
    console.log("[Guestbook] Leaderboard response:", res.status, res.statusText);
    if (!res.ok) {
      const errText = await res.text();
      console.error("[Guestbook] Leaderboard error:", errText);
      throw new Error(`status ${res.status}: ${errText}`);
    }
    const data = await res.json();
    console.log("[Guestbook] Leaderboard data:", data);
    cachedLeaderboard = data ? Object.entries(data) : [];
    cachedLeaderboard.sort((a, b) => a[1].time - b[1].time);
    renderLeaderboardList();
  } catch (err) {
    console.error("[Guestbook] loadLeaderboard failed:", err);
    leaderboardList.innerHTML = `<p class="tv-leaderboard-status">Couldn't load leaderboard: ${err.message}</p>`;
  }
}

function renderLeaderboardList() {
  if (cachedLeaderboard.length === 0) {
    leaderboardList.innerHTML = `<p class="tv-leaderboard-status">No completions yet.</p>`;
    return;
  }

  leaderboardList.innerHTML = cachedLeaderboard
    .slice(0, TOP_LEADERBOARD_LIMIT)
    .map(([key, e], i) => {
      const rank = i + 1;
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
      const rankClass = rank <= 3 ? ` rank-${rank}` : "";
      return `
        <div class="tv-leaderboard-row${rankClass}">
          <span class="tv-leaderboard-rank">${medal || "#" + rank}</span>
          <span class="tv-leaderboard-name">${escapeHtml(e.name || "Anonymous")}${rank === 1 ? ' <span class="crown">👑</span>' : ""}</span>
          <span class="tv-leaderboard-time">${formatTime(e.time)}</span>
        </div>`;
    })
    .join("");
}

// -------------------------------------------------------------------
// Note view modal
// -------------------------------------------------------------------
function openNoteView(note) {
  noteViewContent.style.background = note.type === "photo" ? "#f7f4ec" : (note.color || "#f4d35e");
  if (note.type === "photo") {
    noteViewContent.innerHTML = `<img src="${note.photo}" alt="photo" />`;
  } else if (note.type === "draw") {
    noteViewContent.innerHTML = `<img src="${note.drawing}" alt="drawing" />`;
  } else {
    noteViewContent.innerHTML = `<p>${escapeHtml(note.text || "")}</p>`;
  }
  noteViewName.textContent = `— ${note.name || "Anonymous"}`;
  noteViewModal.classList.remove("hidden");
}
btnNoteViewClose.addEventListener("click", () => noteViewModal.classList.add("hidden"));

// Click outside modal to close
noteViewModal.addEventListener("click", (e) => {
  if (e.target === noteViewModal) noteViewModal.classList.add("hidden");
});

// -------------------------------------------------------------------
// Utilities
// -------------------------------------------------------------------
function formatTime(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
