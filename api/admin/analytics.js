import { adminSupabase, isAdmin, sendJson } from '../../server/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!isAdmin(req)) return sendJson(res, 401, { error: 'Sign in to view analytics' });
  try {
    const supabase = adminSupabase();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const visitors = new Set();
    const sessions = new Map();
    let totalActiveSeconds = 0;
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;
    while (hasMore && offset < 100000) {
      const { data, error } = await supabase.from('site_session_events')
        .select('visitor_id,session_id,active_seconds')
        .gte('created_at', since).range(offset, offset + pageSize - 1);
      if (error) throw error;
      for (const row of data || []) {
        visitors.add(row.visitor_id);
        sessions.set(row.session_id, (sessions.get(row.session_id) || 0) + Number(row.active_seconds || 0));
        totalActiveSeconds += Number(row.active_seconds || 0);
      }
      hasMore = data?.length === pageSize;
      offset += pageSize;
    }
    const sessionCount = sessions.size;
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, {
      periodDays: 30,
      uniqueVisitors: visitors.size,
      sessions: sessionCount,
      totalActiveSeconds,
      averageSessionSeconds: sessionCount ? Math.round(totalActiveSeconds / sessionCount) : 0
    });
  } catch {
    return sendJson(res, 503, { error: 'Could not load analytics. Apply the admin dashboard migration first.' });
  }
}
