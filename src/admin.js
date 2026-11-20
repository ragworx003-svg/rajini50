import './admin.css';

const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const priceForm = document.querySelector('#price-form');
const priceInput = document.querySelector('#price-rupees');
const priceMessage = document.querySelector('#price-message');
const ordersBody = document.querySelector('#orders-body');
const ordersMessage = document.querySelector('#orders-message');
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

function displayTime(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.error || 'Request failed'), { status: response.status });
  return result;
}

function showLogin(message = '') {
  loginPanel.hidden = false;
  dashboard.hidden = true;
  loginMessage.textContent = message;
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
}

async function loadOrders() {
  ordersMessage.textContent = 'Loading orders…';
  try {
    const { orders, total } = await request('/api/admin/orders');
    ordersMessage.textContent = total ? `${total.toLocaleString()} order${total === 1 ? '' : 's'} · showing ${orders.length} most recent` : 'No orders yet.';
    document.querySelector('#metric-orders').textContent = total.toLocaleString();
    ordersBody.replaceChildren();
    for (const order of orders) {
      const row = document.createElement('tr');
      const address = [order.shipping_address, order.shipping_address2, `${order.city}, ${order.state} ${order.postal_code}`, order.country].filter(Boolean).join('\n');
      const amount = order.total_price_paise == null ? '—' : currency.format(order.total_price_paise / 100);
      const values = [
        `${order.order_reference}\n${order.edition}`,
        `${order.customer_name}\n${order.email}\n${order.phone}`,
        address,
        String(order.quantity),
        amount,
        order.status,
        new Date(order.created_at).toLocaleString()
      ];
      for (const [index, value] of values.entries()) {
        const cell = document.createElement('td');
        if (index === 5) {
          const badge = document.createElement('span');
          badge.className = 'admin-status';
          badge.textContent = value.replaceAll('_', ' ');
          cell.append(badge);
        } else {
          cell.textContent = value;
          cell.style.whiteSpace = index < 3 ? 'pre-line' : 'normal';
        }
        row.append(cell);
      }
      ordersBody.append(row);
    }
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    ordersMessage.textContent = error.message;
  }
}

async function loadDashboard() {
  try {
    const metrics = await request('/api/admin/analytics');
    document.querySelector('#metric-visitors').textContent = metrics.uniqueVisitors.toLocaleString();
    document.querySelector('#metric-sessions').textContent = metrics.sessions.toLocaleString();
    document.querySelector('#metric-average').textContent = displayTime(metrics.averageSessionSeconds);
    document.querySelector('#metric-total').textContent = displayTime(metrics.totalActiveSeconds);
    const { price } = await request('/api/admin/price');
    priceInput.value = price?.price_paise == null ? '' : (price.price_paise / 100).toFixed(2);
    await loadOrders();
  } catch (error) {
    if (error.status === 401) return showLogin();
    showDashboard();
    ordersMessage.textContent = error.message;
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  loginMessage.textContent = 'Signing in…';
  try {
    const pin = new FormData(loginForm).get('pin');
    await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ pin }) });
    loginForm.reset();
    showDashboard();
    await loadDashboard();
  } catch (error) {
    loginMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

priceForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = priceForm.querySelector('button[type="submit"]');
  button.disabled = true;
  priceMessage.textContent = 'Saving price…';
  try {
    const result = await request('/api/admin/price', { method: 'PUT', body: JSON.stringify({ priceRupees: priceInput.value }) });
    priceInput.value = (result.price.price_paise / 100).toFixed(2);
    priceMessage.textContent = 'Tamil book price updated.';
  } catch (error) {
    priceMessage.textContent = error.message;
    if (error.status === 401) showLogin('Your admin session expired. Sign in again.');
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#refresh-button').addEventListener('click', loadDashboard);
document.querySelector('#logout-button').addEventListener('click', async () => {
  await request('/api/admin/logout', { method: 'POST', body: '{}' }).catch(() => {});
  showLogin('You have signed out.');
});

loadDashboard();
