-- Convia Central AdSense Manager schema for Supabase (PostgreSQL).
-- Run once in Supabase Dashboard > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.convia_ad_units (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  publisher_id varchar(40) not null,
  slot_id varchar(32) not null,
  ad_format varchar(32),
  ad_layout varchar(40),
  ad_layout_key varchar(200),
  width_px integer check (width_px is null or width_px > 0),
  height_px integer check (height_px is null or height_px > 0),
  full_width_responsive boolean not null default true,
  zone varchar(40) not null check (zone in (
    'after-header', 'before-footer', 'side-left', 'side-right',
    'home-after-hero', 'pdf-after-tool'
  )),
  route_scope varchar(20) not null default 'all' check (route_scope in ('all', 'home', 'pdf', 'exact')),
  route_path varchar(255),
  device varchar(12) not null default 'all' check (device in ('all', 'desktop', 'mobile')),
  priority integer not null default 50 check (priority between 0 and 1000),
  enabled boolean not null default true,
  created_by_email varchar(320),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint convia_exact_route_check check (
    (route_scope = 'exact' and route_path is not null and left(route_path, 1) = '/')
    or (route_scope <> 'exact' and route_path is null)
  )
);

create index if not exists convia_ad_units_public_lookup_idx
  on public.convia_ad_units (enabled, zone, priority);

create index if not exists convia_ad_units_route_idx
  on public.convia_ad_units (route_scope, route_path);

alter table public.convia_ad_units enable row level security;

-- No direct browser access. All reads/writes go through authenticated Next.js API routes.
revoke all on table public.convia_ad_units from anon, authenticated;
grant select, insert, update, delete on table public.convia_ad_units to service_role;

create or replace function public.convia_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists convia_ad_units_updated_at on public.convia_ad_units;
create trigger convia_ad_units_updated_at
before update on public.convia_ad_units
for each row execute function public.convia_set_updated_at();
