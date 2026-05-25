/* ------------------------------------------------------------------ */
/*  Analytics — fire-and-forget event logging                          */
/* ------------------------------------------------------------------ */

const WORKER_URL = import.meta.env.VITE_ANALYTICS_WORKER_URL as string | undefined;

// Generate a session ID once per page load
const sessionId = (() => {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
})();

/** Current page path (hash-based router) */
const getPage = (): string => {
  if (typeof window === 'undefined') return '';
  return window.location.hash.replace('#', '') || '/';
};

/** ISO timestamp */
const now = (): string => new Date().toISOString();

/** Supported analytics events */
export type AnalyticsEvent =
  | 'page_view'
  | 'file_upload'
  | 'start_analysis'
  | 'report_view'
  | 'export_md'
  | 'export_pdf'
  | 'config_model';

export interface TrackEventOptions {
  /** Analytics event name */
  event: AnalyticsEvent;
  /** Extra data attached to the event */
  metadata?: Record<string, unknown>;
}

/**
 * Track an analytics event.
 * This is fire-and-forget: it never throws, never blocks UI,
 * and silently fails if the worker is unavailable.
 */
export function trackEvent(event: AnalyticsEvent, metadata?: Record<string, unknown>): void {
  if (!WORKER_URL) return; // silently skip if no worker configured

  const payload = {
    event,
    page: getPage(),
    metadata: metadata ?? {},
    timestamp: now(),
    sessionId,
  };

  // Use sendBeacon for page_view / unload, fetch otherwise
  const url = `${WORKER_URL}/log`;

  if (event === 'page_view' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(url, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    return;
  }

  // Fire-and-forget fetch
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // no-cors so that CORS failures don't surface as errors
      mode: 'cors',
    }).catch(() => {
      /* silently ignore */
    });
  } catch {
    /* silently ignore — e.g. network down */
  }
}

/** Automatically track a page_view once per session */
export function trackPageView(): void {
  trackEvent('page_view');
}

// Auto-track on first import if running in a browser
if (typeof window !== 'undefined') {
  // Defer until after the current JS tick so the router is ready
  setTimeout(() => trackPageView(), 0);
}
