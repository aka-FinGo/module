-- ============================================================
--  OSHXONA KONSTRUKTORI – Supabase Schema
--  Supabase Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- 1. MODULLAR JADVALI
create table if not exists modules (
  id          uuid primary key default gen_random_uuid(),
  label       text    not null,
  width       int     not null,
  row         text    not null check (row in ('upper','lower','tall')),
  price       bigint  not null,
  color       text    not null default '#C9875A',
  kind        text,               -- 'sink' | 'drawers' | 'glass' | 'fridge' | 'oven' | 'corner' | null
  category    text    not null default 'Pastki shkaflar',
  active      boolean not null default true,
  sort_order  int     not null default 0,
  created_at  timestamptz default now()
);

-- 2. BUYURTMALAR JADVALI
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  items           jsonb   not null,
  total_price     bigint  not null,
  total_width_cm  int,
  customer_name   text,
  customer_phone  text,
  notes           text,
  status          text    not null default 'new',  -- new | processing | done | cancelled
  created_at      timestamptz default now()
);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table modules enable row level security;
alter table orders  enable row level security;

-- Public: faqat aktiv modullarni o'qiy oladi
create policy "modules_public_select"
  on modules for select
  using (active = true);

-- Public: buyurtma qo'shishi mumkin
create policy "orders_public_insert"
  on orders for insert
  with check (true);

-- Authenticated (admin): hamma narsani boshqara oladi
create policy "modules_admin_all"
  on modules for all
  using (auth.role() = 'authenticated');

create policy "orders_admin_all"
  on orders for all
  using (auth.role() = 'authenticated');

-- ============================================================
--  BOSHLANG'ICH MA'LUMOTLAR (demo modullar)
-- ============================================================
insert into modules (label, width, row, price, color, kind, category, sort_order) values
  -- Pastki shkaflar
  ('Past shkaf',     30,  'lower', 1250000, '#C9875A', null,      'Pastki shkaflar', 1),
  ('Past shkaf',     40,  'lower', 1580000, '#C9875A', null,      'Pastki shkaflar', 2),
  ('Past shkaf',     60,  'lower', 1950000, '#C9875A', null,      'Pastki shkaflar', 3),
  ('Past shkaf',     80,  'lower', 2450000, '#C9875A', null,      'Pastki shkaflar', 4),
  ('Past shkaf',    100,  'lower', 2950000, '#C9875A', null,      'Pastki shkaflar', 5),
  ('Sink bloki',     60,  'lower', 3200000, '#5F95AF', 'sink',    'Pastki shkaflar', 6),
  ('Tortma bloki',   60,  'lower', 2350000, '#A87A50', 'drawers', 'Pastki shkaflar', 7),
  ('Burchak bloki',  90,  'lower', 3800000, '#B56B3A', 'corner',  'Pastki shkaflar', 8),
  -- Yuqori shkaflar
  ('Yuqori shkaf',   30,  'upper',  900000, '#9C7A55', null,      'Yuqori shkaflar', 1),
  ('Yuqori shkaf',   40,  'upper', 1150000, '#9C7A55', null,      'Yuqori shkaflar', 2),
  ('Yuqori shkaf',   60,  'upper', 1480000, '#9C7A55', null,      'Yuqori shkaflar', 3),
  ('Yuqori shkaf',   80,  'upper', 1880000, '#9C7A55', null,      'Yuqori shkaflar', 4),
  ('Yuqori shkaf',  100,  'upper', 2280000, '#9C7A55', null,      'Yuqori shkaflar', 5),
  ('Shisha shkaf',   60,  'upper', 1950000, '#7AAABB', 'glass',   'Yuqori shkaflar', 6),
  -- Baland shkaflar
  ('Baland shkaf',   60,  'tall',  4800000, '#7A5E3A', null,      'Baland shkaflar', 1),
  ('Muzlatgich',     60,  'tall',  3500000, '#5A8095', 'fridge',  'Baland shkaflar', 2),
  ('Pech kolonnasi', 60,  'tall',  5200000, '#6A6850', 'oven',    'Baland shkaflar', 3);
