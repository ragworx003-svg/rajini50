import { adminConfigured, createAdminCookie, pinMatches, requestBody, sendJson } from '../../server/admin.js';

const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
function clientKey(req) { return (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim(); }

export default function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!adminConfigured()) return sendJson(res, 503, { error: 'Admin login is not configured' });
  const key = clientKey(req);
  const now = Date.now();
  for (const [id, attempt] of failures) if (attempt.expiresAt <= now) failures.delete(id);
  const attempts = failures.get(key);
  if (attempts && attempts.count >= MAX_FAILURES && attempts.expiresAt > now) return sendJson(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
  const { pin } = requestBody(req);
  if (!pinMatches(pin)) {
    failures.set(key, { count: (attempts?.count || 0) + 1, expiresAt: now + WINDOW_MS });
    return sendJson(res, 401, { error: 'Incorrect PIN' });
  }
  failures.delete(key);
  res.setHeader('Set-Cookie', createAdminCookie());
  res.setHeader('Cache-Control', 'no-store');
  return sendJson(res, 200, { authenticated: true });
}
