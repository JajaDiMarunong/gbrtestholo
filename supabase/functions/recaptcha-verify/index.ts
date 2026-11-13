import "@supabase/functions-js/edge-runtime.d.ts";

// Server-side half of the reCAPTCHA v3 gate used by recaptcha.js.
// The browser only ever holds the public site key; the shared secret lives in
// the Supabase function secrets as RECAPTCHA_SECRET_KEY (see SECURITY.md) and
// is never returned to the page.
const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Only actions this site actually uses may be verified. A token minted for one
// action cannot be replayed for another.
const ALLOWED_ACTIONS = new Set(["entry_gate", "admin_login"]);

// v3 scores run from 0.0 (automated) to 1.0 (human). 0.4 keeps normal mobile
// and privacy-browser traffic usable while still cutting obvious bots.
const DEFAULT_MIN_SCORE = 0.4;
const TOKEN_MAX_LENGTH = 10000;

interface GoogleVerification {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

interface VerifyBody {
  token?: unknown;
  action?: unknown;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() });
}

function secretKey(): string {
  return (Deno.env.get("RECAPTCHA_SECRET_KEY") || "").trim();
}

function minScore(): number {
  const parsed = Number(Deno.env.get("RECAPTCHA_MIN_SCORE"));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : DEFAULT_MIN_SCORE;
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (req.method !== "POST") {
      return json({ success: false, code: "method-not-allowed", error: "Method not allowed" }, 405);
    }

    let body: VerifyBody;
    try {
      body = await req.json();
    } catch (err) {
      return json({ success: false, code: "bad-request", error: "Expected a JSON body." }, 400);
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "";
    if (!token || token.length > TOKEN_MAX_LENGTH) {
      return json({ success: false, code: "bad-request", error: "Missing or invalid reCAPTCHA token." }, 400);
    }
    if (!ALLOWED_ACTIONS.has(action)) {
      return json(
        { success: false, code: "unknown-action", error: `Unsupported action: ${action || "(missing)"}.` },
        400,
      );
    }

    const secret = secretKey();
    if (!secret) {
      console.error("[recaptcha-verify] RECAPTCHA_SECRET_KEY is not set");
      return json(
        { success: false, code: "misconfigured", error: "reCAPTCHA is not configured on the server." },
        500,
      );
    }

    const form = new URLSearchParams({ secret, response: token });
    const ip = clientIp(req);
    if (ip) form.set("remoteip", ip);

    let verification: GoogleVerification;
    try {
      const res = await fetch(SITEVERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!res.ok) {
        console.error("[recaptcha-verify] siteverify answered HTTP", res.status);
        return json(
          { success: false, code: "unavailable", error: "Google reCAPTCHA is unavailable right now." },
          502,
        );
      }
      verification = await res.json();
    } catch (err) {
      console.error("[recaptcha-verify] siteverify request failed:", err instanceof Error ? err.message : err);
      return json(
        { success: false, code: "unavailable", error: "Google reCAPTCHA is unavailable right now." },
        502,
      );
    }

    const codes = Array.isArray(verification["error-codes"]) ? verification["error-codes"] : [];

    if (!verification.success) {
      // A bad secret is our problem, not the visitor's: report it as a server
      // error so the client can say "try again later" instead of "you are a bot".
      if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
        console.error("[recaptcha-verify] Google rejected the configured secret:", codes.join(", "));
        return json(
          { success: false, code: "misconfigured", error: "reCAPTCHA is not configured correctly on the server." },
          500,
        );
      }
      return json(
        { success: false, code: "rejected", error: "reCAPTCHA could not verify this browser.", codes },
        200,
      );
    }

    if (verification.action && verification.action !== action) {
      return json(
        { success: false, code: "action-mismatch", error: "reCAPTCHA token does not match this action.", codes },
        200,
      );
    }

    const score = typeof verification.score === "number" ? verification.score : null;
    const threshold = minScore();

    if (score !== null && score < threshold) {
      console.warn("[recaptcha-verify] Low score", score, "for action", action);
      return json(
        {
          success: false,
          code: "low-score",
          error: "This browser scored too low on the automated-traffic check.",
          score,
          threshold,
        },
        200,
      );
    }

    return json({
      success: true,
      action,
      score,
      threshold,
      challenge_ts: verification.challenge_ts ?? null,
      hostname: verification.hostname ?? null,
    });
  },
};
