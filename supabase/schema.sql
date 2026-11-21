create extension if not exists pgcrypto;

create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text not null default 'Outros',
 store text not null,
 price numeric(12,2),
 affiliate_url text,
 status text not null default 'research' check (status in ('research','selected','archived')),
 created_at timestamptz not null default now()
);

create table if not exists public.content_queue (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 platform text not null,
 caption text,
 media_url text,
 status text not null default 'pending_approval' check (status in ('draft','pending_approval','approved','rejected','scheduled','published')),
 scheduled_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.affiliate_programs (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 status text not null default 'not_connected' check (status in ('not_connected','connected','paused')),
 notes text,
 created_at timestamptz not null default now()
);

create table if not exists public.performance_events (
 id uuid primary key default gen_random_uuid(),
 product_id uuid references public.products(id) on delete set null,
 platform text,
 event_type text not null check (event_type in ('click','conversion','commission')),
 amount numeric(12,2),
 external_reference text,
 occurred_at timestamptz not null default now()
);

-- MVP local/dev policy: habilita acesso via anon key para facilitar testes.
-- ANTES DE PRODUÇÃO, substitua por políticas vinculadas a auth.uid()
-- e habilite autenticação obrigatória. Não use service_role no frontend.
alter table public.products enable row level security;
alter table public.content_queue enable row level security;
alter table public.affiliate_programs enable row level security;
alter table public.performance_events enable row level security;

create policy "dev products access" on public.products for all to anon using (true) with check (true);
create policy "dev content access" on public.content_queue for all to anon using (true) with check (true);
create policy "dev affiliate access" on public.affiliate_programs for all to anon using (true) with check (true);
create policy "dev events access" on public.performance_events for all to anon using (true) with check (true);

insert into public.affiliate_programs(name) values ('Shopee'),('Mercado Livre'),('Amazon')
on conflict (name) do nothing;
