-- PharmaTrack — Complete Database Schema
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS
-- Registered by manufacturers via the web dashboard
-- Queried by users via the mobile app when scanning QR codes
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists products (
  id                   uuid primary key default gen_random_uuid(),
  manufacturer_id      uuid references auth.users(id) on delete cascade,
  serial_code          text not null unique,          -- the QR code value printed on the box
  product_name         text not null,
  product_name_fr      text,                          -- optional French translation
  batch_number         text not null,
  expiry_date          date not null,
  manufacturer         text not null,
  manufacturer_fr      text,
  dosage_form          text,                          -- Tablet, Syrup, Capsule, etc.
  strength             text,                          -- e.g. 500mg
  active_ingredient    text,
  country_of_origin    text default 'Cameroon',
  registration_number  text,                          -- MINSANTE registration
  storage_conditions   text,
  units_produced       integer,
  status               text not null default 'active' check (status in ('active', 'recalled', 'expired')),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Index for fast QR code lookups (most critical query)
create index if not exists products_serial_code_idx on products(serial_code);
create index if not exists products_batch_number_idx on products(batch_number);
create index if not exists products_manufacturer_id_idx on products(manufacturer_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SCAN LOGS
-- Written by the mobile app every time a user scans a QR code
-- Read by the manufacturer dashboard for analytics
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists scan_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  product_id   uuid references products(id) on delete set null,
  code_scanned text not null,
  result       text not null check (result in ('authentic', 'counterfeit', 'duplicate', 'recalled', 'unknown')),
  created_at   timestamptz default now()
);

create index if not exists scan_logs_user_id_idx on scan_logs(user_id);
create index if not exists scan_logs_product_id_idx on scan_logs(product_id);
create index if not exists scan_logs_code_scanned_idx on scan_logs(code_scanned);
create index if not exists scan_logs_created_at_idx on scan_logs(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- RECALLS
-- Issued by manufacturers via the web dashboard
-- Queried by the mobile app when a scanned product's batch is recalled
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists recalls (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid references products(id) on delete cascade,
  batch_number         text not null,
  reason               text not null,
  reason_fr            text,
  severity             text not null default 'moderate' check (severity in ('low', 'moderate', 'high')),
  reference_number     text not null,
  return_instructions  text,
  return_instructions_fr text,
  hotline_phone        text,
  created_at           timestamptz default now(),
  resolved_at          timestamptz
);

create index if not exists recalls_batch_number_idx on recalls(batch_number);
create index if not exists recalls_product_id_idx on recalls(product_id);
-- Partial index for active recalls only (most queried)
create index if not exists recalls_active_idx on recalls(batch_number) where resolved_at is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTS
-- Filed by users in the mobile app when they suspect a counterfeit
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists reports (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete set null,
  code_scanned        text,
  product_name        text,
  reason              text not null check (reason in ('counterfeit', 'packaging_damage', 'wrong_medicine', 'suspicious_seller', 'other')),
  description         text,
  pharmacy_name       text,
  pharmacy_location   text,
  status              text not null default 'pending' check (status in ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at          timestamptz default now()
);

create index if not exists reports_user_id_idx on reports(user_id);
create index if not exists reports_status_idx on reports(status);
create index if not exists reports_created_at_idx on reports(created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at on products
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
alter table products   enable row level security;
alter table scan_logs  enable row level security;
alter table recalls    enable row level security;
alter table reports    enable row level security;

-- Products: anyone can read (for QR verification), only manufacturer can write
create policy "products_read_all"    on products for select using (true);
create policy "products_insert_own"  on products for insert with check (auth.uid() = manufacturer_id);
create policy "products_update_own"  on products for update using (auth.uid() = manufacturer_id);
create policy "products_delete_own"  on products for delete using (auth.uid() = manufacturer_id);

-- Scan logs: users can insert their own, manufacturers can read scans of their products
create policy "scan_logs_insert_own" on scan_logs for insert with check (auth.uid() = user_id or user_id is null);
create policy "scan_logs_read_own"   on scan_logs for select using (
  auth.uid() = user_id
  or exists (
    select 1 from products p where p.id = scan_logs.product_id and p.manufacturer_id = auth.uid()
  )
);

-- Recalls: anyone can read, only product owners can insert/update
create policy "recalls_read_all"    on recalls for select using (true);
create policy "recalls_insert_own"  on recalls for insert with check (
  exists (select 1 from products p where p.id = recalls.product_id and p.manufacturer_id = auth.uid())
);
create policy "recalls_update_own"  on recalls for update using (
  exists (select 1 from products p where p.id = recalls.product_id and p.manufacturer_id = auth.uid())
);

-- Reports: users can insert, only they can read their own
create policy "reports_insert"      on reports for insert with check (auth.uid() = user_id or user_id is null);
create policy "reports_read_own"    on reports for select using (auth.uid() = user_id);
