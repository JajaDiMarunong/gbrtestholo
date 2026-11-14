# learn-more

Writes the "Learn More" brief that the app shows under an artwork (detail screen
and library popup).

The browser never talks to Tavily or Groq directly. It posts the artwork metadata
it already has; this function owns the search query, the summarising prompt and
both API keys, then returns a short brief plus the pages it was written from.

```
app  --POST { artId, name, artist, year, location, details }-->  learn-more
                                                                  |-> Tavily /search
                                                                  |-> Groq /chat/completions
app  <-- { summary, facts, caution, sources, engine } ------------
```

## Secrets

| Name | Required | Notes |
| --- | --- | --- |
| `TAVILY_API_KEY` | yes | Search + own answer fallback. |
| `GROQ_API_KEY` | no | Same key the chat proxy uses. Without it the card falls back to Tavily's answer. |
| `ALLOWED_ORIGINS` | no | Comma separated allow list, e.g. `https://gbrmuseumtest.web.app`. Empty = any origin. |
| `TAVILY_SEARCH_DEPTH` | no | `advanced` (default) or `basic` (cheaper: 1 credit instead of 2). |
| `LEARN_MORE_ENABLED` | no | `false` turns the feature off with no redeploy. |
| `LEARN_DEVICE_HOURLY_LIMIT` | no | Default `8`. |
| `LEARN_DEVICE_DAILY_LIMIT` | no | Default `30`. |
| `LEARN_IP_MINUTE_LIMIT` | no | Default `20`. |
| `LEARN_GLOBAL_DAILY_LIMIT` | no | Default `15` searches/day — sized for the 1,000-credit free plan. |

`SUPABASE_URL` / `SUPABASE_ANON_KEY` are injected by Supabase and are not used
here. The function is registered in `supabase/config.toml` with
`verify_jwt = false` (like the other functions in this project) because the app
calls it with plain `fetch` and no `Authorization` header — deploy with
`supabase functions deploy learn-more` so that setting is applied. Without it the
gateway answers 401 and the card shows "Something went wrong".

## Deploy

```bash
supabase functions deploy learn-more
supabase secrets set TAVILY_API_KEY=tvly-... --project-ref <ref>
```

`GROQ_API_KEY` is already set for the chat proxy; `supabase secrets list` confirms it.

## Calling it

```bash
curl -sS "https://<ref>.functions.supabase.co/functions/v1/learn-more" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device" \
  -d '{"artId":"art-1791702942829-bunwa","name":"Puente de Malabon (Malabon Bridge)","artist":"GBR Jr. Museum Collection","year":"19th Century","location":"GBR Jr. Museum, General Trias, Philippines"}'
```

Success (200):

```json
{
  "artId": "art-1791702942829-bunwa",
  "name": "Puente de Malabon (Malabon Bridge)",
  "summary": "One to three short paragraphs, separated by blank lines.",
  "facts": [{ "label": "Rank", "value": "General of the Army" }],
  "caution": "Empty when the sources agree.",
  "sources": [{ "title": "…", "url": "https://…" }],
  "engine": "groq",
  "model": "llama-3.3-70b-versatile",
  "fetchedAt": "2026-01-01T00:00:00.000Z",
  "cached": false
}
```

`engine` tells the app where the words came from:

* `groq` — Groq rewrote the Tavily excerpts (normal path).
* `tavily` — Groq was rate limited or unset, so Tavily's own answer is shown.
* `sources` — only links were found; the app shows them with a short notice.

Errors return `{ "error": "plain-language sentence" }` with a status of 400
(missing artwork id/name), 404 (nothing found), 429 (rate limited, plus
`Retry-After`), 500 (key missing/misconfigured), 502 (search unreachable) or 503
(Tavily credits exhausted or `LEARN_MORE_ENABLED=false`). The app prints
`error` verbatim, so new messages must stay visitor-friendly.

## Cost control

* Answers are cached per artwork for 7 days (server, up to 120 entries) and the
  app keeps its own 7-day copy, so repeated taps cost nothing.
* Only a brief that actually produced text is cached; a thin result is retried by
  the next visitor.
* `advanced` depth costs 2 Tavily credits per search; the default global budget of
  15 searches/day is ~900 credits a month, which fits the free plan (1,000
  credits). The week-long cache is what makes that enough: a return visitor, a
  reopened card or a second device costs nothing.
* The query and prompt are built on the server from sanitised artwork metadata,
  so this endpoint cannot be used as a general web-search or summarisation proxy.
