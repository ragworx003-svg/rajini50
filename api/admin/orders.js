import { adminSupabase, isAdmin, sendJson } from '../../server/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Sign in to view orders' });
  try {
    const { data, error, count } = await adminSupabase().from('book_orders')
      .select('order_reference,edition,customer_name,email,phone,shipping_address,shipping_address2,city,state,postal_code,country,quantity,unit_price_paise,total_price_paise,status,created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, { orders: data || [], total: count ?? (data || []).length });
  } catch {
    return sendJson(res, 503, { error: 'Could not load orders. Check the admin Supabase configuration.' });
  }
}
