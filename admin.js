// =====================================================================
// ADMIN PANEL — standalone page
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const EDGE_FUNCTIONS_BASE = "https://twkgioiyfjfkppzerdii.functions.supabase.co/functions/v1";
const GROQ_PROXY_URL = `${EDGE_FUNCTIONS_BASE}/groq-proxy`;

// -------------------------------------------------------------------
// Built-in artworks
// -------------------------------------------------------------------
const BUILTIN_ARTWORKS = [
  {
    id: "builtin-crisanto",
    name: "Portrait of Crisanto de los Reyes y Mendoza",
    image: "./assets/crisanto-marker.jpg",
    artist: "Rafael del Casal",
    year: "Undated",
    location: "GBR Jr. Museum, General Trias, Philippines",
    details: "Portrait of Crisanto de los Reyes y Mendoza by Rafael del Casal.",
    baseScale: 0.5,
    icon: "🎨",
    hasModel: true,
    showInMainCollection: true,
    scannable: true,
    published: true,
    inScavengerHunt: true,
    markerImage: "./assets/crisanto-marker.jpg",
  },
{
    id: "builtin-mcarthur",
    name: "General Douglas MacArthur",
    image: "./assets/mcarthurmarker.jpg",
    artist: "GBR Jr. Museum Collection",
    year: "20th Century",
    location: "GBR Jr. Museum, General Trias, Philippines",
    details: "General Douglas MacArthur (1880–1964) was a 5-star General of the Army and one of the most prominent military leaders in American history, best known for his command of Allied forces in the Southwest Pacific during World War II. Born on January 26, 1880, in Little Rock, Arkansas, and passing away on April 5, 1964, in Washington, D.C., MacArthur played a pivotal role in the history of the Philippines—first as Field Marshal of the Philippine Army and later as Supreme Commander of Allied Forces. After being forced to evacuate Corregidor in March 1942 under direct orders from President Franklin D. Roosevelt, he famously made his enduring personal pledge to the Filipino people at Terowie Railway Station in South Australia: \"I came through and I shall return.\" He fulfilled that promise two and a half years later on October 20, 1944, when he waded ashore at Red Beach in Palo, Leyte, declaring, \"People of the Philippines, I have returned!\"—a historic landing that initiated the liberation of the archipelago and cemented his legacy in Philippine history.",
    baseScale: 1,
    icon: "🎖️",
    hasModel: true,
    showInMainCollection: true,
    scannable: true,
    published: true,
    inScavengerHunt: true,
    markerImage: "./assets/mcarthurmarker.jpg",
  },

];

// -------------------------------------------------------------------
// DOM refs
// -------------------------------------------------------------------
const screenLogin = document.getElementById("screen-login");
const adminDashboard = document.getElementById("admin-dashboard");
const adminPasswordInput = document.getElementById("admin-password-input");
const adminLoginError = document.getElementById("admin-login-error");
const btnAdminLoginSubmit = document.getElementById("btn-admin-login-submit");
const btnLogout = document.getElementById("btn-logout");
const btnInstallAdmin = document.getElementById("btn-install-admin");
const btnInstallAdminLogin = document.getElementById("btn-install-admin-login");
const btnForgotPassword = document.getElementById("btn-forgot-password");
const adminLoginStatus = document.getElementById("admin-login-status");

// Account & About tab
const accountTabButton = document.querySelector('.tab-btn[data-tab="account"]');
const accountEmail = document.getElementById("account-email");
const accountCurrentPassword = document.getElementById("account-current-password");
const accountNewPassword = document.getElementById("account-new-password");
const accountConfirmPassword = document.getElementById("account-confirm-password");
const accountPasswordStatus = document.getElementById("account-password-status");
const btnChangePassword = document.getElementById("btn-change-password");
const btnSendResetEmail = document.getElementById("btn-send-reset-email");
const adminVersionText = document.getElementById("admin-version-text");
const adminUpdateStatus = document.getElementById("admin-update-status");
const btnCheckAdminUpdates = document.getElementById("btn-check-admin-updates");
const btnLoadAdminUpdate = document.getElementById("btn-load-admin-update");
const loginVersionText = document.getElementById("login-version-text");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

const visitsFilter = document.getElementById("visits-filter");
const visitsChart = document.getElementById("visits-chart");
const visitsChartTotal = document.getElementById("visits-chart-total");

const adminLeaderboardList = document.getElementById("admin-leaderboard-list");
const adminNotesList = document.getElementById("admin-notes-list");
const adminNoteViewModal = document.getElementById("admin-note-view-modal");
const adminNoteViewContent = document.getElementById("admin-note-view-content");
const adminNoteViewName = document.getElementById("admin-note-view-name");
const btnAdminNoteViewClose = document.getElementById("btn-admin-note-view-close");
const adminArtworksList = document.getElementById("admin-artworks-list");

// AI Modal refs
const aiModal = document.getElementById("ai-modal");
const aiPasteInput = document.getElementById("ai-paste-input");
const btnAiSubmit = document.getElementById("btn-ai-submit");
const btnAiCancel = document.getElementById("btn-ai-cancel");
const btnOpenAiModal = document.getElementById("btn-open-ai-modal");
const aiModalStatus = document.getElementById("ai-modal-status");
const aiCharCount = document.getElementById("ai-char-count");

// Form refs
const imageUploadZone = document.getElementById("image-upload-zone");
const artworkImageInput = document.getElementById("artwork-image");
const imagePreview = document.getElementById("image-preview");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const btnUploadArtwork = document.getElementById("btn-upload-artwork");
const uploadStatus = document.getElementById("upload-status");
const artworkMarkerInput = document.getElementById("artwork-marker");
const artworkModelInput = document.getElementById("artwork-model");
const artworkSkyboxInput = document.getElementById("artwork-skybox");
const artworkModelScaleInput = document.getElementById("artwork-model-scale");
const artworkModelForwardInput = document.getElementById("artwork-model-forward");
const artworkImmersiveScaleInput = document.getElementById("artwork-immersive-scale");
const artworkImmersiveRotationInput = document.getElementById("artwork-immersive-rotation");
const artworkImmersiveForwardInput = document.getElementById("artwork-immersive-forward");
const artworkMainInput = document.getElementById("artwork-main");
const artworkScannableInput = document.getElementById("artwork-scannable");
const artworkPublishedInput = document.getElementById("artwork-published");
const artworkHuntInput = document.getElementById("artwork-hunt");
const btnCancelArtworkEdit = document.getElementById("btn-cancel-artwork-edit");
const btnNewArtwork = document.getElementById("btn-new-artwork");
const btnCloseArtworkDrawer = document.getElementById("btn-close-artwork-drawer");
const artworkDrawer = document.getElementById("artwork-drawer");
const artworkDrawerBackdrop = document.getElementById("artwork-drawer-backdrop");
const artworkDrawerTitle = document.getElementById("artwork-drawer-title");
const artworkDrawerEyebrow = document.getElementById("artwork-drawer-eyebrow");
const quizEditorList = document.getElementById("quiz-editor-list");
const btnAddQuizQuestion = document.getElementById("btn-add-quiz-question");
const artworkSearchInput = document.getElementById("artwork-search");
const artworkHuntFilter = document.getElementById("artwork-hunt-filter");
const artworkSelectAll = document.getElementById("artwork-select-all");
const artworkSelectionCount = document.getElementById("artwork-selection-count");
const btnBulkEdit = document.getElementById("btn-bulk-edit");
const bulkEditPanel = document.getElementById("bulk-edit-panel");
const btnBulkClose = document.getElementById("btn-bulk-close");
const btnBulkApply = document.getElementById("btn-bulk-apply");
const bulkHunt = document.getElementById("bulk-hunt");
const bulkPublished = document.getElementById("bulk-published");
const bulkScannable = document.getElementById("bulk-scannable");
const bulkMain = document.getElementById("bulk-main");
const bulkEditStatus = document.getElementById("bulk-edit-status");
const artworkCollectionStatus = document.getElementById("artwork-collection-status");
const btnBuildAr = document.getElementById("btn-build-ar");
const arBuildStatus = document.getElementById("ar-build-status");

// Marker quality refs
const markerQualityWrap = document.getElementById("marker-quality-wrap");
const markerQualityImg = document.getElementById("marker-quality-img");
const markerQualityCanvas = document.getElementById("marker-quality-canvas");
const markerQualityResolution = document.getElementById("marker-quality-resolution");
const markerQualityContrast = document.getElementById("marker-quality-contrast");
const markerQualityContrastBar = document.getElementById("marker-quality-contrast-bar");
const markerQualityFeatures = document.getElementById("marker-quality-features");
const markerQualityRating = document.getElementById("marker-quality-rating");
const btnTestMarker = document.getElementById("btn-test-marker");
const markerTestStatus = document.getElementById("marker-test-status");

// Date filter refs — Leaderboard
const lbDateFilter = document.getElementById("lb-date-filter");
const lbCustomRange = document.getElementById("lb-custom-range");
const lbDateFrom = document.getElementById("lb-date-from");
const lbDateTo = document.getElementById("lb-date-to");
const lbApplyCustom = document.getElementById("lb-apply-custom");
const lbFilterCount = document.getElementById("lb-filter-count");

// Date filter refs — Notes
const notesDateFilter = document.getElementById("notes-date-filter");
const notesCustomRange = document.getElementById("notes-custom-range");
const notesDateFrom = document.getElementById("notes-date-from");
const notesDateTo = document.getElementById("notes-date-to");
const notesApplyCustom = document.getElementById("notes-apply-custom");
const notesFilterCount = document.getElementById("notes-filter-count");

// Cached data for filtering
let cachedLeaderboard = [];
let cachedNotes = [];

// -------------------------------------------------------------------
// Release info + update check
// APP_VERSION is shared with the museum app through asset-manifest.js. The
// build number is the ?v= suffix admin.html asked this browser to load, so the
// label always reflects the files that are actually running.
// -------------------------------------------------------------------
const ADMIN_RELEASE_VERSION = (typeof self !== "undefined" && self.APP_VERSION) || "1.0.0";

function readAdminAssetBuild(scriptName) {
  const scripts = Array.from(document.scripts || []);
  const script = scripts.find((tag) => (tag.src || "").indexOf(scriptName) !== -1);
  const match = script && /[?&]v=(\d+)/.exec(script.src);
  return match ? Number(match[1]) : 0;
}

const ADMIN_BUILD = readAdminAssetBuild("admin.js");

function adminVersionLabel() {
  return ADMIN_BUILD
    ? `Console v${ADMIN_RELEASE_VERSION} · build ${ADMIN_BUILD}`
    : `Console v${ADMIN_RELEASE_VERSION}`;
}

function renderAdminVersion() {
  if (adminVersionText) adminVersionText.textContent = adminVersionLabel();
  if (loginVersionText) {
    loginVersionText.textContent = ADMIN_BUILD
      ? `v${ADMIN_RELEASE_VERSION} · build ${ADMIN_BUILD}`
      : `v${ADMIN_RELEASE_VERSION}`;
  }
}

function setAdminUpdateStatus(message, state) {
  if (!adminUpdateStatus) return;
  adminUpdateStatus.textContent = message;
  adminUpdateStatus.className = `account-status${state ? ` ${state}` : ""}`;
}

let adminUpdateCheckDone = false;

