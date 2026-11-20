import { isSupabaseConfigured, supabasePublicKey, supabaseUrl } from './supabase-client.js';

if (isSupabaseConfigured && typeof window !== 'undefined') {
  const storageKey = 'r50_visitor_id';
  const sessionKey = 'r50_session_id';
  let visitorId;
  let sessionId;

  try {
    visitorId = localStorage.getItem(storageKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(storageKey, visitorId);
    }
    sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, sessionId);
    }
  } catch {
    // Private-browsing restrictions should never prevent the book from loading.
  }

  if (visitorId && sessionId) {
    let active = !document.hidden;
    let lastTick = performance.now();
    let unrecordedMs = 0;

    function record(seconds) {
      if (!seconds || !navigator.onLine) return;
      const row = { visitor_id: visitorId, session_id: sessionId, active_seconds: seconds };
      fetch(`${supabaseUrl}/rest/v1/site_session_events`, {
        method: 'POST',
        headers: {
          apikey: supabasePublicKey,
          Authorization: `Bearer ${supabasePublicKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(row),
        keepalive: true
      }).catch(() => {});
    }

    function flush() {
      const now = performance.now();
      if (active) unrecordedMs += now - lastTick;
      lastTick = now;
      const seconds = Math.min(60, Math.floor(unrecordedMs / 1000));
      if (seconds > 0) {
        unrecordedMs -= seconds * 1000;
        record(seconds);
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        flush();
        active = false;
      } else {
        active = true;
        lastTick = performance.now();
      }
    });
    window.addEventListener('pagehide', flush);
    window.setInterval(flush, 60000);
  }
}
