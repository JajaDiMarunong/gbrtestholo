import "@supabase/functions-js/edge-runtime.d.ts";

const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const cors = corsHeaders();
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: corsHeaders() });
    }
    const idToken = authHeader.slice(7);

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/firebase-admin", "");
    const method = req.method;

    try {
      // POST /artworks - Create new artwork
      if (method === "POST" && path === "/artworks") {
        const body = await req.json();
        // Inline validation
        const required = ["name", "details", "imageUrl", "markerImageUrl"];
        for (const field of required) {
          if (!body[field] || typeof body[field] !== "string") {
            return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), { status: 400, headers: cors });
          }
        }
        const artworkId = `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const sanitized = {
          name: body.name.slice(0, 100),
          details: body.details.slice(0, 5000),
          imageUrl: body.imageUrl.slice(0, 500),
          markerImageUrl: body.markerImageUrl.slice(0, 500),
          artist: body.artist ? body.artist.slice(0, 100) : null,
          year: body.year ? body.year.slice(0, 20) : null,
          location: body.location ? body.location.slice(0, 100) : null,
          modelUrl: body.modelUrl ? body.modelUrl.slice(0, 500) : null,
          immersiveSkyboxUrl: body.immersiveSkyboxUrl ? body.immersiveSkyboxUrl.slice(0, 500) : null,
          baseScale: Number(body.baseScale) || 0.5,
          modelPositionZ: Number(body.modelPositionZ) || 0.1,
          immersiveScale: Number(body.immersiveScale) || 1,
          immersiveRotation: body.immersiveRotation || "0 0 0",
          immersiveForward: Number(body.immersiveForward) || -3,
          icon: body.icon || "🖼️",
          showInMainCollection: body.showInMainCollection !== false,
          scannable: body.scannable !== false,
          published: body.published !== false,
          quiz: Array.isArray(body.quiz) ? body.quiz.slice(0, 10) : [],
          createdAt: Date.now(),
        };
        
        const response = await fetch(`${FIREBASE_URL}/artworks/${artworkId}.json?auth=${idToken}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitized),
        });
        
        if (!response.ok) {
          throw new Error(`Firebase write failed: ${response.status}`);
        }
        
        return new Response(JSON.stringify({ id: artworkId, ...sanitized }), { status: 201, headers: cors });
      }

      // PATCH /artworks/:id - Update artwork settings
      if (method === "PATCH" && path.startsWith("/artworks/")) {
        const artworkId = path.split("/")[2];
        const body = await req.json();
        const allowedFields = ["baseScale", "modelPositionZ", "immersiveScale", "immersiveRotation", "immersiveForward", "showInMainCollection", "scannable", "published", "name", "details", "artist", "year", "location", "icon"];
        const updates: any = {};
        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            if (typeof body[field] === "number") {
              if (field.includes("Scale") && (body[field] <= 0 || body[field] > (field === "baseScale" ? 10 : 100))) continue;
              updates[field] = body[field];
            } else if (typeof body[field] === "string") {
              updates[field] = body[field].slice(0, field === "details" ? 5000 : 100);
            } else if (typeof body[field] === "boolean") {
              updates[field] = body[field];
            }
          }
        }
        if (Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ error: "No valid fields to update" }), { status: 400, headers: cors });
        }
        
        const response = await fetch(`${FIREBASE_URL}/artworks/${artworkId}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        
        if (!response.ok) {
          throw new Error(`Firebase update failed: ${response.status}`);
        }
        
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
      }

      // PUT /arBundleCurrent - Publish AR bundle manifest
      if (method === "PUT" && path === "/arBundleCurrent") {
        const body = await req.json();
        const required = ["version", "mindUrl", "targets"];
        for (const field of required) {
          if (!body[field]) {
            return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), { status: 400, headers: cors });
          }
        }
        const manifest = {
          version: body.version.slice(0, 50),
          createdAt: Date.now(),
          mindUrl: body.mindUrl.slice(0, 500),
          targets: Array.isArray(body.targets) ? body.targets.slice(0, 50).map((t: any) => ({ targetIndex: Number(t.targetIndex), artworkId: String(t.artworkId).slice(0, 50) })) : [],
        };
        
        const response = await fetch(`${FIREBASE_URL}/arBundleCurrent.json?auth=${idToken}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manifest),
        });
        
        if (!response.ok) {
          throw new Error(`Firebase write failed: ${response.status}`);
        }
        
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
      }

      // DELETE /leaderboard - Clear all leaderboard entries
      if (method === "DELETE" && path === "/leaderboard") {
        const response = await fetch(`${FIREBASE_URL}/leaderboard.json?auth=${idToken}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Firebase delete failed: ${response.status}`);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
      }

      // DELETE /notes - Clear all notes
      if (method === "DELETE" && path === "/notes") {
        const response = await fetch(`${FIREBASE_URL}/notes.json?auth=${idToken}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Firebase delete failed: ${response.status}`);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
      }

      // DELETE /artworks/:id - Delete specific artwork
      if (method === "DELETE" && path.startsWith("/artworks/")) {
        const artworkId = path.split("/")[2];
        const response = await fetch(`${FIREBASE_URL}/artworks/${artworkId}.json?auth=${idToken}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Firebase delete failed: ${response.status}`);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: cors });
    } catch (err) {
      console.error("[firebase-admin] Error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}