# Store admin setup

The dashboard is at `/admin`. Customer account login is not part of this site, so analytics show unique browsers, visits and visible-page time instead of logged-in accounts. Metrics start accumulating after the analytics migration is applied and this version is deployed.

## 1. Apply the Supabase migration

Run `supabase/migrations/20261120000002_admin_dashboard.sql` in the Supabase SQL Editor. It adds the Tamil price row, immutable order price snapshots, visitor-time records and insert/read policies. It does not grant public access to orders or price updates.

## 2. Set environment variables

Set these in Vercel → Project → Settings → Environment Variables, for Production and Preview as needed:

- `VITE_SUPABASE_URL`: the project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the publishable key used by the storefront
- `SUPABASE_URL`: the same project URL, server-side
- `SUPABASE_SECRET_KEY`: the Supabase secret key, server-side only. Older projects may use a `service_role` key; place that value in this variable.
- `ADMIN_PIN`: a private PIN with at least 8 characters
- `ADMIN_SESSION_SECRET`: a random secret with at least 32 characters

Never add `SUPABASE_SECRET_KEY`, `ADMIN_PIN` or `ADMIN_SESSION_SECRET` to a `VITE_` variable or commit them to Git. The PIN is checked by a Vercel Function and never included in the page JavaScript.

For local configuration, keep the existing browser variables in the ignored `.env` file and add the server-only values there. Do not overwrite that file with the example. Vercel Functions can be run locally with `vercel dev` after the Vercel CLI is installed and linked to the project.

## 3. Configure Razorpay checkout

Set these server-side environment variables in Vercel → Project → Settings → Environment Variables:

- `RAZORPAY_KEY_ID`: Razorpay Key ID (the current local credentials are test-mode)
- `RAZORPAY_KEY_SECRET`: Razorpay Key Secret; server-side only
- `SUPABASE_URL`: the project URL
- `SUPABASE_SECRET_KEY`: the Supabase secret key (or the existing `SUPABASE_SERVICE_ROLE_KEY` variable)

Apply `supabase/migrations/20261123000000_razorpay_checkout.sql` in the Supabase SQL Editor after the two existing migrations. This adds Razorpay order/payment references to existing orders; no new table is created.

The frontend creates its Razorpay order from the price snapshot stored with the Tamil order. After checkout, the server checks the HMAC signature and the Razorpay order ID before changing the order status to `paid`. The secret key is never sent to browser code. Configure matching test keys in local `.env` to use `vercel dev`; for production, replace the test credentials with live credentials in Vercel and redeploy.

## 4. Redeploy and set the Tamil price

Redeploy after adding variables. Open `/admin`, sign in with `ADMIN_PIN`, and set the Tamil edition price in rupees. Customers can then submit Tamil delivery details and pay through Razorpay Standard Checkout. Verified payments change the Supabase order status to `paid`, which is visible in the dashboard.

The page records a random browser ID and active visible seconds, without collecting IP addresses. New order and metric records are available in the Supabase dashboard.
