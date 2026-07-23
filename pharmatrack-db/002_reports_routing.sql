-- ═══════════════════════════════════════════════════════════════════════════
-- PHARMATRACK — Reports Routing (Option C)
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor
--
-- What this adds:
--   1. Links each report to the product it's about (so manufacturers can see it)
--   2. An "admins" table for MINSANTE-style regulator accounts
--   3. RLS policies so manufacturers see reports on THEIR products,
--      and admins see EVERY report across all manufacturers
--   4. A manufacturer_response field so manufacturers can reply
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Link reports to products
-- ─────────────────────────────────────────────────────────────────────────
alter table reports add column if not exists product_id uuid references products(id) on delete set null;
alter table reports add column if not exists manufacturer_response text;
alter table reports add column if not exists resolved_at timestamptz;

create index if not exists reports_product_id_idx on reports(product_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Admins table — MINSANTE-style regulator accounts
-- Add a row here manually (via SQL) for each admin/authority account
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  agency      text default 'MINSANTE',
  created_at  timestamptz default now()
);

alter table admins enable row level security;

create policy "admins_read_own"
  on admins for select
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Helper function — checks if the current user is an admin
-- ─────────────────────────────────────────────────────────────────────────
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from admins where id = auth.uid());
$$ language sql stable security definer;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Updated RLS policies for reports
-- ─────────────────────────────────────────────────────────────────────────

-- Manufacturers can read reports about their own products
drop policy if exists "reports_read_manufacturer" on reports;
create policy "reports_read_manufacturer"
  on reports for select
  using (
    exists (
      select 1 from products p
      where p.id = reports.product_id
        and p.manufacturer_id = auth.uid()
    )
  );

-- Admins can read every report, regardless of manufacturer
drop policy if exists "reports_read_admin" on reports;
create policy "reports_read_admin"
  on reports for select
  using (is_admin());

-- Manufacturers can update status/response on reports about their products
drop policy if exists "reports_update_manufacturer" on reports;
create policy "reports_update_manufacturer"
  on reports for update
  using (
    exists (
      select 1 from products p
      where p.id = reports.product_id
        and p.manufacturer_id = auth.uid()
    )
  );

-- Admins can update any report (status, resolution)
drop policy if exists "reports_update_admin" on reports;
create policy "reports_update_admin"
  on reports for update
  using (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Register your first admin account
-- Replace the UUID below with the auth.users id of your MINSANTE account
-- (create that user first in Authentication → Users, then copy its UUID here)
-- ─────────────────────────────────────────────────────────────────────────
-- insert into admins (id, full_name, agency)
-- values ('<ADMIN_USER_UUID>', 'MINSANTE Reviewer', 'MINSANTE');
