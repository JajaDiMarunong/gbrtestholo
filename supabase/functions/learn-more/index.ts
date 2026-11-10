// "Learn More" lookup for a single artwork: Tavily finds the pages, Groq
// rewrites them into a short brief.
//
// The browser never sees either key. It posts only the artwork metadata it
// already has; this function owns the query, the prompt and the keys, and
// returns a short brief plus the pages the brief is based on.
//
// Each half has a fallback, because a museum counter cannot wait on a retry:
//   * if Tavily answers but Groq is rate limited (the free tier is per minute),
//     the card is filled with Tavily's own synthesised answer instead of an
//     error, and the payload says engine: "tavily";
//   * if Tavily itself is out of credits (HTTP 432) the card says so in plain
//     words instead of blaming the visitor's connection.
//
// Abuse control lives here, not in the app:
//   * the query and prompt cannot be replaced or extended by the caller, so the
//     endpoint cannot be rented out as a general purpose search/summary proxy;
//   * the output budget is fixed and small;
//   * per-device, per-IP and global counters cap how much quota one visitor (or
//     one leaked URL) can burn;
//   * answers are cached per artwork for a week, so a busy day reuses one search;
//   * LEARN_MORE_ENABLED=false turns the feature off without a redeploy.

import "@supabase/functions-js/edge-runtime.d.ts";

const TAVILY_API_KEY = (Deno.env.get("TAVILY_API_KEY") || "").trim();
const TAVILY_ENDPOINT = "https://api.tavily.com/search";
// "advanced" returns fuller page excerpts, which is what the brief is written
// from; "basic" is cheaper per credit if the plan is tight.
const TAVILY_DEPTH = (Deno.env.get("TAVILY_SEARCH_DEPTH") || "").trim() === "basic" ? "basic" : "advanced";
const TAVILY_MAX_RESULTS = 6;

// Never cited: social networks, image dumps and SEO farms. Kept short on purpose —
// a local heritage group on Facebook sometimes carries the only photo of an old
// bridge, but it is not something a museum should present as its source.
const EXCLUDED_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "x.com",
  "quora.com",
  "tripadvisor.com",
];

const GROQ_API_KEY = (Deno.env.get("GROQ_API_KEY") || "").trim();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Same catalogue the chat proxy prefers, ordered so answer quality comes first.
// A retired id is skipped on a 400/404 instead of ending the request, so this
// list can go stale without breaking Learn More.
const LEARN_MODELS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
];

const ENABLED = (Deno.env.get("LEARN_MORE_ENABLED") || "true").toLowerCase() !== "false";

// Comma separated list, e.g. "https://gbrmuseumtest.web.app,https://gbrmuseumtest.firebaseapp.com".
// Empty means "any origin", which is acceptable because no credential is exposed
// by a cross-origin call, and the counters below still apply to whoever calls.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function envNumber(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const DEVICE_HOURLY_LIMIT = envNumber("LEARN_DEVICE_HOURLY_LIMIT", 8);
const DEVICE_DAILY_LIMIT = envNumber("LEARN_DEVICE_DAILY_LIMIT", 30);
const IP_MINUTE_LIMIT = envNumber("LEARN_IP_MINUTE_LIMIT", 20);
// Each Tavily search costs a credit (1 basic, 2 advanced) and the free plan is
// 1,000 credits a month. At 2 credits a search, 15 searches a day stays inside
// that plan even with no cache hits, and the week-long cache below means a busy
// Saturday normally reuses the morning's searches instead of adding new ones.
// Raise this after upgrading; the number is the hard stop on the account.
const GLOBAL_DAILY_LIMIT = envNumber("LEARN_GLOBAL_DAILY_LIMIT", 15);

// Searches cost credits, and artwork histories change slowly, so a page stays
// cached for a week rather than a morning.
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 120;

// How long the summarising step may take before Tavily's own answer is used
// instead. The app cancels the request at 30 s, so this plus the search has to
// stay comfortably under that.
const SUMMARY_BUDGET_MS = 13000;
// A single model attempt. A visitor waiting on the card should never feel one
// slow model.
const GROQ_ATTEMPT_MS = 9000;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface Counter {
  count: number;
  resetAt: number;
}

interface CachedAnswer {
  at: number;
  payload: Record<string, unknown>;
}

const counters = new Map<string, Counter>();
const answerCache = new Map<string, CachedAnswer>();

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  let allowed = "*";
  if (ALLOWED_ORIGINS.length > 0) {
    allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  }
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Device-Id",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
  if (allowed) headers["Access-Control-Allow-Origin"] = allowed;
  return headers;
}