async function checkAdminUpdates() {
  if (!btnCheckAdminUpdates) return;
  btnCheckAdminUpdates.disabled = true;
  setAdminUpdateStatus("Checking the deployed build…");
  try {
    // The service worker answers from cache, so ask for a cache-busted copy of
    // the deployed page instead of trusting the local one.
    const response = await fetch(`./admin.html?_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const html = await response.text();
    const match = /admin\.js\?v=(\d+)/.exec(html);
    const deployedBuild = match ? Number(match[1]) : 0;
    if (!deployedBuild) {
      setAdminUpdateStatus("Could not read the deployed build.", "is-error");
    } else if (deployedBuild > ADMIN_BUILD) {
      setAdminUpdateStatus(`Build ${deployedBuild} is deployed — reload to use it.`);
      if (btnLoadAdminUpdate) btnLoadAdminUpdate.classList.remove("hidden");
    } else {
      setAdminUpdateStatus("This console is on the latest build.", "is-success");
      if (btnLoadAdminUpdate) btnLoadAdminUpdate.classList.add("hidden");
    }
  } catch (error) {
    console.warn("[Admin] Update check failed:", error);
    setAdminUpdateStatus("Could not check — the browser may be offline.", "is-error");
  } finally {
    btnCheckAdminUpdates.disabled = false;
    adminUpdateCheckDone = true;
  }
}

async function loadAdminUpdate() {
  if (!btnLoadAdminUpdate) return;
  btnLoadAdminUpdate.disabled = true;
  setAdminUpdateStatus("Loading the new build…");
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if (window.caches && typeof caches.keys === "function") {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.indexOf("gbr-museum-") === 0).map((name) => caches.delete(name))
      );
    }
  } catch (error) {
    console.warn("[Admin] Could not clear the offline cache:", error);
  }
  const url = new URL(window.location.href);
  url.searchParams.set("updated", String(Date.now()));
  window.location.replace(url.toString());
}

if (btnCheckAdminUpdates) btnCheckAdminUpdates.addEventListener("click", checkAdminUpdates);
if (btnLoadAdminUpdate) btnLoadAdminUpdate.addEventListener("click", loadAdminUpdate);
if (accountTabButton) {
  accountTabButton.addEventListener("click", () => {
    renderAdminVersion();
    // One automatic check per session; the Check button always re-checks.
    if (!adminUpdateCheckDone) checkAdminUpdates();
  });
}

renderAdminVersion();

if (window.location.search.indexOf("updated=") !== -1) {
  window.history.replaceState(null, "", window.location.pathname + window.location.hash);
}

// -------------------------------------------------------------------
// Login - Firebase Email/Password Auth
// Create this user in Firebase Console → Authentication → Users → Add user.
// No password is stored in the source: it is typed at runtime and can be
// changed from the Account tab (or by email reset) without touching the code.
// -------------------------------------------------------------------
const ADMIN_EMAIL = "admin@gbrmuseum.test";

btnAdminLoginSubmit.addEventListener("click", async () => {
  const password = adminPasswordInput.value;
  if (!password) {
    adminLoginError.classList.remove("hidden");
    return;
  }
  btnAdminLoginSubmit.disabled = true;
  adminLoginError.classList.add("hidden");
  console.log("[Admin] Signing in with email:", ADMIN_EMAIL);
  try {
    await firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL, password);
    const user = firebase.auth().currentUser;
    console.log("[Admin] Signed in as:", user?.uid);
    if (accountEmail) accountEmail.textContent = (user && user.email) || ADMIN_EMAIL;
    if (adminLoginStatus) adminLoginStatus.classList.add("hidden");
    hideAccountStatus();
    clearPasswordForm();
    screenLogin.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    loadAllData();
  } catch (err) {
    console.error("[Admin] Login failed:", err);
    let msg = "Login failed";
    if (err.code === "auth/wrong-password") msg = "Incorrect password";
    else if (err.code === "auth/user-not-found") msg = "Admin user not found. Create in Firebase Console: admin@gbrmuseum.test";
    else if (err.code === "auth/invalid-email") msg = "Invalid email format";
    else if (err.message) msg = err.message;
    adminLoginError.textContent = msg;
    adminLoginError.classList.remove("hidden");
  } finally {
    btnAdminLoginSubmit.disabled = false;
  }
});
adminPasswordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAdminLoginSubmit.click();
});
btnLogout.addEventListener("click", () => {
  firebase.auth().signOut();
  resetArtworkForm();
  adminDashboard.classList.add("hidden");
  screenLogin.classList.remove("hidden");
  adminPasswordInput.value = "";
  adminLoginError.classList.add("hidden");
  clearPasswordForm();
  hideAccountStatus();
  if (accountEmail) accountEmail.textContent = "—";
});

// -------------------------------------------------------------------
// Account — password management
// The sign-in account lives in Firebase Authentication, so no password is
// stored in the source. Staff can rotate it here; the change applies to every
// device that signs in with this administrator account.
// -------------------------------------------------------------------
function setAccountStatus(message, state) {
  if (!accountPasswordStatus) return;
  accountPasswordStatus.textContent = message;
  accountPasswordStatus.className = `account-status${state ? ` ${state}` : ""}`;
  accountPasswordStatus.classList.remove("hidden");
}

function hideAccountStatus() {
  if (!accountPasswordStatus) return;
  accountPasswordStatus.textContent = "";
  accountPasswordStatus.className = "account-status hidden";
}

function setLoginStatus(message, state) {
  if (!adminLoginStatus) return;
  adminLoginStatus.textContent = message;
  adminLoginStatus.className = `login-status${state ? ` ${state}` : ""}`;
}

function clearPasswordForm() {
  [accountCurrentPassword, accountNewPassword, accountConfirmPassword].forEach((field) => {
    if (field) field.value = "";
  });
}

function describeAuthError(err) {
  const code = err && err.code;
  if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
    return "That current password is not correct.";
  }
  if (code === "auth/weak-password") return "Firebase rejected that password as too weak. Use at least 8 characters.";
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a minute, then try again.";
  if (code === "auth/requires-recent-login") return "Sign out, sign back in, then change the password.";
  if (code === "auth/network-request-failed") return "No connection to Firebase. Check the internet and try again.";
  return (err && err.message) || "Something went wrong. Please try again.";
}

if (btnChangePassword) {
  btnChangePassword.addEventListener("click", async () => {
    const user = firebase.auth().currentUser;
    if (!user) {
      setAccountStatus("Sign out and sign back in before changing the password.", "is-error");
      return;
    }
    const current = accountCurrentPassword ? accountCurrentPassword.value : "";
    const next = accountNewPassword ? accountNewPassword.value : "";
    const confirm = accountConfirmPassword ? accountConfirmPassword.value : "";
    if (!current) {
      setAccountStatus("Enter the current password first.", "is-error");
      return;
    }
    if (next.length < 8) {
      setAccountStatus("The new password needs at least 8 characters.", "is-error");
      return;
    }
    if (next !== confirm) {
      setAccountStatus("The two new passwords do not match.", "is-error");
      return;
    }
    if (next === current) {
      setAccountStatus("Pick a password that is different from the current one.", "is-error");
      return;
    }

    btnChangePassword.disabled = true;
    setAccountStatus("Updating the password…");
    try {
      // Firebase only accepts a password change right after a fresh sign-in,
      // so prove the current password first and then rotate it.
      const credential = firebase.auth.EmailAuthProvider.credential(user.email || ADMIN_EMAIL, current);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(next);
      clearPasswordForm();
      setAccountStatus("Password updated. Use the new password the next time you sign in.", "is-success");
    } catch (err) {
      console.error("[Admin] Password change failed:", err);
      setAccountStatus(describeAuthError(err), "is-error");
    } finally {
      btnChangePassword.disabled = false;
    }
  });
}

if (btnSendResetEmail) {
  btnSendResetEmail.addEventListener("click", async () => {
    const user = firebase.auth().currentUser;
    const email = (user && user.email) || ADMIN_EMAIL;
    btnSendResetEmail.disabled = true;
    setAccountStatus(`Sending a reset link to ${email}…`);
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      setAccountStatus(`Reset link sent to ${email}. Open it to choose a new password.`, "is-success");
    } catch (err) {
      console.error("[Admin] Reset email failed:", err);
      setAccountStatus(describeAuthError(err), "is-error");
    } finally {
      btnSendResetEmail.disabled = false;
    }
  });
}

if (btnForgotPassword) {
  btnForgotPassword.addEventListener("click", async () => {
    btnForgotPassword.disabled = true;
    setLoginStatus(`Sending a reset link to ${ADMIN_EMAIL}…`);
    try {
      await firebase.auth().sendPasswordResetEmail(ADMIN_EMAIL);
      setLoginStatus(`Reset link sent to ${ADMIN_EMAIL}. Open it to choose a new password, then sign in here.`, "is-success");
    } catch (err) {
      console.error("[Admin] Reset email failed:", err);
      setLoginStatus(describeAuthError(err), "is-error");
    } finally {
      btnForgotPassword.disabled = false;
    }
  });
}

// -------------------------------------------------------------------
// Install as desktop app
// -------------------------------------------------------------------
let adminAppInstalled = false;
const adminStandaloneQuery = window.matchMedia("(display-mode: standalone)");
const adminInstallButtons = [btnInstallAdmin, btnInstallAdminLogin].filter(Boolean);

function isAdminAppInstalled() {
  return adminAppInstalled || adminStandaloneQuery.matches || window.navigator.standalone === true;
}

function updateAdminInstallButtons() {
  adminInstallButtons.forEach((button) => {
    button.classList.toggle("hidden", isAdminAppInstalled());
  });
}

async function installAdminApp() {
  if (isAdminAppInstalled()) {
    updateAdminInstallButtons();
    return;
  }
  const promptEvent = window.gbrAdminInstallPrompt;
  if (!promptEvent) {
    window.alert("To install GBR Admin, open your browser menu and choose \"Install GBR Admin\" or \"Apps > Install this site as an app\".");
    return;
  }
  window.gbrAdminInstallPrompt = null;
  adminInstallButtons.forEach((button) => { button.disabled = true; });
  try {
    await promptEvent.prompt();
    await promptEvent.userChoice;
  } catch (error) {
    console.warn("[Admin] Install prompt failed:", error);
  } finally {
    adminInstallButtons.forEach((button) => { button.disabled = false; });
  }
}

window.addEventListener("appinstalled", () => {
  adminAppInstalled = true;
  window.gbrAdminInstallPrompt = null;
  updateAdminInstallButtons();
});

adminInstallButtons.forEach((button) => button.addEventListener("click", installAdminApp));
if (adminStandaloneQuery.addEventListener) {
  adminStandaloneQuery.addEventListener("change", updateAdminInstallButtons);
} else if (adminStandaloneQuery.addListener) {
  adminStandaloneQuery.addListener(updateAdminInstallButtons);
}
updateAdminInstallButtons();

// -------------------------------------------------------------------
// Tabs
// -------------------------------------------------------------------
const pageTitle = document.getElementById("page-title");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    if (artworkDrawer.classList.contains("open")) resetArtworkForm();
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    tabPanels.forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${tab}`));
    if (pageTitle && btn.dataset.pageTitle) pageTitle.textContent = btn.dataset.pageTitle;
  });
});

// -------------------------------------------------------------------
// Refresh
// -------------------------------------------------------------------
document.getElementById("btn-refresh-admin").addEventListener("click", loadAllData);

async function loadAllData() {
  await Promise.all([
    loadAdminStats(),
    loadAdminLeaderboard(),
    loadAdminNotes(),
    loadAdminArtworks(),
  ]);
}

// =====================================================================
// AI ASSISTANT POPUP MODAL
// =====================================================================
btnOpenAiModal.addEventListener("click", () => {
  aiPasteInput.value = "";
  updateAiCharCount();
  aiModalStatus.textContent = "";
  aiModalStatus.className = "ai-status";
  aiModal.classList.remove("hidden");
  aiPasteInput.focus();
});

btnAiCancel.addEventListener("click", () => {
  aiModal.classList.add("hidden");
});

// Groq's chat models take roughly 128k tokens of context, so a long reference
// article is no trouble for the model itself: the old 4,000-character ceiling
// came from the public chat widget's input sanitizer, which this form inherited
// along with the textarea maxlength. Text up to AI_FILL_DIRECT_LIMIT now goes
// out in a single request, and anything longer is condensed into factual notes
// first, so a full article or data sheet still fills the form.
//
// The text is still sent as ONE user message. Splitting it into ~280-char turns
// (as this used to) inflated the prompt and made the model treat the fragments
// as separate requests, which is one reason it answered in prose instead of JSON.
function buildAiMessages(text) {
  const clean = String(text || "").trim();
  return clean ? [{ role: "user", content: clean }] : [];
}

// A long reference document is trimmed locally rather than condensed by extra
// model calls. The facts a catalog entry needs (names, dates, places, materials,
// numbers) live in a minority of the sentences, so keeping the densest ones
// carries the useful content while every extra request — and its share of the
// per-minute rate limit — disappears.
const AI_FILL_BOILERPLATE = /(cookie|subscribe|newsletter|sign in|log in|share this|read more|advertisement|all rights reserved|copyright|privacy policy|terms of use|photo(?:graph)? by|image (?:courtesy|credit)|click here|download the app|follow us)/i;
const AI_FILL_FACT_TERMS = /(built|construct|erect|paint|sculpt|design|carv|cast|establish|found|commission|complet|restor|declar|designat|install|unveil|centur|architect|engineer|collection|museum|gallery|height|width|length|diameter|dimension|material|bronze|marble|timber|stone|concrete|steel|canvas|watercolou?r|fort|bridge|church|tower|monument|shrine|heritage|histor)/gi;

// Rank one sentence by how much catalog-worthy information it carries.
function scoreReferenceSentence(sentence) {
  let score = 0;
  if (/\d/.test(sentence)) score += 3;
  if (/\b(?:1\d{3}|20\d{2})\b/.test(sentence)) score += 3;
  const names = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  if (names) score += Math.min(names.length, 3) * 2;
  const facts = sentence.match(AI_FILL_FACT_TERMS);
  if (facts) score += Math.min(facts.length, 3);
  if (sentence.length < 40) score -= 1;
  return score;
}

