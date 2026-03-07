create extension if not exists "pgcrypto";

create table if not exists public.cloud_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'manual',
  device_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists cloud_backups_user_created_idx
  on public.cloud_backups (user_id, created_at desc);

alter table public.cloud_backups enable row level security;

drop policy if exists "select own cloud backups" on public.cloud_backups;
create policy "select own cloud backups"
  on public.cloud_backups
  for select
  using (auth.uid() = user_id);

drop policy if exists "insert own cloud backups" on public.cloud_backups;
create policy "insert own cloud backups"
  on public.cloud_backups
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "delete own cloud backups" on public.cloud_backups;
create policy "delete own cloud backups"
  on public.cloud_backups
  for delete
  using (auth.uid() = user_id);
