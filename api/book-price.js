import { createClient } from '@supabase/supabase-js';
import { sendJson } from '../server/admin.js';

export default async function handler(_req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return sendJson(res, 503, { error: 'Book price is not configured' });
  try {
    const { data, error } = await createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      .from('book_prices').select('price_paise,currency').eq('book_id', 'tamil').maybeSingle();
    if (error) throw error;
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return sendJson(res, 200, { price: data });
  } catch {
    return sendJson(res, 503, { error: 'Book price is not available' });
  }
}
