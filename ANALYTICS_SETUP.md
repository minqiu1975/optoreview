# OptoReview Analytics Setup Guide

This guide covers the deployment of the Cloudflare Worker for collecting and querying OptoReview access logs.

## Architecture Overview

```
[OptoReview SPA] --POST /log--> [Cloudflare Worker] --PUT--> [Cloudflare KV]
                                      ^
[Admin Panel] ---GET /query?key=xxx-|       |---GET /stats?key=xxx
```

## Files Created/Modified

### New Files
- `src/utils/analytics.ts` — Frontend analytics module (fire-and-forget tracking)
- `src/sections/AdminPanel.tsx` — Password-protected admin dashboard
- `src/vite-env.d.ts` — TypeScript declarations for analytics env vars
- `workers/analytics-worker.js` — Cloudflare Worker for log collection & querying
- `ANALYTICS_SETUP.md` — This document

### Modified Files
- `src/App.tsx` — Added `/admin` route
- `src/sections/AppSection.tsx` — Added trackEvent calls at key user actions

## Environment Variables

Add these to your `.env` file or build environment:

```env
# Cloudflare Worker URL (required for tracking to work)
# Get this after deploying the Worker (see steps below)
VITE_ANALYTICS_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# Admin panel password (defaults to "optoreview2025" if not set)
VITE_ADMIN_PASSWORD=your-secure-password

# API key for querying logs from admin panel (must match Worker env var)
VITE_ANALYTICS_API_KEY=your-secret-api-key
```

## Step 1: Deploy the Cloudflare Worker

### Option A: Cloudflare Dashboard (Web UI)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > Workers & Pages
2. Click "Create" > "Create Worker"
3. Give your worker a name (e.g., `optoreview-analytics`)
4. Replace the default code with the contents of `workers/analytics-worker.js`
5. Click "Deploy"

### Option B: Wrangler CLI

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "ANALYTICS_KV"
# Note the namespace ID from the output

# Create wrangler.toml for the analytics worker
cat > workers/wrangler.toml << 'EOF'
name = "optoreview-analytics"
main = "analytics-worker.js"
compatibility_date = "2025-01-01"

[env.production.vars]
API_KEY = "your-secret-api-key-here"

[[env.production.kv_namespaces]]
binding = "ANALYTICS_KV"
id = "your-kv-namespace-id-here"
EOF

# Deploy
cd workers
wrangler deploy
```

## Step 2: Configure Environment Variables

### Worker Environment Variables (Cloudflare Dashboard)

1. Go to Worker > Settings > Variables and Secrets
2. Add the following:
   - `API_KEY`: A secret key for authenticating admin queries (e.g., a random 32-char string)
   - `ALLOWED_ORIGINS` (optional): Comma-separated list of allowed CORS origins
3. Save and redeploy

### KV Namespace Binding

1. Go to Worker > Settings > Bindings
2. Add KV Namespace binding:
   - Variable name: `ANALYTICS_KV`
   - Select your KV namespace
3. Save and redeploy

## Step 3: Configure Frontend Environment

1. Copy the Worker URL from the Cloudflare dashboard (e.g., `https://optoreview-analytics.your-subdomain.workers.dev`)
2. Add to your frontend `.env` file:
   ```env
   VITE_ANALYTICS_WORKER_URL=https://optoreview-analytics.your-subdomain.workers.dev
   VITE_ANALYTICS_API_KEY=your-secret-api-key-here
   VITE_ADMIN_PASSWORD=your-admin-password-here
   ```
3. Rebuild and deploy your frontend

## Worker API Reference

### POST /log
Receive a log event from the frontend.

**CORS**: Enabled for OptoReview domains and localhost.

**Request Body:**
```json
{
  "event": "page_view",
  "page": "/",
  "metadata": {},
  "timestamp": "2025-01-15T10:30:00.000Z",
  "sessionId": "a1b2c3d4..."
}
```

**Server-enriched fields** (added by Worker from request headers):
- `ip` — Client IP (CF-Connecting-IP)
- `country` — Country code (CF-IPCountry)
- `city` — City (CF geo)
- `region` — Region (CF geo)
- `userAgent` — User-Agent header
- `acceptLang` — Accept-Language header

### GET /query
Query stored logs (admin only).

**Parameters:**
- `key` (required) — API key
- `limit` (optional) — Max results, default 100, max 1000
- `event` (optional) — Filter by event type

**Response:**
```json
{
  "logs": [...],
  "count": 50
}
```

### GET /stats
Get summary statistics (admin only).

**Parameters:**
- `key` (required) — API key

**Response:**
```json
{
  "total": 1250,
  "uniqueSessions": 340,
  "eventBreakdown": {
    "page_view": 500,
    "file_upload": 200,
    "start_analysis": 180,
    "report_view": 220,
    "export_md": 80,
    "export_pdf": 70
  },
  "dailyBreakdown": {
    "2025-01-14": 120,
    "2025-01-15": 130
  },
  "countryBreakdown": {
    "CN": 600,
    "US": 200,
    ...
  }
}
```

## Tracked Events

| Event | Trigger | Metadata |
|-------|---------|----------|
| `page_view` | Page load (auto) | — |
| `file_upload` | Files uploaded | `filenames`, `count` |
| `start_analysis` | Click "Start Analysis" | `model`, `provider`, `fileCount` |
| `report_view` | Switch report tab | `reportType` (`eval`/`critique`/`improve`) |
| `export_md` | Click "Export Markdown" | `filename` |
| `export_pdf` | Click "Export PDF" | `filename` |
| `config_model` | Configure/change AI model | `provider`, `model` |

## Admin Panel Access

1. Visit: `https://your-site.com/#/admin`
2. Enter the admin password (set via `VITE_ADMIN_PASSWORD`)
3. Login state persists for the browser session (sessionStorage)

## Security Considerations

- The admin password is embedded in the frontend bundle — use a unique, non-sensitive password
- The API key should be kept secret and rotated periodically
- All admin endpoints (`/query`, `/stats`) require the API key
- The `/log` endpoint is open for CORS but only accepts POST requests
- Consider adding rate limiting to the Worker for production use
- KV storage has eventual consistency — logs may take a few seconds to appear

## Troubleshooting

### No logs appearing in admin panel
- Check browser DevTools Network tab for failed requests to the Worker
- Verify `VITE_ANALYTICS_WORKER_URL` is set correctly
- Check Worker logs in Cloudflare Dashboard
- Ensure CORS origin is allowed

### Admin panel shows "Unauthorized"
- Verify `VITE_ANALYTICS_API_KEY` matches the Worker's `API_KEY` env var
- Check that the Worker was redeployed after setting env vars

### KV quota limits
- Cloudflare KV free tier: 100,000 reads/day, 1,000 writes/day, 1,000 deletes/day, 1GB storage
- For high traffic, consider upgrading or adding log rotation (delete old keys)
