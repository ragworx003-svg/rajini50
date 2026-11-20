import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const supabase = supabaseUrl && supabasePublicKey
  ? createClient(supabaseUrl, supabasePublicKey)
  : null;

function makeOrderReference() {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `R50-${value}`;
}

async function saveTamilOrder(details) {
  if (!supabase) return { status: 'not_configured' };

  const reference = details.orderReference || makeOrderReference();
  const { error } = await supabase.from('book_orders').insert({
    order_reference: reference,
    edition: 'tamil',
    customer_name: details.name,
    email: details.email,
    phone: details.phone,
    shipping_address: details.address,
    shipping_address2: details.address2 || null,
    city: details.city,
    state: details.state,
    postal_code: details.postalCode,
    country: details.country,
    quantity: Number(details.quantity),
    delivery_notes: details.notes || null,
    status: 'pending_payment'
  });

  if (error) return { status: 'error' };
  return { status: 'saved', reference };
}

// The existing UI calls this after the customer reviews their details.
window.bookOrderSubmit = saveTamilOrder;
window.bookOrderSubmit.isConfigured = Boolean(supabase);