// Keep the opening paragraph (it names the item and its period) plus the
// highest-scoring sentences in their original order, up to the budget.
function condenseLocally(text, budget) {
  const sentences = [];
  const paragraphs = String(text || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  paragraphs.forEach((para, paraIndex) => {
    const parts = para.match(/[^.!?]+[.!?]*\s*/g) || [para];
    for (const part of parts) {
      const sentence = part.trim();
      if (!sentence) continue;
      sentences.push({
        text: sentence,
        order: sentences.length,
        para: paraIndex,
        // Subscribe prompts, copyright lines, photo credits and the like never
        // help a catalog entry, so they are not candidates at all.
        junk: AI_FILL_BOILERPLATE.test(sentence),
        score: scoreReferenceSentence(sentence) + (paraIndex === 0 ? 4 : 0),
      });
    }
  });

  const keep = new Set();
  let used = 0;
  const take = (sentence) => {
    keep.add(sentence.order);
    used += sentence.text.length + 1;
  };

  // The lead paragraph always survives, so the item still has a name.
  for (const sentence of sentences) {
    if (sentence.para !== 0 || sentence.junk) continue;
    if (used + sentence.text.length > budget * 0.4) break;
    take(sentence);
  }

  const ranked = sentences
    .filter((sentence) => !sentence.junk)
    .sort((a, b) => b.score - a.score || a.order - b.order);
  for (const sentence of ranked) {
    if (keep.has(sentence.order)) continue;
    if (used + sentence.text.length + 1 > budget) continue;
    take(sentence);
    if (used >= budget) break;
  }

  // A page that is nearly all navigation and advertising leaves too little to
  // work with, so fall back to that text rather than sending the model two lines.
  if (used < budget * 0.5) {
    for (const sentence of sentences) {
      if (keep.has(sentence.order)) continue;
      if (used + sentence.text.length + 1 > budget) continue;
      take(sentence);
      if (used >= budget) break;
    }
  }

  return sentences
    .filter((sentence) => keep.has(sentence.order))
    .map((sentence) => sentence.text)
    .join(" ");
}

// The Groq proxy substitutes a chat-style apology whenever the model returns no
// content, and the failure arrives as HTTP 200. These values drive the retry
// ladder further down so one bad generation no longer kills the whole fill.
const AI_FILL_MAX_TOKENS = 2600;
const AI_FILL_ATTEMPTS = 3;
// The older build answers in a lottery: the same request comes back complete,
// cut in half, or as the chat apology, because its output budget is fixed and
// shared with the model's own reasoning. Extra attempts are cheap (they stay well
// inside the per-minute limit) and each one is another chance at a full answer.
const AI_FILL_LEGACY_ATTEMPTS = 4;
const AI_FILL_RETRY_DELAY = 700;

function aiFillAttemptBudget() {
  return aiFillProxyIsStale ? AI_FILL_LEGACY_ATTEMPTS : AI_FILL_ATTEMPTS;
}

// What to tell the admin when every attempt failed. On the older build the cause
// is on the server, so say so instead of asking them to try the same thing again.
function aiFillFailureMessage(err) {
  const base = (err && err.message) || "Could not reach the AI. Check your connection and try again.";
  if (!aiFillProxyIsStale) return base;
  return `${base} The deployed groq-proxy function is an older build that keeps cutting answers off — redeploying it fixes this; details are in the browser console.`;
}

// Length budget for the pasted reference text. Anything up to
// AI_FILL_DIRECT_LIMIT goes to the model untouched; longer text is trimmed to
// AI_FILL_CONDENSED_BUDGET locally, so a whole article still fills the form in a
// single request instead of a chain of them. AI_FILL_HARD_LIMIT matches
// maxlength on the textarea in admin.html.
const AI_FILL_DIRECT_LIMIT = 20000;
const AI_FILL_CONDENSED_BUDGET = 19000;
const AI_FILL_HARD_LIMIT = 60000;

// An older deployment of groq-proxy is still live on some projects. That build
// clamps every message at 4,000 characters, ignores the requested token budget
// (it hard-codes 1,800 for JSON replies and 300 for chat), does not enforce
// response_format, and answers with a chat apology when the model sends nothing
// back. A 60-100 word description plus three quiz questions does not fit in its
// budget, so the model runs out of room and the fill fails with "no usable
// answer". Replies from that build carry no `model` field, which is how the page
// recognises it: from then on it trims to what the old function accepts and asks
// for a shorter answer, so the form still fills.
const AI_FILL_LEGACY_TEXT_LIMIT = 3800;
const AI_FILL_LEGACY_FLAG = "gbr_aiFillStaleProxy";
let aiFillProxyIsStale = readAiFillStaleFlag();

function readAiFillStaleFlag() {
  try { return localStorage.getItem(AI_FILL_LEGACY_FLAG) === "1"; } catch (err) { return false; }
}

// Remember the finding across reloads so the next fill starts with the small
// request instead of failing once to discover the same thing again.
function setAiFillProxyStale(isStale) {
  if (aiFillProxyIsStale === isStale) return;
  aiFillProxyIsStale = isStale;
  try {
    if (isStale) localStorage.setItem(AI_FILL_LEGACY_FLAG, "1");
    else localStorage.removeItem(AI_FILL_LEGACY_FLAG);
  } catch (err) {}
}

// Keep the character counter beside the textarea honest, and flag the point where
// the text stops going out in one piece.
function updateAiCharCount() {
  if (!aiCharCount) return;
  const length = aiPasteInput.value.length;
  aiCharCount.textContent = length.toLocaleString();
  aiCharCount.classList.toggle("over", length > AI_FILL_DIRECT_LIMIT);
}

aiPasteInput.addEventListener("input", updateAiCharCount);

function aiFillError(message, retryable) {
  const err = new Error(message);
  err.retryable = retryable !== false;
  return err;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Turn whatever the model sent back into an object: bare JSON, fenced JSON,
// JSON wrapped in prose, or JSON with trailing commas.
function extractAiJson(text) {
  if (!text || typeof text !== "string") return null;
  let candidate = text.trim();
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  candidate = candidate.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (err) {
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
    } catch (err2) {
      return null;
    }
  }
}

// Fallback prompt for the retry attempts. The full prompt above is long, and a
// model that already answered in prose tends to keep doing it; a shorter ask
// with one worked example leaves more of the token budget for the JSON itself.
const AI_FILL_PROMPT = `You are a museum cataloging assistant. The user pasted reference text about ONE collection item. If the text arrives as several consecutive user messages, treat them as one continuous reference. It may be a painting, sculpture, artifact, document, monument, heritage structure, historical site, or any other museum object. Extract catalog fields and return ONLY a valid JSON object with these exact keys: title, artist, year, location, description, quiz.

CRITICAL RULES:
1. Return ONLY the JSON object. No markdown, no code fences, no explanations, no text before or after.
2. Identify the PRIMARY subject of the text, not every person, place, or event mentioned. Use the item's own name as the title. If the name has an alias in parentheses, keep both, e.g. "Puente de Malabon (Malabon Bridge)".
3. artist: use the creator, maker, painter, sculptor, architect, or engineer only when explicitly credited. For buildings, bridges, sites, monuments, and cultural objects with no named creator, use null. Never use a government, institution, army, or historical figure as the artist unless the text says they created the item.
4. year: use the item's creation, construction, or completion period. Prefer the date it was made or built over unrelated event dates. Keep qualifiers such as "19th century", "c. 1899", or "Undated". If several dates appear, choose the one describing when the item was created.
5. location: use the item's current location or the place where it was built or displayed, based only on the text. Do not invent a museum or city.
6. description: 3-4 concise sentences (about 60-100 words). Summarize what the item is, its origin or period, and its historical significance. Do not copy the entire input.
7. quiz: exactly 3 multiple-choice questions answerable only from the supplied text. Each item must use this shape: {"question":"...","options":["...","...","...","..."],"correctIndex":0}. Every question must have exactly 4 options. correctIndex is the zero-based index of the correct answer. Test different facts, and make wrong options plausible but clearly incorrect.
8. Use null only when the information is truly absent. Never use null for quiz; always provide exactly 3 questions.
9. If the text covers multiple objects, catalog the first or main item and ignore unrelated details.
10. The JSON must be complete and valid. Keep wording concise so the full response fits.

Examples:
Input: "The Starry Night is an oil-on-canvas painting by Dutch Post-Impressionist painter Vincent van Gogh. Painted in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence. It has been in the permanent collection of the Museum of Modern Art in New York City since 1941."
Output: {"title":"The Starry Night","artist":"Vincent van Gogh","year":"1889","location":"MoMA, New York","description":"A swirling night sky over a village, painted by Van Gogh in 1889 while he was at an asylum in Saint-Rémy-de-Provence. It is one of the most recognized works in Western art.","quiz":[{"question":"Who painted The Starry Night?","options":["Vincent van Gogh","Claude Monet","Pablo Picasso","Leonardo da Vinci"],"correctIndex":0},{"question":"In which year was The Starry Night painted?","options":["1889","1901","1750","1941"],"correctIndex":0},{"question":"Where is The Starry Night permanently displayed?","options":["MoMA, New York","The Louvre, Paris","National Gallery, London","Prado Museum, Madrid"],"correctIndex":0}]}

Input: "Portrait of Crisanto de los Reyes y Mendoza by Rafael del Casal. Undated. Located at GBR Jr. Museum, General Trias, Philippines."
Output: {"title":"Portrait of Crisanto de los Reyes y Mendoza","artist":"Rafael del Casal","year":"Undated","location":"GBR Jr. Museum, General Trias, Philippines","description":"Portrait of Crisanto de los Reyes y Mendoza by Rafael del Casal.","quiz":[{"question":"Who painted the portrait of Crisanto de los Reyes y Mendoza?","options":["Rafael del Casal","Juan Luna","Felix Hidalgo","Fabian de la Rosa"],"correctIndex":0},{"question":"Where is this portrait located?","options":["GBR Jr. Museum, General Trias","National Museum, Manila","Ayala Museum, Makati","The Louvre, Paris"],"correctIndex":0},{"question":"What year is listed for this portrait?","options":["Undated","1889","1910","1930"],"correctIndex":0}]}

Input: "The historic Puente de Malabon (Malabon Bridge) was constructed during the 19th century under the Spanish colonial administration to span the Malabon-Tullahan river network, serving as a commercial artery connecting Tambobong (modern-day Malabon) to trade routes into Manila. Built primarily of masonry and stone arches, it carried goods, livestock, and produce moved by river barges and land carriages. During the Philippine-American War in 1899, Filipino revolutionary forces deliberately blew out one of its stone spans to stall advancing American troops. It was later rebuilt in reinforced concrete and steel."
Output: {"title":"Puente de Malabon (Malabon Bridge)","artist":null,"year":"19th century","location":"Malabon, Philippines","description":"A 19th-century stone-arch bridge built under Spanish colonial rule to connect Tambobong, now Malabon, with trade routes into Manila. It was damaged during the Philippine-American War in 1899 when Filipino forces destroyed one of its stone spans. The bridge was later rebuilt with reinforced concrete and steel.","quiz":[{"question":"What was the bridge's primary purpose?","options":["Connecting trade routes to Manila","Serving as a military fortress","Irrigating nearby farms","Housing colonial offices"],"correctIndex":0},{"question":"During which conflict was one of its stone spans destroyed?","options":["Philippine-American War","World War II","Spanish-American War","Philippine Revolution"],"correctIndex":0},{"question":"What materials were used in its later rebuilds?","options":["Reinforced concrete and steel","Bamboo and timber","Marble and bronze","Adobe and coral stone"],"correctIndex":0}]}`;

const AI_FILL_COMPACT_PROMPT = `You are a museum cataloging assistant. The user pasted reference text about ONE museum item: a painting, sculpture, artifact, document, monument, heritage structure, or historic site. Treat the whole text as the description of a single item.

Reply with one valid JSON object and nothing else. No markdown, no code fences, no commentary. Required keys: title, artist, year, location, description, quiz.

Rules:
- title: the item's own name, keeping any alias in parentheses, for example "Puente de Malabon (Malabon Bridge)".
- artist: only when a creator is explicitly credited, otherwise null. Never use a government, institution, army, or historical figure as the artist.
- year: when the item was created, built, or completed, with qualifiers such as "19th century" or "c. 1899". Use null if unknown.
- location: where it is now, or where it was built, based only on the text. Use null if unknown.
- description: 3-4 sentences, about 60-100 words.
- quiz: exactly 3 multiple-choice questions answerable from the text. Each question uses the shape {"question":"...","options":["...","...","...","..."],"correctIndex":0} with exactly 4 options, and correctIndex is the zero-based index of the right answer.

Example output:
{"title":"The Starry Night","artist":"Vincent van Gogh","year":"1889","location":"MoMA, New York","description":"A swirling night sky over a village, painted in 1889 while Van Gogh was at an asylum in Saint-Remy-de-Provence. It is among the most recognized works in Western art.","quiz":[{"question":"Who painted The Starry Night?","options":["Vincent van Gogh","Claude Monet","Pablo Picasso","Leonardo da Vinci"],"correctIndex":0},{"question":"In which year was it painted?","options":["1889","1901","1750","1941"],"correctIndex":0},{"question":"Where is it permanently displayed?","options":["MoMA, New York","The Louvre, Paris","The Prado, Madrid","The Uffizi, Florence"],"correctIndex":0}]}`;

// The older proxy build stops mid-answer when the model runs out of its fixed
// output budget, which leaves JSON that simply never closes. Cutting back to the
// last complete value and closing the open brackets keeps the fields that did
// arrive instead of discarding a reply that already names the item.
function repairAiJson(text) {
  let candidate = String(text || "").trim();
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  candidate = candidate.slice(start);

  const scan = (fragment) => {
    const open = [];
    let inString = false;
    let escaped = false;
    let lastQuote = -1;
    for (let i = 0; i < fragment.length; i++) {
      const ch = fragment[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') { inString = false; lastQuote = i; }
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{" || ch === "[") open.push(ch);
      else if (ch === "}" || ch === "]") {
        if (open.length && open[open.length - 1] === (ch === "}" ? "{" : "[")) open.pop();
      }
    }
    return { open, inString, lastQuote };
  };

  // A value that stopped mid-string is dropped, along with a key that never got
  // a value; both would only add half a word to the form.
  const first = scan(candidate);
  if (first.inString) {
    if (first.lastQuote < 1) return null;
    candidate = candidate.slice(0, first.lastQuote + 1);
  }
  candidate = candidate
    .replace(/[{,]\s*"[^"]*"\s*:?\s*$/, "")
    .replace(/[,\s]+$/, "");
  if (candidate.length < 2) return null;

  const { open } = scan(candidate);
  let closed = candidate;
  for (let i = open.length - 1; i >= 0; i--) closed += open[i] === "{" ? "}" : "]";
  try {
    const parsed = JSON.parse(closed);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    return null;
  }
}

// A recovered answer is only worth filling the form with when it names the item
// and carries either a usable description or at least one complete question.
function isUsableAiPartial(parsed) {
  if (!parsed || typeof parsed.title !== "string" || !parsed.title.trim()) return false;
  const description = typeof parsed.description === "string" ? parsed.description.trim() : "";
  return description.length >= 60 || sanitizeQuiz(parsed.quiz).length > 0;
}

// The prompt for the older proxy build, whose output budget is fixed at 1,800
// tokens however much the page asks for, and which does not enforce JSON mode.
// Length is the whole trick here: measured against the live function, this bare
// schema returns a complete answer five times out of six, while the same request
// carrying a worked example and prose rules is cut off or comes back empty nearly
// every time. So it stays a schema and nothing else. Redeploy groq-proxy and the
// page goes back to the full prompt, longer text, and a longer description.
const AI_FILL_LEGACY_PROMPT = `Reply with one JSON object and nothing else, no markdown:
{"title":string,"artist":string|null,"year":string|null,"location":string|null,"description":string,"quiz":[{"question":string,"options":[string,string,string,string],"correctIndex":number}]}
The description must be exactly 2 sentences. The quiz must have exactly 3 questions answerable from the text, each with 4 short options.`;

// The deployed proxy answers with a chat apology when the model sends nothing
// back, so treat "no JSON at all" as an empty answer rather than a parse bug.
function looksLikeNoAnswer(text) {
  return !text.includes("{") || /couldn't come up with an answer/i.test(text);
}

async function requestAiFill(messages, systemPrompt, maxTokens) {
  const res = await fetch(GROQ_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      systemPrompt,
      jsonMode: true,
      maxTokens: maxTokens || AI_FILL_MAX_TOKENS,
    }),
  });

  let payload = null;
  try { payload = await res.json(); } catch (err) {}
  console.log("[AI] Raw response:", payload);

  if (!res.ok) {
    const detail = payload && payload.error ? payload.error : `API returned ${res.status} ${res.statusText}`;
    console.error("[AI] API error:", res.status, payload);
    const retryAfter = Number(res.headers.get("retry-after"));
    // A rate limit that lasts longer than a short pause is not worth sitting
    // through: say so plainly instead of failing three times in a row.
    if (res.status === 429 && retryAfter > 20) {
      throw aiFillError(
        `The AI is rate limited right now. Wait about ${Math.ceil(retryAfter)} seconds, then try again.`,
        false,
      );
    }
    // 429 and 5xx are worth another attempt; a bad request or bad key is not.
    const err = aiFillError(detail, res.status === 429 || res.status >= 500);
    if (Number.isFinite(retryAfter) && retryAfter > 0) err.retryAfter = retryAfter;
    throw err;
  }

  const raw = String((payload && payload.content) || "").trim();
  // Every current revision reports which model answered; a reply without it means
  // the deployed function predates this page, so its 4,000-character cap and its
  // fixed output budget are still in force. Remember that and answer with a
  // smaller request instead of failing the same way on every attempt.
  const legacyProxy = !!payload && payload.model === undefined;
  // A network failure gives no payload at all, which says nothing about the
  // deployed build; only a real reply is allowed to change the finding.
  if (payload) setAiFillProxyStale(legacyProxy);
  if (legacyProxy) {
    console.warn("[AI] groq-proxy reply has no model field — the deployed function is an older build. Using a shorter request; redeploy groq-proxy for full-length fills.");
  }
  if (payload && payload.model) console.log("[AI] Model:", payload.model, "finish:", payload.finishReason);
  if (!raw) throw aiFillError("The AI returned an empty answer.", true);

  let parsed = extractAiJson(raw);
  let partial = false;
  if (!parsed) {
    // A reply that stopped mid-JSON still holds the fields that arrived.
    const recovered = repairAiJson(raw);
    partial = !!recovered && isUsableAiPartial(recovered);
    if (partial) {
      console.warn("[AI] Answer was cut off; recovered the complete fields:", recovered);
      parsed = recovered;
    }
  }
  if (!parsed) {
    console.error("[AI] Unparseable content:", raw.substring(0, 300));
    const err = aiFillError(
      looksLikeNoAnswer(raw)
        ? "The AI sent no usable answer. Please try again."
        : "The AI returned malformed JSON. Please try again.",
      true,
    );
    err.raw = raw;
    throw err;
  }
  if (partial) parsed.__partial = true;
  return parsed;
}

function applyAiFillResult(parsed) {
  if (parsed.title) document.getElementById("artwork-name").value = parsed.title;
  if (parsed.artist !== undefined) document.getElementById("artwork-artist").value = parsed.artist || "";
  if (parsed.year !== undefined) document.getElementById("artwork-year").value = parsed.year || "";
  if (parsed.location !== undefined) document.getElementById("artwork-location").value = parsed.location || "";
  if (parsed.description) document.getElementById("artwork-details").value = parsed.description;

  const generatedQuiz = sanitizeQuiz(parsed.quiz);
  if (generatedQuiz.length > 0) renderQuizEditor(generatedQuiz);

  // A cut-off answer is worth handing over, but it must not look like a clean
  // one: say so and leave the dialog open so the fields get read before saving.
  if (parsed.__partial) {
    aiModalStatus.textContent = "⚠️ The AI answer was cut off. Filled from what arrived — please review the description and quiz before saving.";
    aiModalStatus.className = "ai-status error";
    return generatedQuiz.length;
  }

  aiModalStatus.textContent = generatedQuiz.length > 0
    ? "✅ Fields and quiz filled! Closing…"
    : "✅ Fields filled! Quiz could not be generated.";
  aiModalStatus.className = "ai-status success";

  setTimeout(() => {
    aiModal.classList.add("hidden");
  }, 1200);

  return generatedQuiz.length;
}

// Trim a text to what one request may carry. A document with no sentence breaks
// cannot be trimmed by sentence, so the plain character budget is the fallback.
function fitAiTextForLimit(text, limit) {
  const value = String(text || "");
  if (value.length <= limit) return value;
  const condensed = condenseLocally(value, limit);
  return condensed.length >= 200 ? condensed : value.slice(0, limit);
}

// Decide how the pasted text reaches the model: as-is for a normal article,
// trimmed to its fact-dense sentences when it is longer than one request should
// carry. Either way the fill costs a single request, so a long paste can no
// longer exhaust the per-minute rate limit with retries on top.
function prepareAiText(raw, onProgress) {
  const text = String(raw || "").trim();
  if (text.length > AI_FILL_HARD_LIMIT) {
    throw aiFillError(
      `That reference text is ${text.length.toLocaleString()} characters, over the ${AI_FILL_HARD_LIMIT.toLocaleString()} limit. Trim it and try again.`,
      false,
    );
  }
  // The older function build cuts anything past 4,000 characters on the server,
  // where the model cannot see the rest; trimming here keeps the fact-dense part
  // of a long article instead of letting it be chopped mid-sentence.
  const limit = aiFillProxyIsStale ? AI_FILL_LEGACY_TEXT_LIMIT : AI_FILL_DIRECT_LIMIT;
  if (text.length <= limit) return text;

  if (onProgress) {
    onProgress(aiFillProxyIsStale
      ? "Shortening the text to fit the deployed AI function…"
      : "Shortening the long reference text…");
  }
  return fitAiTextForLimit(text, Math.min(limit, AI_FILL_CONDENSED_BUDGET));
}

// The prompt this page opens with: the full one when the deployed function is
// current, the small one when we already know it is the older build.
function aiFillPromptForAttempt() {
  return aiFillProxyIsStale ? AI_FILL_LEGACY_PROMPT : AI_FILL_PROMPT;
}

// Attempts 2..N use the smaller retry prompt. The first attempt opens with the
// full prompt — or straight to the bare schema once the deployed build is known
// to be the older one — because it gives the best result when it is answered.
async function aiFillWithRetries(preparedText, waitSeconds) {
  let lastError = null;
  let waitMs = waitSeconds > 0 ? Math.min(waitSeconds * 1000, 20000) : 0;
  for (let attempt = 2; attempt <= aiFillAttemptBudget(); attempt++) {
    const total = aiFillAttemptBudget();
    // A 429 says how long to wait; retrying sooner only burns the remaining
    // attempts against a budget that has not recovered yet.
    const delay = waitMs || AI_FILL_RETRY_DELAY * (attempt - 1);
    aiModalStatus.textContent = waitMs
      ? `Rate limited — retrying in ${Math.ceil(delay / 1000)}s…`
      : `Retrying (${attempt} of ${total})…`;
    aiModalStatus.className = "ai-status";
    await sleep(delay);
    waitMs = 0;
    // The reply to the first attempt already told us which build is deployed.
    // The older one needs a shorter text and a smaller answer, so both are cut
    // down here rather than sending something it cannot finish.
    const retryText = aiFillProxyIsStale
      ? fitAiTextForLimit(preparedText, AI_FILL_LEGACY_TEXT_LIMIT)
      : preparedText;
    const retryPrompt = aiFillProxyIsStale ? AI_FILL_LEGACY_PROMPT : AI_FILL_COMPACT_PROMPT;
    try {
      return await requestAiFill(buildAiMessages(retryText), retryPrompt);
    } catch (err) {
      console.warn(`[AI] Retry ${attempt} failed:`, err.message);
      lastError = err;
      if (err.retryable === false) break;
      if (err.retryAfter) waitMs = Math.min(err.retryAfter * 1000, 20000);
    }
  }
  throw lastError || aiFillError("The AI could not fill the form.", true);
}

btnAiSubmit.addEventListener("click", async () => {
  const query = aiPasteInput.value.trim();
  if (!query) {
    aiModalStatus.textContent = "Please paste some info about the artwork first.";
    aiModalStatus.className = "ai-status error";
    return;
  }

  aiModalStatus.textContent = "Thinking…";
  aiModalStatus.className = "ai-status";
  btnAiSubmit.disabled = true;

  // A very long reference text is trimmed to its fact-dense sentences here, so
  // the whole document still goes out as one request.
  let preparedText = query;
  try {
    preparedText = prepareAiText(query, (message) => {
      aiModalStatus.textContent = message;
      aiModalStatus.className = "ai-status";
    });
  } catch (prepErr) {
    console.error("[AI] Could not prepare the reference text:", prepErr);
    aiModalStatus.textContent = prepErr.message || "Could not read that reference text. Please try again.";
    aiModalStatus.className = "ai-status error";
    btnAiSubmit.disabled = false;
    return;
  }

  try {
    console.log("[AI] Sending request to Groq proxy…");
    const parsed = await requestAiFill(buildAiMessages(preparedText), aiFillPromptForAttempt());
    console.log("[AI] Parsed object:", parsed);

    applyAiFillResult(parsed);

  } catch (err) {
    console.error("[AI] Attempt 1 failed:", err, err.raw ? err.raw.substring(0, 300) : "");
    // Stop right away on errors a retry cannot fix (bad request, bad key).
    if (err.retryable === false) {
      aiModalStatus.textContent = err.message || "Unknown error. Check the browser console (F12) for details.";
      aiModalStatus.className = "ai-status error";
      return;
    }
    try {
      const parsed = await aiFillWithRetries(preparedText, err.retryAfter);
      console.log("[AI] Retry succeeded:", parsed);
      applyAiFillResult(parsed);
    } catch (retryErr) {
      console.error("[AI] All attempts failed:", retryErr);
      aiModalStatus.textContent = aiFillFailureMessage(retryErr);
      aiModalStatus.className = "ai-status error";
    }
  } finally {
    btnAiSubmit.disabled = false;
  }
});

// =====================================================================
// STATS
// =====================================================================
const STATS_DAY_MS = 24 * 60 * 60 * 1000;
let cachedVisitTimestamps = [];
let visitDataError = false;
let currentVisitsRange = "week";
let cachedKnownDevices = new Set();
let cachedLeaderboardStats = [];
let cachedNoteStats = [];
let cachedArtworkStats = [];

async function loadAdminStats() {
  await Promise.all([loadActiveNow(), loadVisitData(), loadCounts()]);
  renderVisitsChart(currentVisitsRange);
  renderAnalytics();
  setStatText(
    "stats-updated",
    `Updated ${new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
  );
}

function setStatText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function startOfLocalDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function percentOf(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatHourRange(hour) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date();
  end.setHours((hour + 1) % 24, 0, 0, 0);
  const startLabel = start.toLocaleTimeString(undefined, { hour: "numeric" });
  const endLabel = end.toLocaleTimeString(undefined, { hour: "numeric" });
  return `${startLabel}–${endLabel}`;
}

async function loadActiveNow() {
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/presence.json${authParam}`);
    const data = await res.json();
    const entries = data ? Object.entries(data) : [];
    const activeCount = entries.filter(([, p]) => p && Date.now() - (p.timestamp || 0) < 60000).length;
    cachedKnownDevices = new Set(entries.map(([key]) => key));
    setStatText("stat-active-now", activeCount);
  } catch (err) {
    cachedKnownDevices = new Set();
    setStatText("stat-active-now", "—");
  }
}

async function loadCounts() {
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const [artRes, lbRes, notesRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/artworks.json${authParam}`),
      fetch(`${FIREBASE_URL}/leaderboard.json${authParam}`),
      fetch(`${FIREBASE_URL}/notes.json${authParam}`),
    ]);
    const artData = await artRes.json();
    const lbData = await lbRes.json();
    const notesData = await notesRes.json();

    cachedArtworkStats = [...BUILTIN_ARTWORKS, ...(artData ? Object.values(artData) : [])];
    cachedLeaderboardStats = lbData ? Object.entries(lbData) : [];
    cachedNoteStats = notesData ? Object.entries(notesData) : [];

    const uploadedCount = artData ? Object.keys(artData).length : 0;
    setStatText("stat-artwork-count", BUILTIN_ARTWORKS.length + uploadedCount);
    setStatText("stat-leaderboard-count", cachedLeaderboardStats.length);
    setStatText("stat-notes-count", cachedNoteStats.length);
  } catch (err) {
    cachedArtworkStats = [];
    cachedLeaderboardStats = [];
    cachedNoteStats = [];
    setStatText("stat-artwork-count", "—");
    setStatText("stat-leaderboard-count", "—");
    setStatText("stat-notes-count", "—");
  }
}

async function loadVisitData() {
  visitDataError = false;
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/analytics_visits.json${authParam}`);
    if (!res.ok) throw new Error(`analytics_visits: ${res.status} ${await res.text()}`);
    const data = await res.json();
    cachedVisitTimestamps = data
      ? Object.values(data).map((v) => v && v.timestamp).filter((t) => Number.isFinite(t))
      : [];

    const staleCutoff = Date.now() - 35 * STATS_DAY_MS;
    const staleEntries = data ? Object.entries(data).filter(([, v]) => v && v.timestamp < staleCutoff) : [];
    for (const [key] of staleEntries) {
      const authParam2 = user ? `?auth=${await user.getIdToken()}` : "";
      fetch(`${FIREBASE_URL}/analytics_visits/${key}.json${authParam2}`, { method: "DELETE" }).catch(() => {});
    }
  } catch (err) {
    cachedVisitTimestamps = [];
    visitDataError = true;
    console.error("[Admin] Could not load analytics:", err);
  }
}