function originRejected(req: Request): boolean {
  if (ALLOWED_ORIGINS.length === 0) return false;
  const origin = req.headers.get("origin") || "";
  return !ALLOWED_ORIGINS.includes(origin);
}

function jsonResponse(req: Request, data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(req), ...extra } });
}

function errorResponse(req: Request, message: string, status: number, retryAfter?: number): Response {
  const extra: Record<string, string> = {};
  if (retryAfter && retryAfter > 0) extra["Retry-After"] = String(Math.ceil(retryAfter));
  return jsonResponse(req, { error: message, retryAfter: retryAfter || 0 }, status, extra);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function sanitizeId(value: string | null): string {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function sanitizeText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

function pruneCounters(now: number): void {
  if (counters.size < 400) return;
  for (const [key, entry] of counters) {
    if (now >= entry.resetAt) counters.delete(key);
  }
}

// Fixed-window counter: `limit` calls allowed inside `windowMs`.
function takeToken(key: string, windowMs: number, limit: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  pruneCounters(now);
  const entry = counters.get(key);
  if (!entry || now >= entry.resetAt) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function pruneCache(now: number): void {
  for (const [key, entry] of answerCache) {
    if (now - entry.at > CACHE_TTL_MS) answerCache.delete(key);
  }
  while (answerCache.size > CACHE_MAX_ENTRIES) {
    const oldest = answerCache.keys().next();
    if (oldest.done) break;
    answerCache.delete(oldest.value);
  }
}

interface ArtworkInput {
  name: string;
  artist: string;
  year: string;
  location: string;
  details: string;
}

// The query is fixed on the server from artwork metadata, so this endpoint can
// never be used as a general web-search proxy.
function buildSearchQuery(artwork: ArtworkInput): string {
  const parts = [artwork.name];
  if (artwork.artist) parts.push(artwork.artist);
  parts.push("Philippines art history");
  return sanitizeText(parts.join(" "), 200);
}

interface SearchHit {
  title: string;
  url: string;
  content: string;
}

function buildPrompt(artwork: ArtworkInput, hits: SearchHit[]): string {
  const meta = [
    artwork.artist ? `artist: ${artwork.artist}` : "",
    artwork.year ? `year: ${artwork.year}` : "",
    artwork.location ? `museum location: ${artwork.location}` : "",
  ].filter(Boolean).join("; ");

  // Numbered excerpts, so a claim in the brief can always be traced to a source
  // the visitor can open. The list order matches the sources the app shows.
  const excerpts = hits.map((hit, index) => {
    let host = hit.url;
    try {
      host = new URL(hit.url).hostname.replace(/^www\./, "");
    } catch (_) { /* keep the raw url */ }
    return `[${index + 1}] ${hit.title} — ${host}\n${hit.content}`;
  }).join("\n\n");

  return [
    `A visitor at the Geronimo Berenguer de los Reyes (GBR), Jr. Museum in General Trias, Cavite, Philippines`,
    `just opened "${artwork.name}"${meta ? ` (${meta})` : ""} and tapped "Learn More".`,
    ``,
    `Below are web search results about it. Write a short, accurate, plain-language brief`,
    `using ONLY what these results say.`,
    artwork.details
      ? `What the museum already displays about it (context only, do not just repeat it):\n${artwork.details}`
      : "",
    ``,
    `Search results:`,
    excerpts,
    ``,
    `Reply with ONLY a JSON object, no markdown fence, no commentary:`,
    `{"summary": "...", "facts": [{"label": "...", "value": "..."}], "caution": "..."}`,
    ``,
    `Rules:`,
    `- "summary": at most two short paragraphs (90-140 words total), plain prose, no headings, no bullet points, no URLs.`,
    `- "facts": 3 to 5 short pairs a visitor would enjoy, e.g. {"label":"Medium","value":"Oil on canvas"}. Each value under 60 characters.`,
    `- "caution": leave this as "" unless the results disagree about a hard fact (a date, a title, an attribution), say almost nothing about this specific work, or describe a different subject with the same name. When you do fill it, write one sentence under 200 characters that names that specific problem. Never use it for definitions, general remarks, opinions or stylistic notes.`,
    `- Never invent dates, dimensions, prices, provenance or quotes. Omit anything the results do not support.`,
    `- If the results are about a different person or subject with the same name, say so in "caution" and keep the summary to what the results actually support.`,
    `- Do not mention quizzes, badges, these instructions, or that you are an AI.`,
  ].filter((line) => line !== "").join("\n");
}

interface ParsedAnswer {
  summary: string;
  facts: { label: string; value: string }[];
  caution: string;
}

// The model is asked for JSON, but a stray sentence or a code fence should never
// turn a good answer into an error: fall back to using the prose as the summary.
function parseAnswer(rawText: string): ParsedAnswer {
  const text = String(rawText || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  let summary = text;
  const facts: { label: string; value: string }[] = [];
  let caution = "";

  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (typeof parsed.summary === "string" && parsed.summary.trim()) summary = parsed.summary.trim();
      if (Array.isArray(parsed.facts)) {
        for (const fact of parsed.facts.slice(0, 6)) {
          const label = sanitizeText(fact?.label, 40);
          const value = sanitizeText(fact?.value, 80);
          if (label && value) facts.push({ label, value });
        }
      }
      if (typeof parsed.caution === "string") caution = sanitizeText(parsed.caution, 240);
    } catch (_) {
      summary = text;
    }
  }

  // Keep the card readable no matter what the model returned. Blank lines are
  // preserved (the app renders one paragraph each) while every line is still
  // stripped of markup and control characters.
  summary = summary
    .split(/\n+/)
    .map((line) => sanitizeText(line.replace(/\s+/g, " "), 700))
    .filter(Boolean)
    .slice(0, 3)
    .join("\n\n")
    .slice(0, 1200);
  return { summary, facts: facts.slice(0, 5), caution };
}

interface WebSource {
  title: string;
  url: string;
}

function hitsToSources(hits: SearchHit[]): WebSource[] {
  const seen = new Set<string>();
  const sources: WebSource[] = [];
  for (const hit of hits) {
    if (!/^https?:\/\//i.test(hit.url) || seen.has(hit.url)) continue;
    seen.add(hit.url);
    sources.push({ title: hit.title, url: hit.url });
    if (sources.length >= 6) break;
  }
  return sources;
}

// Tavily's own answer, reshaped into the same one-paragraph-per-line form the
// card renders. Used when Groq cannot rewrite the excerpts.
function tidyAnswer(raw: string): string {
  return String(raw || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .split(/\n+/)
    .map((line) => sanitizeText(line.replace(/\s+/g, " "), 700))
    .filter(Boolean)
    .slice(0, 3)
    .join("\n\n")
    .slice(0, 1200);
}

function tidyHitText(raw: unknown, max: number): string {
  return sanitizeText(String(raw ?? "").replace(/\s+/g, " "), max);
}

type TavilyResult =
  | { ok: true; answer: string; hits: SearchHit[] }
  | { ok: false; status: number; retryAfter: number; message: string };

async function requestTavily(query: string): Promise<TavilyResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  const body: Record<string, unknown> = {
    query,
    search_depth: TAVILY_DEPTH,
    max_results: TAVILY_MAX_RESULTS,
    topic: "general",
    // Costs nothing extra and doubles as the fallback brief if Groq is out.
    include_answer: "advanced",
    include_raw_content: false,
    include_images: false,
    // Museum briefs should rest on pages a visitor can trust. Social posts and
    // stock aggregators are dropped before the excerpts are ever written.
    exclude_domains: EXCLUDED_DOMAINS,
  };
  // Tavily only accepts chunks_per_source on the advanced depth; sending it with
  // basic is rejected as an invalid request.
  if (TAVILY_DEPTH === "advanced") body.chunks_per_source = 3;

  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await res.text();

    if (!res.ok) {
      let message = `status ${res.status}`;
      try {
        const err = JSON.parse(raw);
        const detail = err?.detail;
        message = (typeof detail === "string" && detail) || detail?.error || err?.error || err?.message || message;
      } catch (_) { /* non-JSON error body */ }
      const headerRetry = Number(res.headers.get("retry-after"));
      // 432 is Tavily's "plan credit limit reached" — waiting a minute will not
      // help, so the card asks the visitor to come back later instead.
      const retryAfter = res.status === 432
        ? 6 * HOUR_MS / 1000
        : (Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : 30);
      console.warn("[learn-more] Tavily failed:", res.status, String(message).slice(0, 240));
      return { ok: false, status: res.status, retryAfter, message: String(message) };
    }

    const data = JSON.parse(raw);
    const answer = typeof data?.answer === "string" ? tidyAnswer(data.answer) : "";
    const hits: SearchHit[] = [];

    for (const item of Array.isArray(data?.results) ? data.results : []) {
      const url = typeof item?.url === "string" ? item.url.trim().slice(0, 500) : "";
      if (!/^https?:\/\//i.test(url) || hits.some((hit) => hit.url === url)) continue;
      const title = tidyHitText(item?.title, 120) || new URL(url).hostname.replace(/^www\./, "");
      const content = tidyHitText(item?.content, 900);
      hits.push({ title, url, content });
      if (hits.length >= TAVILY_MAX_RESULTS) break;
    }

    return { ok: true, answer, hits };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("[learn-more] Tavily request error:", err);
    return { ok: false, status: aborted ? 504 : 502, retryAfter: 0, message: aborted ? "Search timed out" : "Search network error" };
  } finally {
    clearTimeout(timer);
  }
}

type GroqLearnResult =
  | { ok: true; text: string }
  | { ok: false; status: number; retryAfter: number; message: string; deadModel: boolean };

async function requestGroq(model: string, prompt: string, timeoutMs: number): Promise<GroqLearnResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: "You write short, factual museum notes from supplied web search results." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  };
  // gpt-oss models spend the output budget on hidden reasoning unless limited.
  if (model.includes("gpt-oss")) payload.reasoning_effort = "low";

  try {
    let res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.status === 400) {
      // Some models reject response_format / reasoning_effort; retry without them.
      console.warn("[learn-more] Groq 400 from", model, "- retrying without optional params");
      delete payload.response_format;
      delete payload.reasoning_effort;
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    const raw = await res.text();

    if (!res.ok) {
      let message = `status ${res.status}`;
      try {
        const parsed = JSON.parse(raw);
        message = parsed?.error?.message || parsed?.message || message;
      } catch (_) { /* non-JSON error body */ }
      const headerRetry = Number(res.headers.get("retry-after"));
      const retryAfter = Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : 30;
      console.warn("[learn-more] Groq failed:", model, res.status, String(message).slice(0, 200));
      // 400/404 mean this model id is gone or unsupported; another one may still
      // answer, so the caller moves down the list instead of giving up.
      return {
        ok: false,
        status: res.status,
        retryAfter,
        message: String(message),
        deadModel: res.status === 400 || res.status === 404,
      };
    }

    const data = JSON.parse(raw);
    const choice = data?.choices?.[0];
    const text = String(choice?.message?.content ?? "").trim();
    if (!text) {
      console.warn("[learn-more] Groq answered empty:", model, choice?.finish_reason);
      return { ok: false, status: 502, retryAfter: 0, message: "Empty answer", deadModel: true };
    }
    return { ok: true, text };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("[learn-more] Groq request error:", err);
    return {
      ok: false,
      status: aborted ? 504 : 502,
      retryAfter: 0,
      message: aborted ? "Timed out" : "Network error",
      deadModel: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

interface SummarizeResult {
  text: string;
  model: string;
  failure: { status: number; retryAfter: number } | null;
}

// Walk the model list inside one overall budget, so one retired id, one 429 and
// one slow model still add up to a single card the visitor can read.
async function summarize(artwork: ArtworkInput, hits: SearchHit[]): Promise<SummarizeResult> {
  const prompt = buildPrompt(artwork, hits);
  const deadline = Date.now() + SUMMARY_BUDGET_MS;
  let failure: { status: number; retryAfter: number } | null = null;

  for (const model of LEARN_MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 2500) break;
    const result = await requestGroq(model, prompt, Math.min(GROQ_ATTEMPT_MS, remaining));
    if (result.ok) return { text: result.text, model, failure: null };
    failure = { status: result.status, retryAfter: result.retryAfter };
    // A 429 from Groq is usually the per-minute token bucket. Moving to the next
    // model would spend the visitor's wait on a bucket that is just as empty, so
    // only a missing/unsupported model is worth another attempt.
    if (!result.deadModel) break;
  }

  return { text: "", model: "", failure };
}

const APP = {
  fetch: async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    if (originRejected(req)) {
      return errorResponse(req, "Origin not allowed", 403);
    }
    if (!ENABLED) {
      return errorResponse(req, "Learn More is taking a short break. Please ask museum staff.", 503);
    }
    if (!TAVILY_API_KEY) {
      console.error("[learn-more] TAVILY_API_KEY is not set");
      return errorResponse(req, "Learn More is not set up yet. Please ask museum staff.", 500);
    }
    if (req.method !== "POST") {
      return errorResponse(req, "Method not allowed", 405);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (_) {
      return errorResponse(req, "Invalid JSON body", 400);
    }

    const artId = sanitizeId(typeof body.artId === "string" ? body.artId : "");
    if (!artId) {
      return errorResponse(req, "Missing artwork id", 400);
    }
    const artwork: ArtworkInput = {
      name: sanitizeText(body.name, 120),
      artist: sanitizeText(body.artist, 90),
      year: sanitizeText(body.year, 40),
      location: sanitizeText(body.location, 120),
      details: sanitizeText(body.details, 600),
    };
    if (!artwork.name) {
      return errorResponse(req, "Missing artwork name", 400);
    }

    // The device id is a random string kept in the app; it is not a security
    // boundary (a determined visitor can clear it), it exists so one visitor
    // cannot spend the whole day's search budget by refreshing the card.
    const deviceId = sanitizeId(req.headers.get("x-device-id"));
    const ip = getClientIp(req);
    const now = Date.now();

    // Cheap gates first: a cached artwork costs nothing, so it is answered before
    // either the IP or the global budget is touched.
    const cached = answerCache.get(artId);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      return jsonResponse(req, { ...cached.payload, cached: true });
    }

    const ipBudget = takeToken(`ip:${ip}`, MINUTE_MS, IP_MINUTE_LIMIT);
    if (!ipBudget.allowed) {
      return errorResponse(req, "Too many lookups from this network right now. Please wait a moment.", 429, ipBudget.retryAfter);
    }

    if (deviceId) {
      const hourly = takeToken(`dev-h:${deviceId}`, HOUR_MS, DEVICE_HOURLY_LIMIT);
      if (!hourly.allowed) {
        return errorResponse(
          req,
          "You have used a lot of lookups this hour. Please try again a little later or ask museum staff.",
          429,
          hourly.retryAfter,
        );
      }
      const daily = takeToken(`dev-d:${deviceId}`, DAY_MS, DEVICE_DAILY_LIMIT);
      if (!daily.allowed) {
        return errorResponse(
          req,
          "You have reached today's Learn More limit. Please ask museum staff for more.",
          429,
          daily.retryAfter,
        );
      }
    }

    const globalBudget = takeToken("global-daily", DAY_MS, GLOBAL_DAILY_LIMIT);
    if (!globalBudget.allowed) {
      console.warn("[learn-more] Global daily search budget reached");
      return errorResponse(req, "Learn More is resting for today. Please ask museum staff.", 429, globalBudget.retryAfter);
    }

    try {
      const search = await requestTavily(buildSearchQuery(artwork));
      if (!search.ok) {
        if (search.status === 432) {
          return errorResponse(req, "Learn More has used up its searches for now. Please ask museum staff.", 503, search.retryAfter);
        }
        if (search.status === 401 || search.status === 403) {
          console.error("[learn-more] Tavily rejected the key — check TAVILY_API_KEY");
          return errorResponse(req, "Learn More is not set up correctly. Please ask museum staff.", 500);
        }
        if (search.status === 429) {
          return errorResponse(req, "Learn More is busy right now. Please try again in a minute.", 429, search.retryAfter);
        }
        return errorResponse(req, "Couldn't reach the web search. Please try again.", 502);
      }

      const sources = hitsToSources(search.hits);
      let summary = "";
      let facts: { label: string; value: string }[] = [];
      let caution = "";
      let engine = "groq";
      let model = "";

      if (search.hits.length > 0) {
        const result = await summarize(artwork, search.hits);
        if (result.text) {
          const parsed = parseAnswer(result.text);
          summary = parsed.summary;
          facts = parsed.facts;
          caution = parsed.caution;
          model = result.model;
        }
      }

      // Groq is the writer, not the source of truth: when it is rate limited the
      // search engine's own answer still gives the visitor something to read.
      if (!summary && search.answer) {
        summary = search.answer;
        engine = "tavily";
      }
      if (!summary && sources.length > 0) engine = "sources";

      if (!summary && sources.length === 0) {
        return errorResponse(req, "No web notes found for this artwork yet. Please ask museum staff.", 404);
      }

      const payload: Record<string, unknown> = {
        artId,
        name: artwork.name,
        summary,
        facts,
        caution,
        sources,
        engine,
        model,
        fetchedAt: new Date().toISOString(),
        cached: false,
      };

      // Only a search that produced something is cached; a thin result is left
      // uncached so the next visitor can get a better one.
      if (summary) {
        answerCache.set(artId, { at: Date.now(), payload });
        pruneCache(Date.now());
      }
      return jsonResponse(req, payload);
    } catch (err) {
      console.error("[learn-more] Error:", err);
      return errorResponse(req, "Something went wrong looking this up. Please ask museum staff.", 500);
    }
  },
};

export default APP;
