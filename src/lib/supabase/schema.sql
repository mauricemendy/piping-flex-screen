-- Piping Flex Screen — Supabase schema
-- Run this in the Supabase SQL Editor to create the table.

create table if not exists screening_calculations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text not null default 'Untitled',

  -- Input parameters (always stored in SI)
  code text not null,
  material text not null,
  nps text not null,
  schedule text not null,
  do_mm double precision not null,
  tn_mm double precision not null,
  t1_degc double precision not null,
  t2_degc double precision not null,
  l_m double precision not null,
  u_m double precision not null,
  y_manual_mm double precision,
  y_additional_mm double precision not null default 0,

  -- Computed results
  analysis_required boolean not null,
  ratio double precision not null,
  utilization double precision not null,
  y_total_mm double precision not null,
  thermal_expansion_mm_m double precision not null,
  sa_mpa double precision not null
);

-- Index for listing recent calculations
create index if not exists idx_screening_created_at
  on screening_calculations (created_at desc);

-- Row Level Security (enable for production)
alter table screening_calculations enable row level security;

-- Allow all operations for anonymous users (adjust for auth)
create policy "Allow all for anon" on screening_calculations
  for all using (true) with check (true);
