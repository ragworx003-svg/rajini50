import { isSupabaseConfigured, supabase } from './supabase-client.js';

function makeOrderReference() {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `R50-${value}`;
}

async function saveTamilOrder(details) {
  if (!isSupabaseConfigured || !supabase) return { status: 'not_configured' };

  const { data: price, error: priceError } = await supabase.from('book_prices')
    .select('price_paise,currency').eq('book_id', 'tamil').maybeSingle();
  if (priceError) return { status: 'error' };
  if (!price || price.price_paise == null) return { status: 'price_not_set' };

  const reference = details.orderReference || makeOrderReference();
  const unitPricePaise = Number(price.price_paise);
  const totalPricePaise = unitPricePaise * Number(details.quantity);
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
    unit_price_paise: unitPricePaise,
    total_price_paise: totalPricePaise,
    status: 'pending_payment'
  });

  if (error) return { status: 'error' };
  return { status: 'saved', reference, unitPricePaise, totalPricePaise, currency: price.currency || 'INR' };
}

async function getTamilBookPrice() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('book_prices')
    .select('price_paise,currency').eq('book_id', 'tamil').maybeSingle();
  if (error) throw error;
  return data && data.price_paise != null
    ? { pricePaise: Number(data.price_paise), currency: data.currency || 'INR' }
    : null;
}

// The storefront UI calls these browser-safe operations; all admin access stays server-side.
window.bookOrderSubmit = saveTamilOrder;
window.bookOrderSubmit.isConfigured = isSupabaseConfigured;
window.bookGetPrice = getTamilBookPrice;
