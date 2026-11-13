# Security notes

This file tracks where credentials live, which public keys are safe to ship, and
the one incident that still needs action from the project owner.

## Status: one key is public and must be rotated

`supabase/functions/upload-signed-url/index.ts` used to contain a hardcoded
Supabase **`service_role`** JWT:

```
iss: twkgioiyfjfkppzerdii, role: service_role, exp: 2104347307 (2036)
```

That file was committed in `e07debc` and this repository is **public**
(`github.com/JajaDiMarunong/gbrtestholo`), so the key has to be treated as
compromised. It still works: a `GET /rest/v1/` request with it returns `200`.
A `service_role` key bypasses Row Level Security on every table and every
storage object, so anyone holding it can read or overwrite the whole Supabase
project.

The key has been removed from the source, but **removing it from the code does
not revoke it**. Rotation is the only real fix, and it can only be done from the
Supabase dashboard.

### Rotating it (owner action, ~2 minutes)

1. Open <https://supabase.com/dashboard/project/twkgioiyfjfkppzerdii/settings/api>.
2. Under **JWT Settings**, use **Rotate JWT signing key** (or generate new API
   keys and disable the legacy ones).

   - Rotating the JWT secret invalidates the leaked `service_role` and `anon`
     JWTs immediately. The app itself is not affected: the front end uses the
     new-style publishable key `sb_publishable_…` declared in `admin.js`, not a
     legacy JWT.
   - If `upload-signed-url` ever uses the key again, copy the new
     `service_role` value into the function secret (below).
3. Confirm the old key is dead:
   `curl -s -o /dev/null -w "%{http_code}\n" https://twkgioiyfjfkppzerdii.supabase.co/rest/v1/ -H "apikey: <old key>" -H "Authorization: Bearer <old key>"`
   should return `401`, not `200`.

Optional but recommended afterwards: purge the key from git history
(`git filter-repo --path supabase/functions/upload-signed-url/index.ts --invert-paths`
or BFG), then force-push. Rotation already makes the key worthless, so this is
about tidiness rather than safety.

## Where secrets live now

| Secret | Where it belongs | Used by |
| --- | --- | --- |
| `GROQ_API_KEY` | Supabase function secret | `groq-proxy`, `learn-more` |
| `TAVILY_API_KEY` | Supabase function secret | `learn-more` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase function secret | `upload-signed-url` |
| `UPLOAD_SIGNING_TOKEN` | Supabase function secret | `upload-signed-url` |
| `RECAPTCHA_SECRET_KEY` | Supabase function secret | `recaptcha-verify` |
| `RECAPTCHA_MIN_SCORE` (optional, default `0.4`) | Supabase function secret | `recaptcha-verify` |

Edge functions read them with `Deno.env.get(...)` and fail loudly (500 with a
clean message, no key or stack trace in the response) when a secret is missing.

```bash
supabase secrets set GROQ_API_KEY=gsk_... TAVILY_API_KEY=tvly-... \
  --project-ref twkgioiyfjfkppzerdii
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... UPLOAD_SIGNING_TOKEN=... \
  --project-ref twkgioiyfjfkppzerdii
supabase secrets set RECAPTCHA_SECRET_KEY=... --project-ref twkgioiyfjfkppzerdii
supabase functions deploy upload-signed-url --project-ref twkgioiyfjfkppzerdii
supabase functions deploy recaptcha-verify --project-ref twkgioiyfjfkppzerdii
```
### reCAPTCHA v3 (`recaptcha-verify`)

`index.html` gates the museum behind an invisible v3 check (`entry_gate`) and
`admin.html` checks a token before Firebase sees the password (`admin_login`).
Both call this one function, which is the only place that sees the secret.

The browser posts JSON to this function, so the call is preceded by a CORS
preflight; `recaptcha-verify` answers `OPTIONS` with `204` plus
`Access-Control-Allow-Headers: Content-Type, Authorization`, which is what lets
the real `POST` through.

When the function is missing (never deployed) the preflight itself returns `404`
without CORS headers, the browser reports an opaque CORS failure, `fetch()`
throws, and the client classifies it as `network`. Behaviour in that case:

- the museum still opens — visitors are never locked out of an offline-first PWA;
- admin sign-in continues to Firebase with a "security check unavailable" note,
  because Firebase still verifies the password;
- a real verdict (`low-score`, `rejected`, `action-mismatch`) always blocks.

So a `git push` or a hosting deploy is not enough: run the two
`recaptcha-verify` commands above (`supabase secrets set RECAPTCHA_SECRET_KEY=…`
and `supabase functions deploy recaptcha-verify`). Until then the browser console
shows `404 NOT_FOUND` for that endpoint and no bot check is enforced.



`upload-signed-url` now also requires an `x-upload-token` header matching
`UPLOAD_SIGNING_TOKEN`, so the endpoint cannot be used as an open signing
service. The copy currently deployed answers `503 BOOT_ERROR` and is not called
by any page in this repo; delete or redeploy it when convenient
(`supabase functions delete upload-signed-url --project-ref twkgioiyfjfkppzerdii`).

## Keys that are safe to ship

These are in the HTML/JS on purpose and are not secrets:

- **Firebase web API key** `AIzaSyAqh…` (`index.html`, `admin.html`,
  `guestbook.html`). It identifies the Firebase project to Google; access is
  controlled by `firebase.rules.json`, not by hiding the key.
- **Supabase publishable key** `sb_publishable_…` (`admin.js`). Supabase's
  replacement for the anonymous JWT. Access is controlled by RLS policies.
- **reCAPTCHA v3 site key** `6LduFx4u…` (`recaptcha.js`). A domain-bound public
  identifier; the matching secret is `RECAPTCHA_SECRET_KEY` above. The key must
  list every hosting domain (`*.web.app`, `*.firebaseapp.com`, localhost) in
  the reCAPTCHA admin console, or `grecaptcha.execute()` rejects the page.

Never ship `service_role`, `sb_secret_…`, a Firebase service-account JSON, or
any third-party API key (Groq, Tavily) — those go in the secret stores above.

## Open hardening item: the `gbr-assets` bucket is writable by the public key

`admin.js` uploads artwork files straight from the browser with the publishable
key and `upsert: true`. For that to work, the bucket's storage policies must
allow anonymous writes, and an anonymous request can already list the bucket
(`POST /storage/v1/object/list/gbr-assets` returns objects). That means anyone
who has the publishable key can overwrite artwork images, marker images and 3D
models.

Recommended fix, in order:

1. Add storage policies so only the service role can `INSERT`/`UPDATE`/`DELETE`
   in `gbr-assets`, keeping public `SELECT` for display.
2. Route admin uploads through the `upload-signed-url` function with
   `UPLOAD_SIGNING_TOKEN` (or a Firebase-ID-token check), instead of uploading
   with the publishable key from the page.

## Admin console account

The single email/password account in Firebase Authentication (249 users total,
the rest are anonymous visitors) is:

- **Email:** `jdconstantino5281@gmail.com`
- **UID:** `UzUYv8RIPoYS2vpMXtAQeBUt09E3` — this is the UID hardcoded in
  `firebase.rules.json`, which is why the account keeps working after the email
  changed.
- **Password:** never stored in the repo. Managed in the console, or from
  **Account → Change Password** inside `admin.html`, or via **Forgot password**
  (now that the account has a real mailbox).

`admin.js` signs in with that address, so changing it again means updating
`ADMIN_EMAIL` there too, or the login fails with "Admin user not found".

## Reporting

Found something else? Do not open a public issue with the value in it — rotate
first, then note it here.
