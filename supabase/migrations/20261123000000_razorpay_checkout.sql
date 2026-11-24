-- Razorpay payment references for Tamil book checkout.
-- Apply after the book_orders and admin_dashboard migrations.
alter table public.book_orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text;

create unique index if not exists book_orders_razorpay_order_id_uidx
  on public.book_orders (razorpay_order_id)
  where razorpay_order_id is not null;
create unique index if not exists book_orders_razorpay_payment_id_uidx
  on public.book_orders (razorpay_payment_id)
  where razorpay_payment_id is not null;
