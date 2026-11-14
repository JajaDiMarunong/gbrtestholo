// reCAPTCHA v3 helper — invisible, walang checkbox. Ginagamit to ng entry gate
// at ng mga write (notes, leaderboard) sa Supabase function.
// Ang pass ng bisita 6 hours lang, tapos kailangan niyang i-verify ulit.
(function () {
  "use strict";

  const SITE_KEY = "6LduFx4uAAAAAIbhUmAqwZ9Ihl9P7yQZH9qvmQln";
  const VERIFY_URL = "https://twkgioiyfjfkppzerdii.functions.supabase.co/functions/v1/recaptcha-verify";
  const SCRIPT_SRC = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
  const SCRIPT_ID = "gbr-recaptcha-script";

  const SESSION_KEY = "gbr.recaptcha.expires";
  const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

  const LOAD_TIMEOUT_MS = 10000;
  const VERIFY_TIMEOUT_MS = 15000;

  const ACTIONS = {
    ENTRY_GATE: "entry_gate",
    ADMIN_LOGIN: "admin_login",
  };

  let loaderPromise = null;
  let gatePromise = null;

  function makeError(code, message, extra) {
    const error = new Error(message);
    error.code = code;
    if (extra) Object.assign(error, extra);
    return error;
  }

  function sessionExpiry() {
    try {
      return Number(window.sessionStorage.getItem(SESSION_KEY)) || 0;
    } catch (err) {
      return 0;
    }
  }

  function sessionPassed() {
    return sessionExpiry() > Date.now();
  }

  function markPassed(ttlMs) {
    try {
      window.sessionStorage.setItem(SESSION_KEY, String(Date.now() + (ttlMs || SESSION_TTL_MS)));
    } catch (err) {
    }
  }

  function clearSession() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
    }
  }

  function load() {
    if (window.grecaptcha && typeof window.grecaptcha.execute === "function") {
      return Promise.resolve(window.grecaptcha);
    }
    if (loaderPromise) return loaderPromise;

    const promise = new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        fn(value);
      };

      const timer = window.setTimeout(() => {
        finish(reject, makeError("unavailable", "reCAPTCHA did not load in time."));
      }, LOAD_TIMEOUT_MS);

      const existing = document.getElementById(SCRIPT_ID);
      const script = existing || document.createElement("script");
      if (!existing) {
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
      }

      script.addEventListener("load", () => {
        if (!window.grecaptcha || typeof window.grecaptcha.ready !== "function") {
          finish(reject, makeError("unavailable", "reCAPTCHA loaded but is not usable."));
          return;
        }
        window.grecaptcha.ready(() => finish(resolve, window.grecaptcha));
      }, { once: true });

      script.addEventListener("error", () => {
        finish(reject, makeError("unavailable", "reCAPTCHA could not be downloaded."));
      }, { once: true });

      if (!existing) document.head.appendChild(script);
    });

    loaderPromise = promise.catch((error) => {
      loaderPromise = null;
      throw error;
    });
    return loaderPromise;
  }

  async function execute(action) {
    const grecaptcha = await load();
    let token;
    try {
      token = await grecaptcha.execute(SITE_KEY, { action });
    } catch (err) {
      throw makeError("misconfigured", (err && err.message) || "reCAPTCHA could not run on this page.", { cause: err });
    }
    if (!token) throw makeError("rejected", "reCAPTCHA returned an empty token.");
    return token;
  }

  const KNOWN_CODES = ["rejected", "low-score", "action-mismatch", "unavailable", "misconfigured"];

  async function verify(action) {
    const token = await execute(action);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    let response;
    try {
      response = await window.fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
        signal: controller.signal,
      });
    } catch (err) {
      const timedOut = err && err.name === "AbortError";
      throw makeError(
        timedOut ? "timeout" : "network",
        timedOut ? "The security check timed out." : "The security check could not reach the server.",
      );
    } finally {
      window.clearTimeout(timer);
    }

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      const raw = data && typeof data.code === "string" ? data.code : "";
      const fallback = response.status >= 500 || response.status === 404 ? "unavailable" : "rejected";
      throw makeError(KNOWN_CODES.includes(raw) ? raw : fallback, (data && (data.error || data.message)) || `The security check failed (HTTP ${response.status}).`, {
        status: response.status,
      });
    }

    if (!data || data.success !== true) {
      const raw = data && typeof data.code === "string" ? data.code : "";
      throw makeError(KNOWN_CODES.includes(raw) ? raw : "rejected", (data && (data.error || data.message)) || "The security check did not pass.", {
        score: data && data.score,
      });
    }

    return data;
  }

  function describe(error) {
    const code = error && error.code;
    if (code === "low-score") {
      return "This browser looks automated, so the check did not pass. Try again, or open the site in a normal browser window.";
    }
    if (code === "action-mismatch" || code === "rejected") {
      return "The security check did not pass. Please try again.";
    }
    if (isUnavailable(error)) {
      return "The security check is unavailable right now. Please try again in a moment.";
    }
    return (error && error.message) || "The security check failed. Please try again.";
  }

  function isUnavailable(error) {
    const code = error && error.code;
    return code === "unavailable" || code === "network" || code === "timeout" || code === "misconfigured";
  }

  function runGate(options) {
    if (gatePromise) return gatePromise;

    const settings = options || {};
    const overlay = settings.overlay || document.getElementById("recaptcha-gate");
    if (!overlay) {
      gatePromise = Promise.resolve({ verified: true, reason: "no-overlay" });
      return gatePromise;
    }

    const statusEl = settings.statusEl || document.getElementById("recaptcha-gate-status");
    const retryBtn = settings.retryBtn || document.getElementById("recaptcha-gate-retry");
    const action = settings.action || ACTIONS.ENTRY_GATE;

    const setStatus = (message, isError) => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.toggle("is-error", Boolean(isError));
    };

    const hide = () => {
      overlay.classList.add("hidden");
      document.documentElement.classList.add("recaptcha-passed");
    };

    if (sessionPassed()) {
      hide();
      gatePromise = Promise.resolve({ verified: true, cached: true });
      return gatePromise;
    }

    if (navigator.onLine === false) {
      hide();
      gatePromise = Promise.resolve({ verified: false, reason: "offline" });
      return gatePromise;
    }

    gatePromise = new Promise((resolve) => {
      let finished = false;

      const finish = (result) => {
        if (finished) return;
        finished = true;
        hide();
        console.log("[reCAPTCHA] Entry gate:", result);
        resolve(result);
      };

      const attempt = async () => {
        setStatus("Contacting Google reCAPTCHA…", false);
        try {
          const data = await verify(action);
          markPassed();
          finish({ verified: true, score: data && data.score });
        } catch (error) {
          console.warn("[reCAPTCHA] Entry gate check failed:", error && error.code, error && error.message);
          if (isUnavailable(error)) {
            setStatus("Verification is unavailable right now — continuing without it.", true);
            window.setTimeout(() => finish({ verified: false, reason: (error && error.code) || "unavailable" }), 1200);
            return;
          }
          setStatus(describe(error), true);
          if (retryBtn) retryBtn.classList.remove("hidden");
        }
      };

      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          retryBtn.classList.add("hidden");
          clearSession();
          attempt();
        });
      }

      attempt();
    });

    return gatePromise;
  }

  window.GBRRecaptcha = {
    SITE_KEY,
    VERIFY_URL,
    ACTIONS,
    load,
    execute,
    verify,
    runGate,
    describe,
    isUnavailable,
    session: {
      passed: sessionPassed,
      markPassed,
      clear: clearSession,
    },
  };
})();

