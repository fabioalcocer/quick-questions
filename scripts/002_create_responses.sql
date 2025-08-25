-- Create responses table for quick answer texts
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  language text not null default 'Spanish',
  category_id uuid not null references public.categories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.responses enable row level security;

-- Create policies for responses
create policy "responses_select_own"
  on public.responses for select
  using (auth.uid() = user_id);

create policy "responses_insert_own"
  on public.responses for insert
  with check (auth.uid() = user_id);

create policy "responses_update_own"
  on public.responses for update
  using (auth.uid() = user_id);

create policy "responses_delete_own"
  on public.responses for delete
  using (auth.uid() = user_id);
