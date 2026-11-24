import { orderDatabase, isValidReference, razorpayClient, razorpayConfigured, requestBody, sameOrigin, sendJson } from '../server/razorpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!sameOrigin(req)) return sendJson(res, 403, { error: 'Invalid request origin' });
  if (!razorpayConfigured()) return sendJson(res, 503, { error: 'Online payment is not configured yet.' });

  const { orderReference } = requestBody(req);
  if (!isValidReference(orderReference)) return sendJson(res, 400, { error: 'A valid Tamil book order reference is required.' });

  try {
    const db = orderDatabase();
    const { data: order, error: findError } = await db.from('book_orders')
      .select('order_reference,edition,quantity,total_price_paise,status,razorpay_order_id')
      .eq('order_reference', orderReference).maybeSingle();
    if (findError) throw findError;
    if (!order || order.edition !== 'tamil') return sendJson(res, 404, { error: 'Order not found. Please submit your details again.' });
    if (order.status === 'paid') return sendJson(res, 409, { error: 'This order has already been paid.' });
    const amount = Number(order.total_price_paise);
    if (!Number.isSafeInteger(amount) || amount < 100) {
      return sendJson(res, 400, { error: 'The Tamil book price must be at least ₹1.00 before checkout.' });
    }

    let razorpayOrderId = order.razorpay_order_id;
    if (!razorpayOrderId) {
      const created = await razorpayClient().orders.create({
        amount,
        currency: 'INR',
        receipt: orderReference
      });
      razorpayOrderId = created.id;
      const { error: updateError } = await db.from('book_orders')
        .update({ razorpay_order_id: razorpayOrderId })
        .eq('order_reference', orderReference).eq('status', 'pending_payment');
      if (updateError) throw updateError;
    }
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, {
      order_id: razorpayOrderId,
      amount,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    if (Number(error?.statusCode) === 401) return sendJson(res, 401, { error: 'Razorpay rejected the configured API credentials.' });
    return sendJson(res, 500, { error: 'Could not start checkout. Please try again.' });
  }
}
