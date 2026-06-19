-- Battery Brain SaaS — Supabase schema

-- User profiles: one row per user, stores inverter config
create table if not exists user_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ge_token      text,
  ge_serial     text,
  octopus_product text,
  octopus_region  text default 'L',
  battery_model   text default 'GIV-AC-3.0',
  cap_kwh         numeric default 9.2,
  reserve_kwh     numeric default 0.4,
  chg_half_kwh    numeric default 1.4,
  has_solar       boolean default false,
  mode            text default 'shadow' check (mode in ('shadow', 'active')),
  onboarded_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id)
);

-- Row-level security: users can only see/edit their own row
alter table user_profiles enable row level security;
create policy "Users can manage their own profile"
  on user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Brain tick log: half-hourly brain run records per user
create table if not exists brain_ticks (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  ts          timestamptz not null,
  mode        text,
  action      text,
  reason      text,
  soc_pct     numeric,
  alerts      jsonb,
  created_at  timestamptz default now()
);

alter table brain_ticks enable row level security;
create policy "Users can view their own ticks"
  on brain_ticks for select
  using (auth.uid() = user_id);

-- Service role can insert ticks (used by cron)
create policy "Service role can insert ticks"
  on brain_ticks for insert
  with check (true);

-- Subscriptions: mirrors Stripe subscription state
create table if not exists subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id  text unique,
  stripe_sub_id       text unique,
  status              text default 'trialing',
  trial_ends_at       timestamptz,
  current_period_end  timestamptz,
  cancel_at_period_end boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique(user_id)
);

alter table subscriptions enable row level security;
create policy "Users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Indexes
create index if not exists brain_ticks_user_ts on brain_ticks(user_id, ts desc);
create index if not exists brain_ticks_created on brain_ticks(created_at desc);
