import "@supabase/functions-js/edge-runtime.d.ts";

/* Signed upload URLs for the gbr-assets bucket.
   No credential lives in this file: the service-role key comes from the
   SUPABASE_SERVICE_ROLE_KEY secret (`supabase secrets set ...`). The caller must
   also present UPLOAD_SIGNING_TOKEN, so a public endpoint cannot be used as an
   open signing service for the bucket. */

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "https://twkgioiyfjfkppzerdii.supabase.co")
  .replace(/\/+$/, "");
const SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
const SIGNING_TOKEN = (Deno.env.get("UPLOAD_SIGNING_TOKEN") || "").trim();
const BUCKET = "gbr-assets";

function constantTimeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders() });
    }

    // Missing secrets are a deployment problem, not a caller problem.
    if (!SERVICE_ROLE_KEY || !SIGNING_TOKEN) {
      console.error("[upload-signed-url] SUPABASE_SERVICE_ROLE_KEY / UPLOAD_SIGNING_TOKEN are not set");
      return new Response(JSON.stringify({ error: "Upload signing is not configured" }), { status: 500, headers: corsHeaders() });
    }

    if (!constantTimeEqual((req.headers.get("x-upload-token") || "").trim(), SIGNING_TOKEN)) {
      return new Response(JSON.stringify({ error: "Not authorised" }), { status: 401, headers: corsHeaders() });
    }

    try {
      const body = await req.json();
      const { path, contentType } = body;
      if (!path || !contentType) {
        return new Response(JSON.stringify({ error: "path and contentType required" }), { status: 400, headers: corsHeaders() });
      }

      const fullPath = `${BUCKET}/${path}`;
      const signedUrlRes = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${fullPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ expiresIn: 300 }),
      });

      if (!signedUrlRes.ok) {
        const err = await signedUrlRes.text();
        console.error("[upload-signed-url] Sign failed:", signedUrlRes.status, err);
        return new Response(JSON.stringify({ error: "Sign failed" }), { status: 500, headers: corsHeaders() });
      }

      const { signedUrl } = await signedUrlRes.json();
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`;

      return new Response(JSON.stringify({
        signedUrl: `${SUPABASE_URL}${signedUrl}`,
        publicUrl,
      }), { status: 200, headers: corsHeaders() });
    } catch (e) {
      console.error("[upload-signed-url] Error:", e);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders() });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-upload-token",
    "Content-Type": "application/json",
  };
}
