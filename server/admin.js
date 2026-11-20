import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const COOKIE_NAME = 'r50_admin';
const SESSION_SECONDS = 8 * 60 * 60;

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').json(body);
}

export function requestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

export function adminConfigured() {
  return Boolean((process.env.ADMIN_PIN || '').length >= 8 && (process.env.ADMIN_SESSION_SECRET || '').length >= 32);
}

function signingSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

function cookieValue(req) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : '';
}

export function createAdminCookie() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  const signature = createHmac('sha256', signingSecret()).update(payload).digest('base64url');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(`${payload}.${signature}`)}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function expiredAdminCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0${secure}`;
}

export function isAdmin(req) {
  const [payload, signature] = cookieValue(req).split('.');
  if (!payload || !signature || !signingSecret()) return false;
  const expected = createHmac('sha256', signingSecret()).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Number.isFinite(session.exp) && session.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

export function pinMatches(pin) {
  const expected = process.env.ADMIN_PIN || '';
  if (!expected || typeof pin !== 'string') return false;
  const actualHash = createHash('sha256').update(pin).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error('Admin data is not configured');
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
