-- Keep pinned responses private to their owner through the existing responses RLS policies.
alter table public.responses
  add column if not exists is_pinned boolean not null default false;

-- Supports loading a category with pinned responses first for the current user.
create index if not exists responses_user_category_pinned_idx
  on public.responses (user_id, category_id, is_pinned desc, created_at asc);
