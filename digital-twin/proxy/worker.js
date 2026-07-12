/**
 * Digital Twin proxy — Cloudflare Worker
 *
 * Static widget → this Worker → Google Gemini Flash.
 * - Gemini API key lives ONLY here (wrangler secret GEMINI_API_KEY).
 * - twin-context.md is bundled at deploy time (text module) and injected
 *   as the model's system instruction; it is never served to clients.
 * - Explicit context caching (cachedContents) so the static context is not
 *   re-billed on every call; graceful fallback to inline system instruction
 *   if caching is unavailable (e.g. context below the model's token minimum).
 * - Per-IP rate limiting + hard output-token cap + CORS locked to the
 *   portfolio origin.
 */

import TWIN_CONTEXT from "../twin-context.md";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/* ---------- Per-isolate state ---------- */
// Rate limiter: ip -> [timestamps]. Per-isolate (resets on isolate recycle);
// good enough as an abuse brake for a portfolio bot. For stronger guarantees
// move to Durable Objects or KV.
const hits = new Map();
// Context cache handle: { name, expiresAt } (epoch ms)
let contextCache = null;

/* ---------- Helpers ---------- */
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function rateLimited(ip, env) {
  const limit = parseInt(env.RATE_LIMIT_PER_MIN || "8", 10);
  const now = Date.now();
  const windowMs = 60_000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  // Opportunistic pruning so the Map cannot grow unbounded
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
    }
  }
  return false;
}

/* ---------- Gemini context caching ---------- */
async function ensureContextCache(env) {
  const now = Date.now();
  if (contextCache && contextCache.expiresAt - now > 60_000) return contextCache.name;

  const ttlSeconds = parseInt(env.CACHE_TTL_SECONDS || "3600", 10);
  const model = env.GEMINI_MODEL || "gemini-3.5-flash";
  try {
    const res = await fetch(`${GEMINI_BASE}/cachedContents?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        displayName: "twin-context",
        systemInstruction: { parts: [{ text: TWIN_CONTEXT }] },
        // cachedContents requires non-empty contents alongside systemInstruction
        contents: [{ role: "user", parts: [{ text: "Context loaded." }] }],
        ttl: `${ttlSeconds}s`,
      }),
    });
    if (!res.ok) return null; // e.g. below min cacheable tokens — fall back inline
    const data = await res.json();
    contextCache = { name: data.name, expiresAt: now + ttlSeconds * 1000 };
    return contextCache.name;
  } catch {
    return null;
  }
}

/* ---------- Gemini call ---------- */
async function callGemini(contents, env, useCache) {
  const model = env.GEMINI_MODEL || "gemini-3.5-flash";
  const maxTokens = parseInt(env.MAX_OUTPUT_TOKENS || "512", 10);

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.6,
      // Flash is a thinking model: without this, reasoning tokens are
      // billed against maxOutputTokens and replies get truncated.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let cacheName = null;
  if (useCache) cacheName = await ensureContextCache(env);
  if (cacheName) {
    body.cachedContent = cacheName;
  } else {
    body.systemInstruction = { parts: [{ text: TWIN_CONTEXT }] };
  }

  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    // Cache may have expired server-side or be invalid: retry once inline
    if (cacheName) {
      contextCache = null;
      return callGemini(contents, env, false);
    }
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return text.trim();
}

/* ---------- Request validation ---------- */
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "model") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-8) // last 8 turns max
    .map((m) => ({
      role: m.role,
      parts: [{ text: m.content.trim().slice(0, 600) }],
    }));
  if (!cleaned.length) return null;
  if (cleaned[cleaned.length - 1].role !== "user") return null;
  // Enforce strict user/model alternation ending in a user turn, walking
  // backwards — drops forged/duplicated assistant history a direct caller
  // could inject to bias the model (CORS is not auth).
  const alternating = [];
  let expected = "user";
  for (let i = cleaned.length - 1; i >= 0; i--) {
    if (cleaned[i].role === expected) {
      alternating.unshift(cleaned[i]);
      expected = expected === "user" ? "model" : "user";
    }
  }
  // Gemini requires the history to start with a user turn
  while (alternating.length && alternating[0].role !== "user") alternating.shift();
  return alternating.length ? alternating : null;
}

/* ---------- Worker entry ---------- */
export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!origin) return json({ error: "Forbidden origin" }, 403, "null");
    if (request.method !== "POST" || new URL(request.url).pathname !== "/chat") {
      return json({ error: "Not found" }, 404, origin);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "Server not configured" }, 500, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    // Native rate-limit binding (reliable across isolates), with the
    // in-memory limiter as defense-in-depth / local-dev fallback
    if (env.RATE_LIMITER) {
      try {
        const { success } = await env.RATE_LIMITER.limit({ key: ip });
        if (!success) {
          return json(
            { error: "Too many messages — please slow down a little." },
            429,
            origin
          );
        }
      } catch (e) { /* fall through to in-memory limiter */ }
    }
    if (rateLimited(ip, env)) {
      return json(
        { error: "Too many messages — please slow down a little." },
        429,
        origin
      );
    }

    // Reject oversized bodies before parsing (8 turns × 600 chars fits
    // comfortably in 16KB)
    const len = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (len > 16384) {
      return json({ error: "Request too large" }, 413, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const contents = sanitizeMessages(payload.messages);
    if (!contents) {
      return json({ error: "messages must end with a user turn" }, 400, origin);
    }

    try {
      const reply = await callGemini(contents, env, true);
      if (!reply) return json({ error: "Empty response" }, 502, origin);
      return json({ reply }, 200, origin);
    } catch (e) {
      console.error(e && e.message);
      return json({ error: "Upstream error — try again shortly." }, 502, origin);
    }
  },
};