function renderAnalytics() {
  const now = Date.now();
  const todayStart = startOfLocalDay(now);
  const weekStart = todayStart - 6 * STATS_DAY_MS;
  const previousWeekStart = weekStart - 7 * STATS_DAY_MS;
  const yesterdayStart = todayStart - STATS_DAY_MS;

  const visits = cachedVisitTimestamps.filter((t) => Number.isFinite(t));
  const todayVisits = visits.filter((t) => t >= todayStart).length;
  const yesterdayVisits = visits.filter((t) => t >= yesterdayStart && t < todayStart).length;
  const weekVisits = visits.filter((t) => t >= weekStart).length;
  const previousWeekVisits = visits.filter((t) => t >= previousWeekStart && t < weekStart).length;

  const noteCount = cachedNoteStats.length;
  const completionCount = cachedLeaderboardStats.length;
  const recentNoteCount = cachedNoteStats.filter(([, note]) => Number(note && note.timestamp) >= weekStart).length;

  setStatText("stat-visits-today", todayVisits);
  setStatText("stat-visits-week", weekVisits);
  setStatText("stat-visits-today-note", yesterdayVisits === 0 ? "No visits yesterday" : `${yesterdayVisits} yesterday`);
  setStatText("stat-notes-note", recentNoteCount === 0 ? "No notes in the last 7 days" : `${recentNoteCount} added in the last 7 days`);

  const weekChange = previousWeekVisits > 0
    ? Math.round(((weekVisits - previousWeekVisits) / previousWeekVisits) * 100)
    : null;
  setStatText(
    "stat-visits-week-note",
    weekChange === null
      ? (weekVisits > 0 ? "First week of recorded activity" : "No visits recorded yet")
      : `${weekChange >= 0 ? "+" : ""}${weekChange}% vs previous week`
  );

  const knownVisitors = new Set(cachedKnownDevices);
  cachedLeaderboardStats.forEach(([key, entry]) => knownVisitors.add(entry && entry.deviceId ? entry.deviceId : key));
  cachedNoteStats.forEach(([key]) => knownVisitors.add(key));
  const visitorCount = knownVisitors.size;
  const completionRate = Math.min(100, percentOf(completionCount, visitorCount));
  setStatText(
    "stat-completions-note",
    visitorCount > 0 ? `${completionRate}% of known visitors finished` : "No visitor activity yet"
  );

  const weekdayCounts = Array(7).fill(0);
  const recentCutoff = now - 28 * STATS_DAY_MS;
  visits.filter((t) => t >= recentCutoff).forEach((t) => {
    weekdayCounts[new Date(t).getDay()]++;
  });
  const busiestWeekday = weekdayCounts.indexOf(Math.max(...weekdayCounts));
  const busiestWeekdayCount = weekdayCounts[busiestWeekday];
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  setStatText(
    "insight-busiest-day",
    busiestWeekdayCount > 0 ? `${weekdayNames[busiestWeekday]} · ${busiestWeekdayCount}` : "No visits yet"
  );

  const hourCounts = Array(24).fill(0);
  visits.forEach((t) => {
    hourCounts[new Date(t).getHours()]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourCount = hourCounts[peakHour];
  setStatText("insight-peak-hour", peakHourCount > 0 ? `${formatHourRange(peakHour)} · ${peakHourCount}` : "No visits yet");

  const dailyAverage = weekVisits / 7;
  setStatText(
    "insight-daily-average",
    weekVisits > 0 ? `${dailyAverage % 1 === 0 ? dailyAverage : dailyAverage.toFixed(1)} visits / day` : "No visits yet"
  );
  setStatText(
    "insight-week-change",
    weekChange === null
      ? (weekVisits > 0 ? "No previous data" : "No visits yet")
      : `${weekChange >= 0 ? "+" : ""}${weekChange}%`
  );

  const completionTimes = cachedLeaderboardStats
    .map(([, entry]) => Number(entry && entry.time))
    .filter((time) => Number.isFinite(time) && time >= 0);
  if (completionTimes.length > 0) {
    const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    setStatText("insight-average-completion", formatTime(Math.round(averageTime)));
    setStatText("insight-fastest-completion", formatTime(Math.min(...completionTimes)));
  } else {
    setStatText("insight-average-completion", "No completions yet");
    setStatText("insight-fastest-completion", "No completions yet");
  }

  setStatText("journey-rate", `${completionRate}%`);
  setStatText("journey-completed", completionCount);
  setStatText("journey-visitors", visitorCount);
  setStatText("journey-notes", noteCount);
  const donut = document.getElementById("journey-donut");
  if (donut) donut.style.setProperty("--pct", String(completionRate));
  setStatText(
    "journey-footnote",
    visitorCount > 0
      ? `Based on ${visitorCount} visitor device${visitorCount === 1 ? "" : "s"} seen across presence, completion, and guestbook records.`
      : "No visitor devices have been recorded yet."
  );

  const noteMix = { text: 0, draw: 0, photo: 0 };
  cachedNoteStats.forEach(([, note]) => {
    const type = note && (note.type === "draw" || note.type === "photo") ? note.type : "text";
    noteMix[type]++;
  });
  const totalNotes = noteMix.text + noteMix.draw + noteMix.photo;
  ["text", "draw", "photo"].forEach((type) => {
    const value = noteMix[type];
    setStatText(`note-mix-${type}-count`, `${value} · ${percentOf(value, totalNotes)}%`);
    const bar = document.getElementById(`note-mix-${type}-bar`);
    if (bar) bar.style.width = `${percentOf(value, totalNotes)}%`;
  });
  setStatText(
    "note-mix-summary",
    totalNotes > 0
      ? `${recentNoteCount} added in the last 7 days · ${totalNotes} note${totalNotes === 1 ? "" : "s"} on the board.`
      : "No guestbook notes yet."
  );

  const artworks = cachedArtworkStats;
  const published = artworks.filter((art) => art && art.published !== false).length;
  const scannable = artworks.filter((art) => art
    && art.published !== false
    && art.scannable !== false
    && (art.markerImageUrl || art.markerImage || art.imageUrl || art.image)).length;
  const models = artworks.filter((art) => art && (art.hasModel || art.modelUrl)).length;
  const readiness = percentOf(scannable, artworks.length);

  setStatText("stat-artwork-count", artworks.length);
  setStatText("stat-artwork-published", published);
  setStatText("stat-artwork-scannable", scannable);
  setStatText("stat-artwork-models", models);
  setStatText("readiness-percent", `${readiness}%`);
  const readinessBar = document.getElementById("readiness-bar");
  if (readinessBar) readinessBar.style.width = `${readiness}%`;
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function renderVisitsChart(range) {
  const DAY = 24 * 60 * 60 * 1000;
  const timestamps = cachedVisitTimestamps;
  let bars = [];

  if (visitDataError) {
    visitsChart.innerHTML = `<p class="leaderboard-status">Couldn't load analytics data. Check the database rules and admin login.</p>`;
    visitsChartTotal.textContent = "";
    return;
  }

  if (range === "week" || range === "lastweek") {
    const thisWeekStart = getWeekStart(new Date());
    const weekStart = range === "lastweek" ? new Date(thisWeekStart.getTime() - 7 * DAY) : thisWeekStart;
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const binStart = weekStart.getTime() + i * DAY;
      const binEnd = binStart + DAY;
      bars.push({ label: dayLabels[i], count: timestamps.filter((t) => t >= binStart && t < binEnd).length });
    }
  } else if (range === "month") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let weekStart = getWeekStart(monthStart);
    let weekNum = 1;
    while (weekStart.getTime() < monthEnd.getTime()) {
      const binStart = Math.max(weekStart.getTime(), monthStart.getTime());
      const binEnd = Math.min(weekStart.getTime() + 7 * DAY, monthEnd.getTime());
      bars.push({ label: `Wk${weekNum}`, count: timestamps.filter((t) => t >= binStart && t < binEnd).length });
      weekStart = new Date(weekStart.getTime() + 7 * DAY);
      weekNum++;
    }
  } else {
    const byMonth = {};
    timestamps.forEach((t) => {
      const d = new Date(t);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const sortedKeys = Object.keys(byMonth).sort((a, b) => {
      const [ya, ma] = a.split("-").map(Number);
      const [yb, mb] = b.split("-").map(Number);
      return ya - yb || ma - mb;
    });
    bars = sortedKeys.slice(-12).map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { label: new Date(y, m, 1).toLocaleDateString(undefined, { month: "short" }), count: byMonth[key] };
    });
    if (bars.length === 0) bars = [{ label: "—", count: 0 }];
  }

  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  visitsChart.innerHTML = bars
    .map((b) => {
      const height = b.count === 0 ? 0 : Math.max(4, Math.round((b.count / maxCount) * 100));
      return `
    <div class="visits-chart-bar" title="${b.label}: ${b.count} visit${b.count === 1 ? "" : "s"}">
      <span class="visits-chart-bar-count">${b.count}</span>
      <div class="visits-chart-bar-track">
        <div class="visits-chart-bar-fill" style="height: ${height}%;"></div>
      </div>
      <span class="visits-chart-bar-label">${b.label}</span>
    </div>`;
    })
    .join("");

  const total = bars.reduce((sum, b) => sum + b.count, 0);
  visitsChartTotal.textContent = `${total} visit${total === 1 ? "" : "s"} in this range`;
}

visitsFilter.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-tab");
  if (!btn) return;
  currentVisitsRange = btn.dataset.range;
  visitsFilter.querySelectorAll(".filter-tab").forEach((t) => t.classList.toggle("active", t === btn));
  renderVisitsChart(currentVisitsRange);
});

