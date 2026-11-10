import "@supabase/functions-js/edge-runtime.d.ts";

export default {
  fetch: async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders() });
    }

    try {
      const body = await req.json();
      const { path, contentType } = body;
      if (!path || !contentType) {
        return new Response(JSON.stringify({ error: "path and contentType required" }), { status: 400, headers: corsHeaders() });
      }

      // Hardcoded for testing - in production use env var
      const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a2dpb2l5Zmpma3BwemVyZGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODc3MTMwNywiZXhwIjoyMTA0MzQ3MzA3fQ.s5LHsFXNuXcfQCgrUaxxgWmrbYgkf0vkrnXF_FUjtf4";
      const SUPABASE_URL = "https://twkgioiyfjfkppzerdii.supabase.co";
      const BUCKET = "gbr-assets";

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
        return new Response(JSON.stringify({ error: "Sign failed: " + err }), { status: 500, headers: corsHeaders() });
      }

      const { signedUrl } = await signedUrlRes.json();
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`;

      return new Response(JSON.stringify({ 
        signedUrl: `${SUPABASE_URL}${signedUrl}`, 
        publicUrl, 
        token: "test" 
      }), { status: 200, headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders() });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}