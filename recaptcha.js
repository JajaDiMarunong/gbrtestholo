/* Google reCAPTCHA v3 (invisible) — shared client helper.
   Loaded by index.html (entry gate) and admin.html (login check).

   Only the public site key lives here. The shared secret stays in the
   `recaptcha-verify` edge function (Supabase function secret
   RECAPTCHA_SECRET_KEY), which judges the score and the action name.

   Fail-open vs fail-closed:
   - The museum gate fails open when Google or the edge function cannot be
     reached, because the museum is an offline-first PWA and a network outage
     must not lock visitors out. A low score still blocks the page.
   - The admin login fails closed on a verdict — a low score, a rejected token
     or an action mismatch means no sign-in. It only degrades when the verifier
     itself is unreachable (not deployed yet, Supabase down, no network),
     because Firebase still checks the password and a broken verifier must not
     lock the curator out of the panel. */
(function () {
  "use strict";

  const SITE_KEY = "6LduFx4uAAAAAIbhUmAqwZ9Ihl9P7yQZH9qvmQln";
  const VERIFY_URL = "https://twkgioiyfjfkppzerdii.functions.supabase.co/functions/v1/recaptcha-verify";
  const SCRIPT_SRC = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
  const SCRIPT_ID = "gbr-recaptcha-script";

  // One passing score covers the rest of the tab's session (six hours), so a
  // reload or a trip to the guestbook does not re-run the gate.
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
      // Private mode without storage: the gate simply runs again next reload.
    }
  }

  function clearSession() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      // Ignore: nothing was stored.
    }
  }

  // Injects https://www.google.com/recaptcha/api.js once and resolves with the
  // grecaptcha object once it is ready to execute.
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

    // A failed load must be retryable (the gate offers "Try again").
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
      // Google refused to mint a token: the site key does not cover this domain,
      // the script was blocked, or the network dropped. Report it as a
      // configuration/availability problem so the museum gate fails open and the
      // admin card can say "unavailable" instead of showing a raw Google error.
      throw makeError("misconfigured", (err && err.message) || "reCAPTCHA could not run on this page.", { cause: err });
    }
    if (!token) throw makeError("rejected", "reCAPTCHA returned an empty token.");
    return token;
  }

  // Error codes this helper agrees on with the recaptcha-verify edge function.
  // Anything else (for example the gateway's NOT_FOUND when the function has not
  // been deployed yet) is translated from the HTTP status instead of trusted,
  // so an infrastructure problem never looks like a rejected visitor.
  const KNOWN_CODES = ["rejected", "low-score", "action-mismatch", "unavailable", "misconfigured"];

  // Runs the token through the edge function. Resolves with
  // { success, action, score, threshold, ... } or throws an Error whose `code`
  // is one of: rejected, low-score, action-mismatch, unavailable, network,
  // timeout, misconfigured.
  async function verify(action) {
    const token = await execute(action);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    let response;
    try {
      response = await window.fetch(VERIFY_URL, {
        method: "POST",
        // The function speaks JSON and answers the CORS preflight (OPTIONS -> 204
        // with Access-Control-Allow-Headers), which is what lets the browser send
        // this POST. If the verifier is missing, the preflight fails, fetch()
        // throws, and the caller treats it as "network": the gate fails open and
        // admin sign-in degrades instead of blocking.
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
      // 404 means the edge function is not deployed; 5xx/0 mean it is down.
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
      // Never surface a gateway string such as "Requested function was not found".
      return "The security check is unavailable right now. Please try again in a moment.";
    }
    return (error && error.message) || "The security check failed. Please try again.";
  }

  // True when retrying cannot help: Google or the edge function is unreachable.
  function isUnavailable(error) {
    const code = error && error.code;
    return code === "unavailable" || code === "network" || code === "timeout" || code === "misconfigured";
  }

  // Entry gate for index.html. It never rejects: the museum boots once the
  // browser passes, and also when verification is unavailable (offline). A low
  // score keeps the overlay up with a retry button.
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

