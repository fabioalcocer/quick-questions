alter table public.responses
  add column if not exists usage_count bigint not null default 0;

create or replace function public.increment_response_usage(response_id uuid)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_usage_count bigint;
begin
  update public.responses as response
  set usage_count = response.usage_count + 1
  where response.id = response_id
    and response.user_id = auth.uid()
  returning response.usage_count into next_usage_count;

  if next_usage_count is null then
    raise exception 'Response not found';
  end if;

  return next_usage_count;
end;
$$;

revoke all on function public.increment_response_usage(uuid) from public;
grant execute on function public.increment_response_usage(uuid) to authenticated;
