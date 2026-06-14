-- Subme schema. Apply to a fresh Supabase project when one is provisioned.
-- Mirrors src/lib/types.ts exactly - change both together.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

create table public.catalog_services (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null,
  plans jsonb not null default '[]',
  detection_patterns jsonb not null default '[]',
  logo_color text not null default '#888888',
  website text not null default '',
  popular_rank int
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_name text not null,
  catalog_service_id text references public.catalog_services (id),
  plan_name text not null default '',
  price_inr numeric(10, 2) not null check (price_inr >= 0),
  billing_cycle text not null check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),
  category text not null default 'other',
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  start_date date not null,
  next_renewal_date date not null,
  notes text not null default '',
  source text not null default 'manual' check (source in ('manual', 'detected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paused_at timestamptz,
  cancelled_at timestamptz
);

create index subscriptions_user_idx on public.subscriptions (user_id, status);
create index subscriptions_renewal_idx on public.subscriptions (user_id, next_renewal_date);

create table public.price_history (
  id uuid primary key default gen_random_uuid (),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  price_inr numeric(10, 2) not null,
  effective_from date not null,
  created_at timestamptz not null default now()
);

create index price_history_sub_idx on public.price_history (subscription_id, effective_from);

create table public.renewal_log (
  id uuid primary key default gen_random_uuid (),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  renewed_on date not null,
  amount_inr numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index renewal_log_sub_idx on public.renewal_log (subscription_id, renewed_on);

create table public.consent_records (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null check (
    consent_type in (
      'local_notifications',
      'whatsapp_alerts',
      'sms_ingestion',
      'notification_listener',
      'analytics'
    )
  ),
  granted boolean not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  version int not null default 1,
  unique (user_id, consent_type)
);

-- RLS: every user-owned table locked to the owner; catalog readable by all.
alter table public.profiles enable row level security;
alter table public.catalog_services enable row level security;
alter table public.subscriptions enable row level security;
alter table public.price_history enable row level security;
alter table public.renewal_log enable row level security;
alter table public.consent_records enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid () = id) with check (auth.uid () = id);

create policy "catalog readable" on public.catalog_services
  for select using (true);

create policy "own subscriptions" on public.subscriptions
  for all using (auth.uid () = user_id) with check (auth.uid () = user_id);

create policy "own price history" on public.price_history
  for all using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid ()
    )
  );

create policy "own renewal log" on public.renewal_log
  for all using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid ()
    )
  );

create policy "own consents" on public.consent_records
  for all using (auth.uid () = user_id) with check (auth.uid () = user_id);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at () returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at ();

-- Auto-create profile on signup.
create or replace function public.handle_new_user () returns trigger
security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user ();