// =====================================================================
// DATE FILTERING
// =====================================================================
function getDateRange(filterValue, customFrom, customTo) {
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  let start = 0;
  let end = Infinity;

  switch (filterValue) {
    case "today": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = d.getTime();
      end = start + DAY;
      break;
    }
    case "yesterday": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start = d.getTime();
      end = start + DAY;
      break;
    }
    case "week": {
      const ws = getWeekStart(now);
      start = ws.getTime();
      end = start + 7 * DAY;
      break;
    }
    case "lastweek": {
      const ws = getWeekStart(now);
      start = ws.getTime() - 7 * DAY;
      end = ws.getTime();
      break;
    }
    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      break;
    }
    case "lastmonth": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    }
    case "custom": {
      if (customFrom) start = new Date(customFrom).getTime();
      if (customTo) end = new Date(customTo).getTime() + DAY - 1;
      break;
    }
    default:
      // "all" — no filter
      start = 0;
      end = Infinity;
  }
  return { start, end };
}

function filterEntriesByDate(entries, filterValue, customFrom, customTo) {
  if (filterValue === "all") return entries;
  const { start, end } = getDateRange(filterValue, customFrom, customTo);
  return entries.filter(([, e]) => {
    const ts = e.timestamp || 0;
    return ts >= start && ts <= end;
  });
}

// =====================================================================
// LEADERBOARD
// =====================================================================
async function loadAdminLeaderboard() {
  adminLeaderboardList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
    const data = await res.json();
    cachedLeaderboard = data ? Object.entries(data) : [];
    cachedLeaderboard.sort((a, b) => a[1].time - b[1].time);
    renderLeaderboardList();
  } catch (err) {
    adminLeaderboardList.innerHTML = `<p class="leaderboard-status">Couldn't load leaderboard data.</p>`;
  }
}

function renderLeaderboardList() {
  const filterValue = lbDateFilter.value;
  const customFrom = lbDateFrom.value;
  const customTo = lbDateTo.value;

  const filtered = filterEntriesByDate(cachedLeaderboard, filterValue, customFrom, customTo);

  lbFilterCount.textContent = filtered.length > 0
    ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
    : "No results";

  if (filtered.length === 0) {
    adminLeaderboardList.innerHTML = `<p class="leaderboard-status">No entries match this date filter.</p>`;
    return;
  }

  adminLeaderboardList.innerHTML = filtered
    .map(
      ([key, e]) => `
    <div class="admin-row">
      <div class="admin-row-info">
        <div class="admin-row-name">${escapeHtml(e.name || "Anonymous")} — ${formatTime(e.time)}</div>
        <div class="admin-row-date">${formatDateFull(e.timestamp)}</div>
      </div>
      <button class="admin-delete-btn" data-path="leaderboard/${key}" data-label="this leaderboard entry">Delete</button>
    </div>`
    )
    .join("");

  attachDeleteHandlers();
}

// Leaderboard date filter events
lbDateFilter.addEventListener("change", () => {
  const isCustom = lbDateFilter.value === "custom";
  lbCustomRange.classList.toggle("hidden", !isCustom);
  renderLeaderboardList();
});

lbApplyCustom.addEventListener("click", renderLeaderboardList);

// =====================================================================
// NOTES
// =====================================================================
async function loadAdminNotes() {
  adminNotesList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/notes.json`);
    const data = await res.json();
    cachedNotes = data ? Object.entries(data) : [];
    cachedNotes.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
    renderNotesList();
  } catch (err) {
    adminNotesList.innerHTML = `<p class="leaderboard-status">Couldn't load guestbook data.</p>`;
  }
}

function escapeAttr(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeNoteColor(color) {
  return /^#[0-9a-f]{3,8}$/i.test(color || "") ? color : "#f4d35e";
}

function noteTypeLabel(type) {
  if (type === "draw") return "Drawing";
  if (type === "photo") return "Photo";
  return "Text";
}

function notePreviewMarkup(note) {
  const type = note.type || "text";
  if (type === "photo" || type === "draw") {
    const src = type === "photo" ? note.photo : note.drawing;
    return src
      ? `<img src="${escapeAttr(src)}" alt="${noteTypeLabel(type)} note" loading="lazy" />`
      : `<div class="admin-note-preview-text">${noteTypeLabel(type)} note</div>`;
  }
  return `<div class="admin-note-preview-text">${escapeHtml(note.text || "")}</div>`;
}

function openAdminNoteView(note) {
  const type = note.type || "text";
  adminNoteViewContent.style.background = type === "photo" ? "#f7f4ec" : safeNoteColor(note.color);
  if (type === "photo" || type === "draw") {
    const src = type === "photo" ? note.photo : note.drawing;
    adminNoteViewContent.innerHTML = src
      ? `<img src="${escapeAttr(src)}" alt="${noteTypeLabel(type)} note" />`
      : `<p>No ${type} data saved for this note.</p>`;
  } else {
    adminNoteViewContent.innerHTML = `<p>${escapeHtml(note.text || "")}</p>`;
  }
  const dateStr = formatDateFull(note.timestamp);
  adminNoteViewName.textContent = `${noteTypeLabel(type)} · ${note.name || "Anonymous"}${dateStr ? " · " + dateStr : ""}`;
  adminNoteViewModal.classList.remove("hidden");
}

function attachNoteViewHandlers() {
  adminNotesList.querySelectorAll("[data-note-view]").forEach((el) => {
    el.addEventListener("click", () => {
      const entry = cachedNotes.find(([key]) => key === el.dataset.noteView);
      if (entry) openAdminNoteView(entry[1]);
    });
  });
}

btnAdminNoteViewClose.addEventListener("click", () => adminNoteViewModal.classList.add("hidden"));
adminNoteViewModal.addEventListener("click", (event) => {
  if (event.target === adminNoteViewModal) adminNoteViewModal.classList.add("hidden");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !adminNoteViewModal.classList.contains("hidden")) {
    adminNoteViewModal.classList.add("hidden");
  }
});

function renderNotesList() {
  const filterValue = notesDateFilter.value;
  const customFrom = notesDateFrom.value;
  const customTo = notesDateTo.value;

  const filtered = filterEntriesByDate(cachedNotes, filterValue, customFrom, customTo);

  notesFilterCount.textContent = filtered.length > 0
    ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
    : "No results";

  if (filtered.length === 0) {
    adminNotesList.innerHTML = `<p class="leaderboard-status">No notes match this date filter.</p>`;
    return;
  }

  adminNotesList.innerHTML = filtered
    .map(([key, note]) => {
      const type = note.type || "text";
      const isPhoto = type === "photo";
      const color = safeNoteColor(note.color);
      const previewStyle = isPhoto ? "" : ` style="background:${escapeAttr(color)}"`;
      const summary = type === "text" && note.text
        ? escapeHtml(note.text.slice(0, 120))
        : `${noteTypeLabel(type)} note`;
      return `
    <div class="admin-row admin-note-row">
      <button type="button" class="admin-note-preview${isPhoto ? " type-photo" : ""}"${previewStyle} data-note-view="${escapeAttr(key)}" aria-label="View ${noteTypeLabel(type).toLowerCase()} note">
        ${notePreviewMarkup(note)}
      </button>
      <div class="admin-row-info">
        <div class="admin-row-name">${escapeHtml(note.name || "Anonymous")}</div>
        <div class="admin-row-meta">${summary}</div>
        <div class="admin-row-date">${formatDateFull(note.timestamp)}</div>
      </div>
      <div class="admin-row-actions">
        <button type="button" class="btn-tiny admin-note-view-btn" data-note-view="${escapeAttr(key)}">View</button>
        <button class="admin-delete-btn" data-path="notes/${escapeAttr(key)}" data-label="this note">Delete</button>
      </div>
    </div>`;
    })
    .join("");

  attachDeleteHandlers();
  attachNoteViewHandlers();
}

// Notes date filter events
notesDateFilter.addEventListener("change", () => {
  const isCustom = notesDateFilter.value === "custom";
  notesCustomRange.classList.toggle("hidden", !isCustom);
  renderNotesList();
});

notesApplyCustom.addEventListener("click", renderNotesList);

// =====================================================================
// ARTWORKS
// =====================================================================
let uploadedArtworksCache = [];
let artworkSettingsCache = {};
let allArtworksCache = [];
let visibleArtworkIds = [];
let selectedArtworkIds = new Set();
let editingArtworkId = null;
let artworkSearchQuery = "";
let artworkFilterMode = "all";

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function openArtworkDrawer(title, eyebrow) {
  if (artworkDrawerTitle) artworkDrawerTitle.textContent = title;
  if (artworkDrawerEyebrow) artworkDrawerEyebrow.textContent = eyebrow;
  artworkDrawer.classList.add("open");
  artworkDrawerBackdrop.classList.add("open");
  artworkDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  artworkDrawer.scrollTop = 0;
}

function closeArtworkDrawer() {
  artworkDrawer.classList.remove("open");
  artworkDrawerBackdrop.classList.remove("open");
  artworkDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
}

