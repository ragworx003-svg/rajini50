import { expiredAdminCookie, sendJson } from '../../server/admin.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  res.setHeader('Set-Cookie', expiredAdminCookie());
  res.setHeader('Cache-Control', 'no-store');
  return sendJson(res, 200, { authenticated: false });
}
