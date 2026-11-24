import { createHmac, timingSafeEqual } from 'node:crypto';
import { orderDatabase, isValidReference, requestBody, sameOrigin, sendJson } from '../server/razorpay.js';

function signatureMatches(orderId, paymentId, signature) {
  if (typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!sameOrigin(req)) return sendJson(res, 403, { error: 'Invalid request origin' });
  if (!process.env.RAZORPAY_KEY_SECRET) return sendJson(res, 503, { error: 'Payment verification is not configured yet.' });

  const { orderReference, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = requestBody(req);
  if (!isValidReference(orderReference) || ![orderId, paymentId, signature].every(value => typeof value === 'string' && value.length > 0)) {
    return sendJson(res, 400, { error: 'Payment details are incomplete.' });
  }
  if (orderId.length > 100 || paymentId.length > 100 || !signatureMatches(orderId, paymentId, signature)) {
    return sendJson(res, 400, { error: 'Payment verification failed. The order is still unpaid.' });
  }

  try {
    const db = orderDatabase();
    const { data: order, error: findError } = await db.from('book_orders')
      .select('order_reference,status,razorpay_order_id,razorpay_payment_id')
      .eq('order_reference', orderReference).maybeSingle();
    if (findError) throw findError;
    if (!order || order.razorpay_order_id !== orderId) {
      return sendJson(res, 400, { error: 'Payment does not match this order. The order is still unpaid.' });
    }
    if (order.status === 'paid') {
      if (order.razorpay_payment_id !== paymentId) {
        return sendJson(res, 409, { error: 'A different payment is already recorded for this order.' });
      }
    } else {
      const { data: updated, error: updateError } = await db.from('book_orders')
        .update({ status: 'paid', razorpay_payment_id: paymentId })
        .eq('order_reference', orderReference).eq('razorpay_order_id', orderId)
        .eq('status', 'pending_payment').select('order_reference').maybeSingle();
      if (updateError) throw updateError;
      if (!updated) return sendJson(res, 409, { error: 'Order status changed. Contact the shop before retrying.' });
    }
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, { verified: true, orderReference });
  } catch {
    return sendJson(res, 503, { error: 'Payment was received, but order confirmation could not be saved. Contact the shop with your order reference.' });
  }
}