function effectiveHuntStatus(art) {
  const override = artworkSettingsCache[art.id]?.inScavengerHunt;
  if (override !== undefined) return override !== false;
  return art.inScavengerHunt !== false;
}

function artworkThumb(art) {
  return art.imageUrl || art.image || "";
}

// ---------------------------------------------------------------------
// Quiz builder
// ---------------------------------------------------------------------
let editingQuizOnly = false;
let editingArtworkSource = null;
let quizQuestionUid = 0;

function sanitizeQuiz(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = String(item.question || "").trim();
      const rawOptions = Array.isArray(item.options)
        ? item.options.map((option) => String(option ?? "").trim())
        : [];
      const entries = rawOptions
        .map((text, index) => ({ text, index }))
        .filter((entry) => entry.text);
      if (!question || entries.length < 2) return null;
      let correctIndex = entries.findIndex((entry) => entry.index === Number(item.correctIndex));
      if (correctIndex === -1) correctIndex = 0;
      return { question, options: entries.map((entry) => entry.text), correctIndex };
    })
    .filter(Boolean);
}

function readQuizFromArtwork(art) {
  const fromSettings = artworkSettingsCache[art.id]?.quiz;
  return sanitizeQuiz(fromSettings || art.quiz || []);
}

function createQuizQuestionCard(question = "", options = [], correctIndex = 0) {
  const card = document.createElement("div");
  card.className = "quiz-question-card";
  const uid = `quiz-question-${quizQuestionUid++}`;
  const paddedOptions = options.slice(0, 4);
  while (paddedOptions.length < 4) paddedOptions.push("");
  const selectedIndex = Number.isInteger(correctIndex) ? correctIndex : 0;

  card.innerHTML = `
    <div class="quiz-question-head">
      <span class="quiz-question-label">Question</span>
      <button class="btn-tiny danger quiz-remove-btn" type="button">Remove</button>
    </div>
    <textarea class="note-textarea quiz-question-input" rows="2" placeholder="e.g. Who painted this artwork?"></textarea>
    ${paddedOptions
      .map(
        (option, index) => `
      <div class="quiz-option-row">
        <input type="radio" name="${uid}" value="${index}" ${index === selectedIndex ? "checked" : ""} aria-label="Mark option ${index + 1} as the correct answer" />
        <input class="text-input quiz-option-input" type="text" value="${escapeAttr(option)}" placeholder="Option ${index + 1}" />
      </div>`
      )
      .join("")}
    <p class="quiz-option-hint">Select the radio button next to the correct answer. Leave unused options blank.</p>
  `;

  card.querySelector(".quiz-question-input").value = question;
  card.querySelector(".quiz-remove-btn").addEventListener("click", () => {
    card.remove();
    updateQuizEditorEmptyState();
  });
  return card;
}

function updateQuizEditorEmptyState() {
  if (!quizEditorList) return;
  const hasCards = quizEditorList.querySelector(".quiz-question-card");
  let empty = quizEditorList.querySelector(".quiz-editor-empty");
  if (!hasCards) {
    if (!empty) {
      empty = document.createElement("p");
      empty.className = "quiz-editor-empty";
      empty.textContent = 'No quiz questions yet. Click "+ Add Question" or use the AI Assistant to generate them.';
      quizEditorList.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
}

function renderQuizEditor(quiz) {
  if (!quizEditorList) return;
  quizEditorList.innerHTML = "";
  sanitizeQuiz(quiz).forEach((question) => {
    quizEditorList.appendChild(
      createQuizQuestionCard(question.question, question.options, question.correctIndex)
    );
  });
  updateQuizEditorEmptyState();
}

function addQuizQuestion(question = "", options = [], correctIndex = 0) {
  if (!quizEditorList) return null;
  quizEditorList.querySelector(".quiz-editor-empty")?.remove();
  const card = createQuizQuestionCard(question, options, correctIndex);
  quizEditorList.appendChild(card);
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return card;
}

function collectQuizFromEditor() {
  if (!quizEditorList) return [];
  const quiz = [];
  quizEditorList.querySelectorAll(".quiz-question-card").forEach((card) => {
    const question = card.querySelector(".quiz-question-input").value.trim();
    if (!question) return;

    const optionInputs = Array.from(card.querySelectorAll(".quiz-option-input"));
    const checked = card.querySelector('input[type="radio"]:checked');
    const rawCorrectIndex = checked ? Number(checked.value) : 0;
    const options = optionInputs
      .map((input, index) => ({ text: input.value.trim(), index }))
      .filter((entry) => entry.text);

    if (options.length < 2) return;
    let correctIndex = options.findIndex((entry) => entry.index === rawCorrectIndex);
    if (correctIndex === -1) correctIndex = 0;

    quiz.push({
      question,
      options: options.map((entry) => entry.text),
      correctIndex,
    });
  });
  return quiz;
}

function resetArtworkForm() {
  editingArtworkId = null;
  editingQuizOnly = false;
  editingArtworkSource = null;
  artworkDrawer.classList.remove("quiz-mode");
  renderQuizEditor([]);
  document.getElementById("artwork-name").value = "";
  document.getElementById("artwork-artist").value = "";
  document.getElementById("artwork-year").value = "";
  document.getElementById("artwork-location").value = "";
  document.getElementById("artwork-details").value = "";
  artworkImageInput.value = "";
  artworkMarkerInput.value = "";
  artworkModelInput.value = "";
  artworkSkyboxInput.value = "";
  artworkModelScaleInput.value = "0.5";
  artworkModelForwardInput.value = "0.1";
  artworkImmersiveScaleInput.value = "1";
  artworkImmersiveRotationInput.value = "0 0 0";
  artworkImmersiveForwardInput.value = "-3";
  artworkMainInput.checked = true;
  artworkScannableInput.checked = true;
  artworkPublishedInput.checked = true;
  artworkHuntInput.checked = true;
  processedImageBase64 = null;
  imagePreview.classList.add("hidden");
  uploadPlaceholder.classList.remove("hidden");
  markerQualityWrap.classList.add("hidden");
  btnUploadArtwork.textContent = "Upload Artwork";
  btnUploadArtwork.disabled = false;
  uploadStatus.textContent = "";
  uploadStatus.className = "upload-status";
  closeArtworkDrawer();
}

async function startArtworkSettingsEdit(art) {
  editingArtworkId = art.id;
  editingQuizOnly = false;
  editingArtworkSource = art._source || (art.key ? "uploaded" : "builtin");
  artworkDrawer.classList.remove("quiz-mode");
  renderQuizEditor(readQuizFromArtwork(art));
  document.getElementById("artwork-name").value = art.name || "";
  document.getElementById("artwork-artist").value = art.artist || "";
  document.getElementById("artwork-year").value = art.year || "";
  document.getElementById("artwork-location").value = art.location || "";
  document.getElementById("artwork-details").value = art.details || "";
  artworkModelScaleInput.value = numberOrDefault(art.baseScale, 0.5);
  artworkModelForwardInput.value = numberOrDefault(art.modelPositionZ, 0.1);
  artworkImmersiveScaleInput.value = numberOrDefault(art.immersiveScale, 1);
  artworkImmersiveRotationInput.value = art.immersiveRotation || "0 0 0";
  artworkImmersiveForwardInput.value = numberOrDefault(art.immersiveForward, -3);
  artworkMainInput.checked = art.showInMainCollection !== false;
  artworkScannableInput.checked = art.scannable !== false;
  artworkPublishedInput.checked = art.published !== false;
  artworkHuntInput.checked = effectiveHuntStatus(art);
  if (art.imageUrl || art.image) {
    imagePreview.src = art.imageUrl || art.image;
    imagePreview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
  } else {
    imagePreview.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");
  }
  if (art.markerImageUrl) {
    const file = await fetch(art.markerImageUrl).then(r => r.blob()).then(b => new File([b], "marker.jpg"));
    await analyzeMarkerQuality(file);
  }
  btnUploadArtwork.textContent = "Save Artwork";
  uploadStatus.textContent = `Editing ${art.name}.`;
  uploadStatus.className = "upload-status";
  openArtworkDrawer("Edit Artwork", "Collection Entry");
  artworkDrawer.scrollTop = 0;
}

function startQuizEdit(art) {
  resetArtworkForm();
  editingArtworkId = art.id;
  editingArtworkSource = art._source || (art.key ? "uploaded" : "builtin");
  editingQuizOnly = true;
  document.getElementById("artwork-name").value = art.name || "";
  document.getElementById("artwork-artist").value = art.artist || "";
  document.getElementById("artwork-year").value = art.year || "";
  document.getElementById("artwork-location").value = art.location || "";
  document.getElementById("artwork-details").value = art.details || "";
  renderQuizEditor(readQuizFromArtwork(art));
  btnUploadArtwork.textContent = "Save Quiz";
  uploadStatus.textContent = `Editing quiz for ${art.name}.`;
  uploadStatus.className = "upload-status";
  artworkDrawer.classList.add("quiz-mode");
  openArtworkDrawer("Edit Quiz", "Quiz Builder");
  artworkDrawer.scrollTop = 0;
}

// Supabase client for direct uploads (using anon key)
const SUPABASE_URL = "https://twkgioiyfjfkppzerdii.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UxPFx1rFmy8g8CMaaqtQ1g_LuHnfvry";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function storagePath(...parts) {
  return parts.flatMap((part) => part.split("/")).map((part) => encodeURIComponent(part)).join("/");
}

function publicAssetUrl(path) {
  return `https://twkgioiyfjfkppzerdii.supabase.co/storage/v1/object/public/gbr-assets/${path}`;
}

async function uploadSupabaseAsset(file, path) {
  const cleanPath = storagePath(path);
  const contentType = file.type || "application/octet-stream";

  console.log("[Admin] Uploading asset directly via Supabase JS SDK:", cleanPath, contentType);

  const { data, error } = await supabaseClient.storage
    .from("gbr-assets")
    .upload(cleanPath, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("[Admin] Upload failed:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log("[Admin] Upload successful:", data);
  const { data: publicUrlData } = supabaseClient.storage.from("gbr-assets").getPublicUrl(cleanPath);
  return publicUrlData.publicUrl;
}

function fileExtension(file, fallback) {
  const match = file?.name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

async function loadAdminArtworks() {
  adminArtworksList.innerHTML = `<p class="collection-empty">Loading artwork collection...</p>`;
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const [res, settingsRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/artworks.json${authParam}`),
      fetch(`${FIREBASE_URL}/artworkSettings.json${authParam}`).catch(() => null),
    ]);
    console.log("[Admin] Artworks response:", res.status, res.statusText);
    const data = await res.json();
    uploadedArtworksCache = data ? Object.entries(data).map(([key, val]) => ({ key, ...val })) : [];
    artworkSettingsCache = {};
    if (settingsRes?.ok) {
      try {
        artworkSettingsCache = (await settingsRes.json()) || {};
      } catch {
        artworkSettingsCache = {};
      }
    }

    const merged = [
      ...BUILTIN_ARTWORKS.map((a) => ({ ...a, _source: "builtin" })),
      ...uploadedArtworksCache.map((a) => ({ ...a, _source: "uploaded", id: a.key })),
    ];
    allArtworksCache = merged.map((art) => ({
      ...art,
      inScavengerHunt: effectiveHuntStatus(art),
      quiz: sanitizeQuiz(artworkSettingsCache[art.id]?.quiz || art.quiz || []),
    }));

    const validIds = new Set(allArtworksCache.map((art) => art.id));
    selectedArtworkIds = new Set([...selectedArtworkIds].filter((id) => validIds.has(id)));
    updateArtworkCountLabel();
    renderAdminArtworks();

    if (!settingsRes?.ok) {
      console.warn("[Admin] artworkSettings could not be read. Deploy the updated Firebase rules to persist scavenger hunt changes for built-in artworks.");
    }
  } catch (err) {
    console.error("[Admin] Artworks load failed:", err);
    adminArtworksList.innerHTML = `<p class="collection-empty">Couldn't load artworks.</p>`;
  }
}

function updateArtworkCountLabel() {
  const huntCount = allArtworksCache.filter((art) => art.inScavengerHunt).length;
  document.getElementById("artworks-count-label").textContent = `${allArtworksCache.length} total | ${huntCount} in hunt`;
}

function filteredAdminArtworks() {
  const query = artworkSearchQuery.trim().toLowerCase();
  return allArtworksCache.filter((art) => {
    if (artworkFilterMode === "hunt" && !art.inScavengerHunt) return false;
    if (artworkFilterMode === "not-hunt" && art.inScavengerHunt) return false;
    if (artworkFilterMode === "draft" && art.published !== false) return false;
    if (!query) return true;
    return [art.name, art.artist, art.year, art.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function renderAdminArtworks() {
  const visible = filteredAdminArtworks();
  visibleArtworkIds = visible.map((art) => art.id);

  if (!visible.length) {
    adminArtworksList.innerHTML = `<p class="collection-empty">No artworks match this search or filter.</p>`;
    updateArtworkSelectionUI();
    return;
  }

  adminArtworksList.innerHTML = visible
    .map((art) => {
      const isBuiltin = art._source === "builtin";
      const thumb = artworkThumb(art);
      const meta = [art.artist, art.year].filter(Boolean).join(" · ") || "No metadata";
      const selected = selectedArtworkIds.has(art.id);
      const thumbMarkup = thumb
        ? `<img class="artwork-row-thumb" src="${escapeAttr(thumb)}" alt="" onerror="this.style.display='none'" />`
        : `<div class="artwork-row-thumb artwork-thumb-fallback">${escapeHtml((art.name || "?").slice(0, 1))}</div>`;
      return `
      <div class="artwork-row ${selected ? "selected" : ""}" data-artwork-id="${escapeAttr(art.id)}">
        <label class="artwork-select-cell" title="Select ${escapeAttr(art.name || "artwork")}">
          <input class="artwork-select-input" type="checkbox" data-artwork-id="${escapeAttr(art.id)}" ${selected ? "checked" : ""} />
        </label>
        ${thumbMarkup}
        <div class="artwork-row-info">
          <p class="artwork-name">${escapeHtml(art.name)}</p>
          <p class="artwork-meta">${escapeHtml(meta)}</p>
          <div class="artwork-tags">
            <span class="artwork-source ${isBuiltin ? "builtin" : ""}">${isBuiltin ? "Built-in" : "Uploaded"}</span>
            <span class="status-pill ${art.published === false ? "draft" : "published"}">${art.published === false ? "Draft" : "Published"}</span>
            ${art.scannable === false ? "" : `<span class="status-pill">AR</span>`}
            <span class="status-pill ${art.inScavengerHunt ? "hunt" : "muted"}">${art.inScavengerHunt ? "Scavenger hunt" : "Not in hunt"}</span>
            ${art.quiz?.length ? `<span class="status-pill quiz-count">${art.quiz.length} quiz</span>` : `<span class="status-pill muted">No quiz</span>`}
          </div>
        </div>
        <div class="artwork-row-controls">
          <label class="hunt-switch" title="Toggle scavenger hunt inclusion">
            <input class="hunt-toggle-input" type="checkbox" data-artwork-id="${escapeAttr(art.id)}" ${art.inScavengerHunt ? "checked" : ""} />
            <span class="hunt-track"></span>
            <span>Hunt</span>
          </label>
          <div class="artwork-row-actions">
            <button class="btn-tiny artwork-quiz-btn" type="button" data-artwork-id="${escapeAttr(art.id)}">Quiz</button>
            ${isBuiltin ? "" : `
            <button class="btn-tiny artwork-edit-btn" type="button" data-artwork-id="${escapeAttr(art.id)}">Edit</button>
            <button class="admin-delete-btn" type="button" data-path="artworks/${escapeAttr(art.id)}" data-label="this artwork">Delete</button>`}
          </div>
        </div>
      </div>`;
    })
    .join("");

  attachDeleteHandlers();
  adminArtworksList.querySelectorAll(".artwork-edit-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const artwork = allArtworksCache.find((item) => item.id === button.dataset.artworkId);
      if (artwork) await startArtworkSettingsEdit(artwork);
    });
  });
  adminArtworksList.querySelectorAll(".artwork-quiz-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const artwork = allArtworksCache.find((item) => item.id === button.dataset.artworkId);
      if (artwork) startQuizEdit(artwork);
    });
  });
  adminArtworksList.querySelectorAll(".artwork-select-input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedArtworkIds.add(checkbox.dataset.artworkId);
      else selectedArtworkIds.delete(checkbox.dataset.artworkId);
      updateArtworkSelectionUI();
    });
  });
  adminArtworksList.querySelectorAll(".hunt-toggle-input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => updateArtworkHunt(checkbox.dataset.artworkId, checkbox.checked));
  });
  updateArtworkSelectionUI();
}

