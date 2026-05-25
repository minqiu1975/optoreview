/**
 * Cloudflare Worker — OptoReview Analytics
 *
 * Routes:
 *   POST /log   — receive a log event (CORS-enabled)
 *   GET  /query — query logs (protected by API_KEY)
 *   GET  /stats — summary stats (protected by API_KEY)
 *
 * Environment variables:
 *   API_KEY       — secret key for /query and /stats
 *   ANALYTICS_KV  — bound KV namespace
 *
 * Optional: ALLOWED_ORIGINS — comma-separated list of allowed origins
 *   (defaults to allowing all optoreview domains)
 */

/* ------------------------------------------------------------------ */
/*  CORS helpers                                                        */
/* ------------------------------------------------------------------ */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://f56vsuna3onka.ok.kimi.link',
  'https://optoreview.pages.dev',
  'https://optoreview.ok.kimi.link',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : DEFAULT_ALLOWED_ORIGINS;

  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Validation                                                          */
/* ------------------------------------------------------------------ */

function validateApiKey(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  return key && key === env.API_KEY;
}

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                     */
/* ------------------------------------------------------------------ */

async function storeLog(env, entry) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const id = crypto.randomUUID();
  const key = `log:${date}:${id}`;

  const value = JSON.stringify(entry);
  await env.ANALYTICS_KV.put(key, value);
  return key;
}

async function listLogs(env, limit, eventFilter) {
  // List all keys with prefix "log:"
  const { keys } = await env.ANALYTICS_KV.list({ prefix: 'log:' });

  // Sort by creation time (newest first) — keys include date, so reverse chronological
  const sortedKeys = keys.sort((a, b) => b.name.localeCompare(a.name));

  const results = [];
  for (const k of sortedKeys.slice(0, limit)) {
    try {
      const value = await env.ANALYTICS_KV.get(k.name);
      if (!value) continue;
      const entry = JSON.parse(value);
      if (eventFilter && entry.event !== eventFilter) continue;
      results.push({ ...entry, key: k.name });
    } catch {
      // skip corrupt entries
    }
  }
  return results;
}

async function getStats(env) {
  const { keys } = await env.ANALYTICS_KV.list({ prefix: 'log:' });

  let total = 0;
  const eventCounts = {};
  const dailyCounts = {};
  const countryCounts = {};
  const uniqueSessions = new Set();

  // Process in batches to avoid timeouts
  const BATCH_SIZE = 500;
  for (let i = 0; i < Math.min(keys.length, 5000); i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    const values = await Promise.all(
      batch.map(async (k) => {
        try {
          const v = await env.ANALYTICS_KV.get(k.name);
          return v ? JSON.parse(v) : null;
        } catch {
          return null;
        }
      })
    );

    for (const entry of values) {
      if (!entry) continue;
      total++;

      eventCounts[entry.event] = (eventCounts[entry.event] || 0) + 1;

      const day = k.name.split(':')[1] || 'unknown';
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;

      if (entry.country) {
        countryCounts[entry.country] = (countryCounts[entry.country] || 0) + 1;
      }
      if (entry.sessionId) {
        uniqueSessions.add(entry.sessionId);
      }
    }
  }

  return {
    total,
    uniqueSessions: uniqueSessions.size,
    eventBreakdown: eventCounts,
    dailyBreakdown: dailyCounts,
    countryBreakdown: countryCounts,
  };
}

/* ------------------------------------------------------------------ */
/*  Request handlers                                                    */
/* ------------------------------------------------------------------ */

async function handleLog(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, corsHeaders);
  }

  const { event, page, metadata, timestamp, sessionId } = body;

  if (!event || !timestamp) {
    return jsonResponse({ error: 'Missing required fields: event, timestamp' }, 400, corsHeaders);
  }

  // Extract request metadata from Cloudflare headers
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For') ||
             'unknown';
  const country = request.cf?.country || request.headers.get('CF-IPCountry') || '';
  const city = request.cf?.city || '';
  const region = request.cf?.region || '';
  const userAgent = request.headers.get('User-Agent') || '';
  const acceptLang = request.headers.get('Accept-Language') || '';

  const entry = {
    event,
    page: page || '',
    metadata: metadata || {},
    timestamp,
    sessionId: sessionId || '',
    ip,
    country,
    city,
    region,
    userAgent,
    acceptLang,
    createdAt: new Date().toISOString(),
  };

  await storeLog(env, entry);

  return jsonResponse({ success: true }, 200, corsHeaders);
}

async function handleQuery(request, env, corsHeaders) {
  if (!validateApiKey(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 1000);
  const eventFilter = url.searchParams.get('event') || '';

  const logs = await listLogs(env, limit, eventFilter);

  return jsonResponse({ logs, count: logs.length }, 200, corsHeaders);
}

async function handleStats(request, env, corsHeaders) {
  if (!validateApiKey(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
  }

  const stats = await getStats(env);
  return jsonResponse(stats, 200, corsHeaders);
}

/* ------------------------------------------------------------------ */
/*  Main entrypoint                                                     */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      if (url.pathname === '/log' && request.method === 'POST') {
        return await handleLog(request, env, corsHeaders);
      }

      if (url.pathname === '/query' && request.method === 'GET') {
        return await handleQuery(request, env, corsHeaders);
      }

      if (url.pathname === '/stats' && request.method === 'GET') {
        return await handleStats(request, env, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    } catch (err) {
      return jsonResponse({ error: 'Internal error', message: err.message }, 500, corsHeaders);
    }
  },
};
