import { adminSupabase, isAdmin, requestBody, sameOrigin, sendJson } from '../../server/admin.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Sign in to manage the book price' });
  if (req.method === 'GET') {
    try {
      const { data, error } = await adminSupabase().from('book_prices')
        .select('book_id,currency,price_paise,updated_at').eq('book_id', 'tamil').maybeSingle();
      if (error) throw error;
      res.setHeader('Cache-Control', 'no-store');
      return sendJson(res, 200, { price: data });
    } catch {
      return sendJson(res, 503, { error: 'Could not load the book price. Apply the admin dashboard migration first.' });
    }
  }
  if (req.method !== 'PUT') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!sameOrigin(req)) return sendJson(res, 403, { error: 'Invalid request origin' });
  const amount = Number(requestBody(req).priceRupees);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001) {
    return sendJson(res, 400, { error: 'Enter a price from ₹1 to ₹1,00,000 with up to two decimal places.' });
  }
  try {
    const { data, error } = await adminSupabase().from('book_prices').upsert({
      book_id: 'tamil', currency: 'INR', price_paise: Math.round(amount * 100), updated_at: new Date().toISOString()
    }, { onConflict: 'book_id' }).select('book_id,currency,price_paise,updated_at').single();
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, { price: data });
  } catch {
    return sendJson(res, 503, { error: 'Could not update the price. Check the Supabase migration and server key.' });
  }
}