function updateArtworkSelectionUI() {
  const count = selectedArtworkIds.size;
  artworkSelectionCount.textContent = `${count} selected`;
  btnBulkEdit.disabled = count === 0;
  if (!count) closeBulkEditPanel();

  const visibleSelectedCount = visibleArtworkIds.filter((id) => selectedArtworkIds.has(id)).length;
  artworkSelectAll.checked = visibleArtworkIds.length > 0 && visibleSelectedCount === visibleArtworkIds.length;
  artworkSelectAll.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleArtworkIds.length;

  adminArtworksList.querySelectorAll(".artwork-row").forEach((row) => {
    row.classList.toggle("selected", selectedArtworkIds.has(row.dataset.artworkId));
  });
}

function closeBulkEditPanel() {
  bulkEditPanel.classList.add("hidden");
  btnBulkEdit.textContent = "Bulk edit";
  bulkEditStatus.textContent = "";
  bulkEditStatus.className = "upload-status";
}

let collectionStatusTimer = null;
function setArtworkCollectionStatus(message, type = "success") {
  clearTimeout(collectionStatusTimer);
  artworkCollectionStatus.textContent = message;
  artworkCollectionStatus.className = `collection-status ${type}`;
  artworkCollectionStatus.classList.remove("hidden");
  if (type === "success") {
    collectionStatusTimer = setTimeout(() => artworkCollectionStatus.classList.add("hidden"), 5000);
  }
}

async function updateArtworkHunt(artworkId, shouldInclude) {
  const artwork = allArtworksCache.find((item) => item.id === artworkId);
  if (!artwork) return;
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Sign in again before changing scavenger hunt settings.");
    renderAdminArtworks();
    return;
  }

  try {
    const idToken = await user.getIdToken();
    let artworkSaved = false;
    let settingsSaved = false;
    let settingsError = null;

    if (artwork._source === "uploaded") {
      const artResponse = await fetch(`${FIREBASE_URL}/artworks/${encodeURIComponent(artworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inScavengerHunt: shouldInclude }),
      });
      if (!artResponse.ok) throw new Error(`Artwork update failed (${artResponse.status}).`);
      artworkSaved = true;
      const cached = uploadedArtworksCache.find((item) => item.key === artworkId);
      if (cached) cached.inScavengerHunt = shouldInclude;
    }

    try {
      const settingsResponse = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(artworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inScavengerHunt: shouldInclude }),
      });
      if (!settingsResponse.ok) {
        throw new Error(settingsResponse.status === 401 || settingsResponse.status === 403
          ? "The artworkSettings Firebase rule is not deployed yet."
          : `Firebase returned ${settingsResponse.status}.`);
      }
      settingsSaved = true;
    } catch (error) {
      settingsError = error;
    }

    if (!settingsSaved && !artworkSaved) {
      throw settingsError || new Error("Could not save scavenger hunt setting.");
    }
    if (!settingsSaved) {
      console.warn("[Admin] Saved scavenger hunt setting on the artwork only:", settingsError?.message);
    }

    artworkSettingsCache[artworkId] = { ...(artworkSettingsCache[artworkId] || {}), inScavengerHunt: shouldInclude };
    artwork.inScavengerHunt = shouldInclude;
    updateArtworkCountLabel();
    renderAdminArtworks();
    setArtworkCollectionStatus(`${artwork.name} ${shouldInclude ? "added to" : "removed from"} the scavenger hunt.`);
  } catch (err) {
    console.error("[Admin] Scavenger hunt update failed:", err);
    setArtworkCollectionStatus(`Could not update scavenger hunt setting. ${err.message}`, "error");
    renderAdminArtworks();
  }
}

async function applyBulkEdit() {
  const selected = allArtworksCache.filter((art) => selectedArtworkIds.has(art.id));
  if (!selected.length) return;

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Sign in again before editing artworks.");
    return;
  }

  const huntChoice = bulkHunt.value;
  const publishedChoice = bulkPublished.value;
  const scannableChoice = bulkScannable.value;
  const mainChoice = bulkMain.value;
  if ([huntChoice, publishedChoice, scannableChoice, mainChoice].every((choice) => choice === "keep")) {
    bulkEditStatus.textContent = "Choose at least one field to change.";
    bulkEditStatus.className = "upload-status error";
    return;
  }

  const idToken = await user.getIdToken();
  const errors = [];
  let uploadedUpdated = 0;
  let huntUpdated = 0;
  let huntFallback = 0;
  let skippedBuiltins = 0;

  btnBulkApply.disabled = true;
  bulkEditStatus.textContent = "Applying changes...";
  bulkEditStatus.className = "upload-status";

  for (const art of selected) {
    const visibilityChanges = publishedChoice !== "keep" || scannableChoice !== "keep" || mainChoice !== "keep";
    const huntValue = huntChoice === "keep" ? null : huntChoice === "yes";
    const updates = {};
    if (publishedChoice !== "keep") updates.published = publishedChoice === "yes";
    if (scannableChoice !== "keep") updates.scannable = scannableChoice === "yes";
    if (mainChoice !== "keep") updates.showInMainCollection = mainChoice === "yes";
    if (huntValue !== null && art._source === "uploaded") updates.inScavengerHunt = huntValue;

    if (visibilityChanges && art._source === "builtin") skippedBuiltins += 1;

    if (Object.keys(updates).length) {
      try {
        const response = await fetch(`${FIREBASE_URL}/artworks/${encodeURIComponent(art.id)}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error(`artwork update failed (${response.status})`);
        uploadedUpdated += 1;
        if (huntValue !== null) art.inScavengerHunt = huntValue;
      } catch (err) {
        errors.push(`${art.name}: ${err.message}`);
      }
    }

    if (huntValue !== null) {
      try {
        const response = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(art.id)}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inScavengerHunt: huntValue }),
        });
        if (!response.ok) {
          throw new Error(response.status === 401 || response.status === 403
            ? "artworkSettings rule not deployed"
            : `settings update failed (${response.status})`);
        }
        artworkSettingsCache[art.id] = { ...(artworkSettingsCache[art.id] || {}), inScavengerHunt: huntValue };
        huntUpdated += 1;
      } catch (err) {
        if (art._source === "uploaded") {
          huntFallback += 1;
          console.warn("[Admin] Hunt saved on artwork but settings node failed:", err);
        } else {
          errors.push(`${art.name}: ${err.message}`);
        }
      }
    }
  }

  selectedArtworkIds.clear();
  await loadAdminArtworks();
  closeBulkEditPanel();
  [bulkHunt, bulkPublished, bulkScannable, bulkMain].forEach((select) => { select.value = "keep"; });
  btnBulkApply.disabled = false;

  if (errors.length) {
    setArtworkCollectionStatus(
      `Updated ${uploadedUpdated} artwork(s), ${huntUpdated} hunt setting(s). ${errors.length} failed: ${errors[0]}`,
      "error",
    );
  } else {
    const parts = [];
    if (huntUpdated) parts.push(`${huntUpdated} hunt setting(s)`);
    if (uploadedUpdated) parts.push(`${uploadedUpdated} artwork(s)`);
    let message = `Saved ${parts.join(" and ") || "changes"}.`;
    if (skippedBuiltins) message += " Built-in artworks only support hunt changes.";
    if (huntFallback) message += ` ${huntFallback} uploaded artwork(s) used the artwork fallback; deploy the artworkSettings rule for built-ins.`;
    setArtworkCollectionStatus(message, "success");
  }
}

artworkSearchInput.addEventListener("input", () => {
  artworkSearchQuery = artworkSearchInput.value;
  selectedArtworkIds.clear();
  renderAdminArtworks();
});
artworkHuntFilter.addEventListener("change", () => {
  artworkFilterMode = artworkHuntFilter.value;
  selectedArtworkIds.clear();
  renderAdminArtworks();
});
artworkSelectAll.addEventListener("change", () => {
  visibleArtworkIds.forEach((id) => {
    if (artworkSelectAll.checked) selectedArtworkIds.add(id);
    else selectedArtworkIds.delete(id);
  });
  updateArtworkSelectionUI();
});
btnBulkEdit.addEventListener("click", () => {
  const opening = bulkEditPanel.classList.contains("hidden");
  bulkEditPanel.classList.toggle("hidden", !opening);
  btnBulkEdit.textContent = opening ? "Hide bulk edit" : "Bulk edit";
  if (opening) {
    bulkEditStatus.textContent = "";
    bulkEditStatus.className = "upload-status";
  }
});
btnBulkClose.addEventListener("click", closeBulkEditPanel);
btnBulkApply.addEventListener("click", applyBulkEdit);
btnNewArtwork.addEventListener("click", () => {
  resetArtworkForm();
  openArtworkDrawer("Upload Artwork", "New Entry");
  requestAnimationFrame(() => document.getElementById("artwork-name").focus({ preventScroll: true }));
});
btnAddQuizQuestion?.addEventListener("click", () => addQuizQuestion());
btnCloseArtworkDrawer.addEventListener("click", resetArtworkForm);
artworkDrawerBackdrop.addEventListener("click", resetArtworkForm);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!aiModal.classList.contains("hidden")) return;
  if (artworkDrawer.classList.contains("open")) resetArtworkForm();
  else if (!bulkEditPanel.classList.contains("hidden")) closeBulkEditPanel();
});

// ---- Image upload handling ----
let processedImageBase64 = null;

imageUploadZone.addEventListener("click", () => artworkImageInput.click());
artworkImageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadStatus.textContent = "Processing image…";
  uploadStatus.className = "upload-status";

  try {
    const img = await loadImageFromFile(file);
    const canvas = downscaleImage(img, 700);
    processedImageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    imagePreview.src = processedImageBase64;
    imagePreview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
    uploadStatus.textContent = `Ready: ${Math.round(processedImageBase64.length / 1024)} KB`;
    uploadStatus.className = "upload-status success";
  } catch (err) {
    uploadStatus.textContent = "Failed to process image. Try a smaller file.";
    uploadStatus.className = "upload-status error";
    processedImageBase64 = null;
  }
});

artworkMarkerInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) {
    markerQualityWrap.classList.add("hidden");
    return;
  }
  await analyzeMarkerQuality(file);
});

btnTestMarker.addEventListener("click", async () => {
  const file = artworkMarkerInput.files[0];
  if (!file) return;
  markerTestStatus.classList.remove("hidden");
  markerTestStatus.className = "upload-status";
  markerTestStatus.textContent = "Testing with MindAR compiler…";
  btnTestMarker.disabled = true;
  try {
    const result = await testMarkerWithCompiler(file);
    markerTestStatus.className = "upload-status success";
    markerTestStatus.textContent = `MindAR: ${result.features} feature points, quality ${(result.quality * 100).toFixed(0)}%`;
  } catch (err) {
    markerTestStatus.className = "upload-status error";
    markerTestStatus.textContent = err.message || "MindAR test failed";
  } finally {
    btnTestMarker.disabled = false;
  }
});

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downscaleImage(img, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function analyzeMarkerQuality(file) {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }
  const mean = sum / (data.length / 4);
  const contrast = max - min;
  const contrastNorm = Math.min(1, contrast / 128);

  const estimatedFeatures = Math.round((canvas.width * canvas.height / 10000) * contrastNorm * 100);

  let rating = "Poor";
  let ratingClass = "poor";
  if (contrastNorm > 0.5 && estimatedFeatures > 200) { rating = "Excellent"; ratingClass = "excellent"; }
  else if (contrastNorm > 0.3 && estimatedFeatures > 100) { rating = "Good"; ratingClass = "good"; }
  else if (contrastNorm > 0.15 && estimatedFeatures > 50) { rating = "Fair"; ratingClass = "fair"; }

  markerQualityImg.src = URL.createObjectURL(file);
  markerQualityResolution.textContent = `${img.width} × ${img.height} px`;
  markerQualityContrast.textContent = `${contrast} (${(contrastNorm * 100).toFixed(0)}%)`;
  markerQualityContrastBar.querySelector(".quality-bar-fill").style.width = `${contrastNorm * 100}%`;
  markerQualityFeatures.textContent = `~${estimatedFeatures}`;
  markerQualityRating.textContent = rating;
  markerQualityRating.className = `quality-rating ${ratingClass}`;

  markerQualityWrap.classList.remove("hidden");
}

async function testMarkerWithCompiler(file) {
  if (!window.MINDAR?.IMAGE?.Compiler) {
    await loadMindARCompiler();
  }
  const img = await loadImageFromFile(file);
  const canvas = downscaleImage(img, 700);
  const compiler = new window.MINDAR.IMAGE.Compiler();
  const compiled = await compiler.compileImageTargets([canvas]);
  const features = compiled?.targets?.[0]?.keypoints?.length || 0;
  const quality = Math.min(1, features / 500);
  return { features, quality };
}

