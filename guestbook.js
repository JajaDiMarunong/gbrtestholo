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
const NOTE_MARGIN = 36;
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
// Overlap prevention
// -------------------------------------------------------------------
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

function getNotesBoardHeight(noteCount) {
  const rows = Math.max(1, Math.ceil(noteCount / getNotesBoardColumns()));
  return Math.max(
    BOARD_HEIGHT,
    BOARD_PADDING * 2 + rows * NOTE_H + (rows - 1) * NOTE_MARGIN
  );
}

function getNoteBoardPosition(index) {
  const columns = getNotesBoardColumns();
  const gap = getNotesBoardHorizontalGap();
  return {
    x: BOARD_PADDING + (index % columns) * (NOTE_W + gap),
    y: BOARD_PADDING + Math.floor(index / columns) * (NOTE_H + NOTE_MARGIN),
  };
}

function renderNotesBoard() {
  notesBoard.innerHTML = "";
  const notesForDisplay = [...allNotesCache].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0) || a.deviceId.localeCompare(b.deviceId)
  );

  // Always recalculate positions for TV display — ignore stored x/y
  // since they were calculated for a different board size / note size
  notesForDisplay.forEach((note, idx) => {
    const pos = getNoteBoardPosition(idx);
    note.x = pos.x;
    note.y = pos.y;

    const el = document.createElement("div");
    el.className = "note-sticky" + (note.type === "photo" ? " type-photo" : "");
    el.style.left = note.x + "px";
    el.style.top = note.y + "px";
    el.style.setProperty("--rot", (note.rotation || 0) + "deg");
    el.style.transform = `rotate(${note.rotation || 0}deg)`;
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
    const dateStr = formatNoteDateShort(note.timestamp);
    nameTag.textContent = dateStr ? `${note.name || "Anonymous"} · ${dateStr}` : note.name || "Anonymous";
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
    .slice(0, 15)
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
  const dateStr = formatNoteDateFull(note.timestamp);
  noteViewName.textContent = dateStr ? `— ${note.name || "Anonymous"} · ${dateStr}` : `— ${note.name || "Anonymous"}`;
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

function formatNoteDateShort(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatNoteDateFull(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
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
