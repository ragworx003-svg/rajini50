import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').json(body);
}

export function requestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayClient() {
  if (!razorpayConfigured()) throw new Error('Razorpay is not configured');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

export function orderDatabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Order database is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isValidReference(value) {
  return typeof value === 'string' && /^R50-[a-zA-Z0-9-]{10,48}$/.test(value);
}