function loadMindARCompiler() {
  return new Promise((resolve, reject) => {
    if (window.MINDAR?.IMAGE?.Compiler) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load MindAR compiler"));
    document.head.appendChild(script);
  });
}

btnUploadArtwork.addEventListener("click", async () => {
  if (editingArtworkId && editingQuizOnly) {
    const quiz = collectQuizFromEditor();
    btnUploadArtwork.disabled = true;
    uploadStatus.textContent = "Saving quiz...";
    uploadStatus.className = "upload-status";
    try {
      const user = firebase.auth().currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();

      const response = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(editingArtworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz }),
      });
      if (!response.ok) throw new Error(`Quiz save failed (${response.status})`);

      if (editingArtworkSource === "uploaded") {
        try {
          const artworkResponse = await fetch(`${FIREBASE_URL}/artworks/${encodeURIComponent(editingArtworkId)}.json?auth=${idToken}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quiz }),
          });
          if (!artworkResponse.ok) console.warn("[Admin] Could not save quiz on artwork record:", artworkResponse.status);
        } catch (artworkError) {
          console.warn("[Admin] Could not save quiz on artwork record:", artworkError);
        }
      }

      artworkSettingsCache[editingArtworkId] = { ...(artworkSettingsCache[editingArtworkId] || {}), quiz };
      const cachedArtwork = allArtworksCache.find((item) => item.id === editingArtworkId);
      if (cachedArtwork) cachedArtwork.quiz = quiz;

      uploadStatus.textContent = "Quiz saved successfully!";
      uploadStatus.className = "upload-status success";
      loadAdminArtworks();
      setTimeout(resetArtworkForm, 180);
    } catch (err) {
      console.error("Quiz save failed:", err);
      uploadStatus.textContent = err?.message || "Could not save the quiz.";
      uploadStatus.className = "upload-status error";
    } finally {
      btnUploadArtwork.disabled = false;
    }
    return;
  }

  if (editingArtworkId) {
    const baseScale = numberOrDefault(artworkModelScaleInput.value, NaN);
    const modelPositionZ = numberOrDefault(artworkModelForwardInput.value, NaN);
    const immersiveScale = numberOrDefault(artworkImmersiveScaleInput.value, NaN);
    const immersiveRotation = artworkImmersiveRotationInput.value.trim();
    const immersiveForward = numberOrDefault(artworkImmersiveForwardInput.value, NaN);
    if (!Number.isFinite(baseScale) || baseScale <= 0 || !Number.isFinite(modelPositionZ) || !Number.isFinite(immersiveScale) || immersiveScale <= 0 || !Number.isFinite(immersiveForward)) {
      uploadStatus.textContent = "Enter valid positive scales and valid forward positions.";
      uploadStatus.className = "upload-status error";
      return;
    }

    btnUploadArtwork.disabled = true;
    uploadStatus.textContent = "Saving artwork settings...";
    uploadStatus.className = "upload-status";
    try {
      const user = firebase.auth().currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();
      const name = document.getElementById("artwork-name").value.trim();
      if (!name) throw new Error("Artwork title is required.");
      const quiz = collectQuizFromEditor();

      const payload = {
        name,
        artist: document.getElementById("artwork-artist").value.trim() || null,
        year: document.getElementById("artwork-year").value.trim() || null,
        location: document.getElementById("artwork-location").value.trim() || null,
        details: document.getElementById("artwork-details").value.trim(),
        baseScale,
        modelPositionZ,
        immersiveScale,
        immersiveRotation,
        immersiveForward,
        showInMainCollection: artworkMainInput.checked,
        scannable: artworkScannableInput.checked,
        published: artworkPublishedInput.checked,
        inScavengerHunt: artworkHuntInput.checked,
        quiz,
      };

      const response = await fetch(`${FIREBASE_URL}/artworks/${editingArtworkId}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Firebase artwork settings save failed (${response.status})`);

      try {
        const settingsResponse = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(editingArtworkId)}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inScavengerHunt: artworkHuntInput.checked, quiz }),
        });
        if (!settingsResponse.ok) console.warn("[Admin] Could not save artworkSettings entry:", settingsResponse.status);
      } catch (settingsError) {
        console.warn("[Admin] Could not save artworkSettings entry:", settingsError);
      }

      artworkSettingsCache[editingArtworkId] = {
        ...(artworkSettingsCache[editingArtworkId] || {}),
        inScavengerHunt: artworkHuntInput.checked,
        quiz,
      };
      uploadStatus.textContent = "Artwork saved successfully!";
      uploadStatus.className = "upload-status success";
      loadCounts();
      loadAdminArtworks();
      setTimeout(resetArtworkForm, 180);
    } catch (err) {
      console.error("Artwork settings save failed:", err);
      uploadStatus.textContent = err?.message || "Could not save artwork settings.";
      uploadStatus.className = "upload-status error";
    } finally {
      btnUploadArtwork.disabled = false;
    }
    return;
  }

  const name = document.getElementById("artwork-name").value.trim();
  const details = document.getElementById("artwork-details").value.trim();

  const displayFile = artworkImageInput.files[0];
  const markerFile = artworkMarkerInput.files[0];
  const modelFile = artworkModelInput.files[0];
  const skyboxFile = artworkSkyboxInput.files[0];

  if (!name || !details || (!displayFile && !processedImageBase64)) {
    uploadStatus.textContent = "Please fill in all required fields and select an image.";
    uploadStatus.className = "upload-status error";
    return;
  }

  btnUploadArtwork.disabled = true;
  uploadStatus.textContent = "Uploading assets…";
  uploadStatus.className = "upload-status";

  try {
    const artworkId = `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const basePath = `artworks/${artworkId}`;
    const quiz = collectQuizFromEditor();
    let imageUrl = null;
    if (displayFile) imageUrl = await uploadSupabaseAsset(displayFile, `${basePath}/display.${fileExtension(displayFile, "jpg")}`);
    else if (processedImageBase64) imageUrl = processedImageBase64;

    const markerUrl = markerFile
      ? await uploadSupabaseAsset(markerFile, `${basePath}/marker.${fileExtension(markerFile, "jpg")}`)
      : imageUrl;
    const modelUrl = modelFile
      ? await uploadSupabaseAsset(modelFile, `${basePath}/model.glb`)
      : null;
    const immersiveSkyboxUrl = skyboxFile
      ? await uploadSupabaseAsset(skyboxFile, `${basePath}/skybox.glb`)
      : null;

const artwork = {
      name,
      imageUrl,
      markerImageUrl: markerUrl,
      modelUrl,
      immersiveSkyboxUrl,
      artist: document.getElementById("artwork-artist").value.trim() || null,
      year: document.getElementById("artwork-year").value.trim() || null,
      location: document.getElementById("artwork-location").value.trim() || null,
      details,
      baseScale: numberOrDefault(artworkModelScaleInput.value, 0.5),
      modelPositionZ: numberOrDefault(artworkModelForwardInput.value, 0.1),
      immersiveScale: numberOrDefault(artworkImmersiveScaleInput.value, 1),
      immersiveRotation: artworkImmersiveRotationInput.value.trim() || "0 0 0",
      immersiveForward: numberOrDefault(artworkImmersiveForwardInput.value, -3),
      icon: "🖼️",
      showInMainCollection: artworkMainInput.checked,
      scannable: artworkScannableInput.checked,
      published: artworkPublishedInput.checked,
      inScavengerHunt: artworkHuntInput.checked,
      quiz,
      createdAt: Date.now(),
    };

    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Not authenticated");
    const idToken = await user.getIdToken();

    // Use Firebase REST API directly (supports CORS with auth param)
    const response = await fetch(`${FIREBASE_URL}/artworks/${artworkId}.json?auth=${idToken}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artwork),
    });
    if (!response.ok) throw new Error(`Firebase artwork save failed (${response.status})`);

    try {
      const settingsResponse = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(artworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inScavengerHunt: artworkHuntInput.checked, quiz }),
      });
      if (!settingsResponse.ok) console.warn("[Admin] Could not save artworkSettings entry:", settingsResponse.status);
    } catch (settingsError) {
      console.warn("[Admin] Could not save artworkSettings entry:", settingsError);
    }

    artworkSettingsCache[artworkId] = { inScavengerHunt: artworkHuntInput.checked, quiz };
    uploadStatus.textContent = "Artwork uploaded successfully!";
    uploadStatus.className = "upload-status success";

    loadCounts();
    loadAdminArtworks();
    setTimeout(resetArtworkForm, 180);
  } catch (err) {
    console.error("Artwork upload failed:", err);
    uploadStatus.textContent = err?.message || "Upload failed. Check your connection.";
    uploadStatus.className = "upload-status error";
  } finally {
    btnUploadArtwork.disabled = false;
  }
});

btnCancelArtworkEdit.addEventListener("click", resetArtworkForm);

// ---- AR target compiler and versioned publisher ----
async function fetchUploadedArtworks() {
  const response = await fetch(`${FIREBASE_URL}/artworks.json`);
  if (!response.ok) throw new Error(`Could not load artworks (${response.status})`);
  const data = await response.json();
  return data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : [];
}

function allPublishedScannableArtworks(uploaded) {
  const builtins = BUILTIN_ARTWORKS
    .filter((art) => art.published !== false && art.scannable && art.markerImage)
    .map((art) => ({ ...art, markerImageUrl: art.markerImage }));
  const firebaseArtworks = uploaded.filter((art) => art.published !== false && art.scannable && (art.markerImageUrl || art.imageUrl));
  return [...builtins, ...firebaseArtworks];
}

async function loadCompilerImage(url) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error(`Could not load marker image: ${url}`));
    image.src = url;
  });
  return downscaleImage(image, 700);
}

async function publishArBundle() {
  if (!window.MINDAR?.IMAGE?.Compiler) throw new Error("MindAR compiler is still loading. Try again in a moment.");
  const uploaded = await fetchUploadedArtworks();
  const targets = allPublishedScannableArtworks(uploaded);
  if (!targets.length) throw new Error("No published scannable artworks have marker images.");

  const images = [];
  for (let i = 0; i < targets.length; i++) {
    arBuildStatus.textContent = `Loading marker images: ${i + 1} / ${targets.length}`;
    images.push(await loadCompilerImage(targets[i].markerImageUrl));
  }

  arBuildStatus.textContent = "Compiling AR targets…";
  const compiler = new window.MINDAR.IMAGE.Compiler();
  const compiled = await compiler.compileImageTargets(images, (progress) => {
    arBuildStatus.textContent = `Compiling AR targets: ${Math.round(progress)}%`;
  });
  const exportedBuffer = await compiler.exportData();
  const version = `bundle-${Date.now()}`;
  const file = new File([exportedBuffer], "targets.mind", { type: "application/octet-stream" });
  const mindPath = `bundles/${version}/targets.mind`;
  const mindUrl = await uploadSupabaseAsset(file, mindPath);
  const manifest = {
    version,
    createdAt: Date.now(),
    mindUrl,
    targets: targets.map((art, targetIndex) => ({ targetIndex, artworkId: art.id })),
  };
  const manifestFile = new File([JSON.stringify(manifest, null, 2)], "manifest.json", { type: "application/json" });
  const manifestUrl = await uploadSupabaseAsset(manifestFile, `bundles/${version}/manifest.json`);

  // Publish via Firebase REST API directly (supports CORS with auth param)
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await user.getIdToken();
  const manifestWithUrl = { ...manifest, manifestUrl };
  const response = await fetch(`${FIREBASE_URL}/arBundleCurrent.json?auth=${idToken}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manifestWithUrl),
  });
  if (!response.ok) throw new Error(`Could not publish bundle pointer (${response.status})`);
  return { version, count: targets.length };
}

btnBuildAr.addEventListener("click", async () => {
  btnBuildAr.disabled = true;
  arBuildStatus.className = "upload-status";
  arBuildStatus.textContent = "Preparing AR build…";
  try {
    const result = await publishArBundle();
    arBuildStatus.className = "upload-status success";
    arBuildStatus.textContent = `Published ${result.version} with ${result.count} targets.`;
  } catch (error) {
    console.error("AR build failed:", error);
    arBuildStatus.className = "upload-status error";
    arBuildStatus.textContent = error.message || "AR build failed.";
  } finally {
    btnBuildAr.disabled = false;
  }
});

// =====================================================================
// SHARED UTILITIES
// =====================================================================
function attachDeleteHandlers() {
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete ${btn.dataset.label}? This can't be undone.`)) return;
      btn.disabled = true;
      btn.textContent = "Deleting...";
      const user = firebase.auth().currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const path = btn.dataset.path || "";
      const slashIndex = path.indexOf("/");
      const collection = slashIndex === -1 ? path : path.slice(0, slashIndex);
      const key = slashIndex === -1 ? "" : path.slice(slashIndex + 1);
      let endpoint = "";
      if (!key) return;
      if (collection === "leaderboard") endpoint = `/leaderboard/${encodeURIComponent(key)}.json`;
      else if (collection === "notes") endpoint = `/notes/${encodeURIComponent(key)}.json`;
      else if (collection === "artworks") endpoint = `/artworks/${encodeURIComponent(key)}.json`;
      else return;
      try {
        const res = await fetch(`${FIREBASE_URL}${endpoint}?auth=${idToken}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Delete failed. Make sure the admin database rules are deployed.");
      } finally {
        loadAllData();
      }
    });
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btn-export-leaderboard").addEventListener("click", async () => {
  const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
  downloadJson("leaderboard-export.json", await res.json());
});
document.getElementById("btn-export-notes").addEventListener("click", async () => {
  const res = await fetch(`${FIREBASE_URL}/notes.json`);
  downloadJson("guestbook-notes-export.json", await res.json());
});
async function clearCollection(collection, label) {
  if (!confirm(`Delete ALL ${label}? This can't be undone.`)) return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  try {
    const listRes = await fetch(`${FIREBASE_URL}/${collection}.json?auth=${idToken}`);
    if (!listRes.ok) throw new Error(`${listRes.status} ${await listRes.text()}`);
    const data = await listRes.json();
    const keys = data ? Object.keys(data) : [];
    const results = await Promise.all(keys.map((key) =>
      fetch(`${FIREBASE_URL}/${collection}/${encodeURIComponent(key)}.json?auth=${idToken}`, { method: "DELETE" })
    ));
    const failed = results.find((res) => !res.ok);
    if (failed) throw new Error(`${failed.status} ${await failed.text()}`);
  } catch (err) {
    console.error("Clear failed:", err);
    alert("Clear failed. Make sure the admin database rules are deployed.");
  } finally {
    loadAllData();
  }
}

document.getElementById("btn-clear-leaderboard").addEventListener("click", () => clearCollection("leaderboard", "leaderboard entries"));
document.getElementById("btn-clear-notes").addEventListener("click", () => clearCollection("notes", "guestbook notes"));

function formatTime(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatDateFull(timestamp) {
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
