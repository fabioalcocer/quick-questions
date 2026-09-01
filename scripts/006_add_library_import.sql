create or replace function public.import_library_v1(
  library_payload jsonb,
  preview_only boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  topic_item jsonb;
  category_item jsonb;
  response_item jsonb;
  topic_key text;
  category_key text;
  topic_identity text;
  category_identity text;
  category_scope text;
  normalized_title text;
  mapped_value text;
  target_topic_id uuid;
  target_category_id uuid;
  response_exists boolean;
  topic_mapping jsonb := '{}'::jsonb;
  category_mapping jsonb := '{}'::jsonb;
  topic_identity_mapping jsonb := '{}'::jsonb;
  category_identity_mapping jsonb := '{}'::jsonb;
  seen_topics text[] := array[]::text[];
  seen_categories text[] := array[]::text[];
  seen_responses text[] := array[]::text[];
  response_identity text;
  created_topics integer := 0;
  created_categories integer := 0;
  created_responses integer := 0;
  skipped_topics integer := 0;
  skipped_categories integer := 0;
  skipped_responses integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if jsonb_typeof(library_payload) <> 'object'
    or library_payload->>'format' <> 'quick-responses-library'
    or library_payload->>'version' <> '1'
    or jsonb_typeof(library_payload->'topics') <> 'array'
    or jsonb_typeof(library_payload->'categories') <> 'array'
    or jsonb_typeof(library_payload->'responses') <> 'array' then
    raise exception 'Invalid library payload' using errcode = '22023';
  end if;

  for topic_item in select value from jsonb_array_elements(library_payload->'topics') loop
    if jsonb_typeof(topic_item) <> 'object'
      or nullif(btrim(topic_item->>'key'), '') is null
      or nullif(btrim(topic_item->>'title'), '') is null
      or jsonb_typeof(topic_item->'description') <> 'string' then
      raise exception 'Invalid topic payload' using errcode = '22023';
    end if;

    topic_key := topic_item->>'key';
    if topic_key = any(seen_topics) then
      raise exception 'Duplicate topic key' using errcode = '22023';
    end if;
    seen_topics := array_append(seen_topics, topic_key);

    normalized_title := lower(regexp_replace(btrim(topic_item->>'title'), '\s+', ' ', 'g'));
    mapped_value := topic_identity_mapping->>normalized_title;
    if mapped_value is not null then
      skipped_topics := skipped_topics + 1;
      topic_mapping := topic_mapping || jsonb_build_object(topic_key, mapped_value);
      continue;
    end if;

    select topic.id into target_topic_id
    from public.topics
    where topic.user_id = current_user_id
      and lower(regexp_replace(btrim(topic.title), '\s+', ' ', 'g')) = normalized_title
    order by topic.created_at asc
    limit 1;

    if target_topic_id is not null then
      skipped_topics := skipped_topics + 1;
      topic_mapping := topic_mapping || jsonb_build_object(topic_key, target_topic_id::text);
      topic_identity_mapping := topic_identity_mapping || jsonb_build_object(normalized_title, target_topic_id::text);
    elsif preview_only then
      created_topics := created_topics + 1;
      topic_mapping := topic_mapping || jsonb_build_object(topic_key, 'preview-topic:' || normalized_title);
      topic_identity_mapping := topic_identity_mapping || jsonb_build_object(normalized_title, 'preview-topic:' || normalized_title);
    else
      insert into public.topics (title, description, user_id)
      values (topic_item->>'title', topic_item->>'description', current_user_id)
      returning id into target_topic_id;

      created_topics := created_topics + 1;
      topic_mapping := topic_mapping || jsonb_build_object(topic_key, target_topic_id::text);
      topic_identity_mapping := topic_identity_mapping || jsonb_build_object(normalized_title, target_topic_id::text);
    end if;
  end loop;

  seen_categories := array[]::text[];
  for category_item in select value from jsonb_array_elements(library_payload->'categories') loop
    if jsonb_typeof(category_item) <> 'object'
      or nullif(btrim(category_item->>'key'), '') is null
      or nullif(btrim(category_item->>'title'), '') is null
      or jsonb_typeof(category_item->'description') <> 'string'
      or (category_item->>'topicKey' is not null and jsonb_typeof(category_item->'topicKey') <> 'string') then
      raise exception 'Invalid category payload' using errcode = '22023';
    end if;

    category_key := category_item->>'key';
    if category_key = any(seen_categories) then
      raise exception 'Duplicate category key' using errcode = '22023';
    end if;
    seen_categories := array_append(seen_categories, category_key);

    if category_item->>'topicKey' is not null then
      mapped_value := topic_mapping->>(category_item->>'topicKey');
      if mapped_value is null then
        raise exception 'Category references an unknown topic' using errcode = '22023';
      end if;
      topic_identity := mapped_value;
    else
      mapped_value := null;
      topic_identity := 'unassigned';
    end if;

    normalized_title := lower(regexp_replace(btrim(category_item->>'title'), '\s+', ' ', 'g'));
    category_scope := topic_identity || '|' || normalized_title;
    mapped_value := category_identity_mapping->>category_scope;
    if mapped_value is not null then
      skipped_categories := skipped_categories + 1;
      category_mapping := category_mapping || jsonb_build_object(category_key, mapped_value);
      continue;
    end if;

    if category_item->>'topicKey' is null then
      target_topic_id := null;
    elsif topic_identity like 'preview-topic:%' then
      target_topic_id := null;
    else
      target_topic_id := topic_identity::uuid;
    end if;

    if topic_identity like 'preview-topic:%' then
      target_category_id := null;
    else
      select category.id into target_category_id
      from public.categories as category
      where category.user_id = current_user_id
        and category.topic_id is not distinct from target_topic_id
        and lower(regexp_replace(btrim(category.title), '\s+', ' ', 'g')) = normalized_title
      order by category.created_at asc
      limit 1;
    end if;

    if target_category_id is not null then
      skipped_categories := skipped_categories + 1;
      category_mapping := category_mapping || jsonb_build_object(category_key, target_category_id::text);
      category_identity_mapping := category_identity_mapping || jsonb_build_object(category_scope, target_category_id::text);
    elsif preview_only then
      created_categories := created_categories + 1;
      category_mapping := category_mapping || jsonb_build_object(category_key, 'preview-category:' || category_scope);
      category_identity_mapping := category_identity_mapping || jsonb_build_object(category_scope, 'preview-category:' || category_scope);
    else
      insert into public.categories (title, description, topic_id, user_id)
      values (category_item->>'title', category_item->>'description', target_topic_id, current_user_id)
      returning id into target_category_id;

      created_categories := created_categories + 1;
      category_mapping := category_mapping || jsonb_build_object(category_key, target_category_id::text);
      category_identity_mapping := category_identity_mapping || jsonb_build_object(category_scope, target_category_id::text);
    end if;
  end loop;

  seen_responses := array[]::text[];
  for response_item in select value from jsonb_array_elements(library_payload->'responses') loop
    if jsonb_typeof(response_item) <> 'object'
      or nullif(btrim(response_item->>'categoryKey'), '') is null
      or nullif(btrim(response_item->>'text'), '') is null
      or response_item->>'language' not in ('Spanish', 'English', 'Portuguese') then
      raise exception 'Invalid response payload' using errcode = '22023';
    end if;

    mapped_value := category_mapping->>(response_item->>'categoryKey');
    if mapped_value is null then
      raise exception 'Response references an unknown category' using errcode = '22023';
    end if;
    category_identity := mapped_value;

    response_identity := jsonb_build_array(
      category_identity,
      response_item->>'language',
      response_item->>'text'
    )::text;
    if response_identity = any(seen_responses) then
      skipped_responses := skipped_responses + 1;
      continue;
    end if;
    seen_responses := array_append(seen_responses, response_identity);

    if mapped_value like 'preview-category:%' then
      target_category_id := null;
      response_exists := false;
    else
      target_category_id := mapped_value::uuid;
      select exists(
        select 1
        from public.responses as response
        where response.user_id = current_user_id
          and response.category_id = target_category_id
          and response.language = response_item->>'language'
          and response.text = response_item->>'text'
      ) into response_exists;
    end if;

    if response_exists then
      skipped_responses := skipped_responses + 1;
    elsif preview_only then
      created_responses := created_responses + 1;
    else
      insert into public.responses (text, language, category_id, user_id)
      values (response_item->>'text', response_item->>'language', target_category_id, current_user_id);

      created_responses := created_responses + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'created', jsonb_build_object(
      'topics', created_topics,
      'categories', created_categories,
      'responses', created_responses
    ),
    'skipped', jsonb_build_object(
      'topics', skipped_topics,
      'categories', skipped_categories,
      'responses', skipped_responses
    )
  );
end;
$$;

revoke all on function public.import_library_v1(jsonb, boolean) from public;
grant execute on function public.import_library_v1(jsonb, boolean) to authenticated;
