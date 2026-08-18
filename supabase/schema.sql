create table if not exists public.card_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text not null,
  card_count integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.card_projects enable row level security;
create policy "Users can read own projects" on public.card_projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on public.card_projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.card_projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.card_projects for delete using (auth.uid() = user_id);

create index if not exists card_projects_user_created_idx on public.card_projects(user_id, created_at desc);
