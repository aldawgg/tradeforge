-- ============================================================
-- TradeForge — Initial Supabase Schema
-- ============================================================
-- Run this against your Supabase project via the SQL editor.
-- All tables use Row Level Security so each user sees only
-- their own rows. Enable RLS on every table before deploying.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
-- Created automatically when a user signs up via Supabase Auth.
-- Mirrors auth.users so app code never queries auth.users directly.

create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on profiles for update
  using ((select auth.uid()) = id);

-- Trigger: keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

-- Trigger: auto-create profile row on signup.
-- set search_path = '' is required for security definer functions in Supabase
-- so that the empty search path forces fully-qualified table names (public.profiles).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── evaluation_accounts ──────────────────────────────────────
-- Manual prop firm evaluation tracker.
-- Rules are NOT hardcoded — each field is user-defined so any
-- prop firm (Apex, Topstep, Tradeify, etc.) can be tracked.

create table if not exists evaluation_accounts (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles (id) on delete cascade,

  -- Identity
  prop_firm_name        text not null,
  account_name          text not null,
  account_size          numeric(12, 2) not null,

  -- Balances
  starting_balance      numeric(12, 2) not null,
  current_balance       numeric(12, 2) not null,

  -- Rules (all user-defined, nullable where not applicable)
  profit_target         numeric(12, 2),          -- e.g. 3000 for a $50k account
  max_drawdown          numeric(12, 2) not null,
  daily_loss_limit      numeric(12, 2) not null,
  minimum_trading_days  integer not null default 0,
  completed_trading_days integer not null default 0,

  -- Consistency (optional — some firms have a consistency rule)
  consistency_threshold numeric(5, 2),           -- e.g. 30 means no day > 30% of profit
  consistency           numeric(5, 2),           -- current best-day % of total profit

  -- Status
  status                text not null default 'Not Started'
                          check (status in ('Not Started', 'In Eval', 'Passed', 'Funded', 'Breached')),

  notes                 text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table evaluation_accounts enable row level security;

create policy "Users can manage their own eval accounts"
  on evaluation_accounts for all
  using (auth.uid() = user_id);

create trigger evaluation_accounts_updated_at
  before update on evaluation_accounts
  for each row execute procedure set_updated_at();


-- ── custom_instruments ───────────────────────────────────────
-- Allows users to add instruments beyond the built-in list
-- (MES, MNQ, ES, NQ). Each user manages their own list.

create table if not exists custom_instruments (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles (id) on delete cascade,
  name       text not null,
  point_value numeric(10, 4) not null default 1,  -- USD per point
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table custom_instruments enable row level security;

create policy "Users can manage their own custom instruments"
  on custom_instruments for all
  using (auth.uid() = user_id);


-- ── custom_setups ────────────────────────────────────────────
-- Allows users to add setup tags beyond the built-in list.

create table if not exists custom_setups (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table custom_setups enable row level security;

create policy "Users can manage their own custom setups"
  on custom_setups for all
  using (auth.uid() = user_id);


-- ── trades ───────────────────────────────────────────────────
-- Core trade log. account_id is nullable so a trade can be
-- logged without linking it to an eval account (e.g. funded /
-- personal account outside the eval tracker).

create table if not exists trades (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles (id) on delete cascade,
  account_id          uuid references evaluation_accounts (id) on delete set null,

  -- When / what
  date                date not null,
  instrument          text not null,              -- built-in: MES | MNQ | ES | NQ
  custom_instrument   text,                       -- populated when instrument = 'Custom'
  direction           text not null
                        check (direction in ('Long', 'Short')),
  session             text not null
                        check (session in ('Asia', 'London', 'New York AM', 'New York PM', 'Other')),

  -- Setup
  setup               text not null,             -- built-in setup tag or 'Custom'
  custom_setup        text,                       -- populated when setup = 'Custom'

  -- Prices (exit_price nullable for open trades)
  entry_price         numeric(12, 4) not null,
  exit_price          numeric(12, 4),
  stop_loss           numeric(12, 4) not null,
  target              numeric(12, 4) not null,
  contracts           integer not null default 1,

  -- Results (null while trade is open)
  pnl                 numeric(12, 2),
  r_multiple          numeric(8, 4),

  -- Outcome / status
  outcome             text not null default 'Open'
                        check (outcome in ('Profit', 'Loss', 'Break even', 'Open')),
  status              text not null default 'Open'
                        check (status in ('Closed', 'Open')),

  -- Review tags (stored as arrays — values match the tag union types in types.ts)
  positive_review_tags text[] not null default '{}',
  improvement_tags     text[] not null default '{}',

  notes               text not null default '',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table trades enable row level security;

create policy "Users can manage their own trades"
  on trades for all
  using (auth.uid() = user_id);

create trigger trades_updated_at
  before update on trades
  for each row execute procedure set_updated_at();

-- Index for common query patterns
create index trades_user_date_idx on trades (user_id, date desc);
create index trades_account_idx   on trades (account_id);


-- ── trade_screenshots ────────────────────────────────────────
-- Screenshot metadata only. The actual file lives in Supabase
-- Storage (bucket: trade-screenshots). The storage_path column
-- is the path within that bucket.

create table if not exists trade_screenshots (
  id           uuid primary key default uuid_generate_v4(),
  trade_id     uuid not null references trades (id) on delete cascade,
  user_id      uuid not null references profiles (id) on delete cascade,
  storage_path text not null,           -- e.g. "{user_id}/{trade_id}/entry.png"
  screenshot_type text not null
                  check (screenshot_type in (
                    'Entry',
                    'Exit',
                    'Before trade',
                    'After trade',
                    'Higher timeframe',
                    'Marked-up review'
                  )),
  created_at   timestamptz not null default now()
);

alter table trade_screenshots enable row level security;

create policy "Users can manage their own screenshots"
  on trade_screenshots for all
  using (auth.uid() = user_id);

create index trade_screenshots_trade_idx on trade_screenshots (trade_id);
