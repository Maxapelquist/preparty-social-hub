-- Create direct messaging tables and triggers, plus friend acceptance trigger to auto-create a conversation

-- 1) Conversations table
create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null,
  user_b uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  -- stable pair key to enforce uniqueness regardless of order
  pair_key text generated always as (
    case when user_a::text < user_b::text then user_a::text || ':' || user_b::text else user_b::text || ':' || user_a::text end
  ) stored
);

-- Uniqueness on pair_key (prevents duplicate conversations)
create unique index if not exists uq_direct_conversations_pair_key on public.direct_conversations (pair_key);

-- Enable RLS
alter table public.direct_conversations enable row level security;

-- Policies: only participants can access/modify
create policy if not exists "Participants can view their conversations"
  on public.direct_conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "Participants can create conversations"
  on public.direct_conversations for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy if not exists "Participants can update their conversations"
  on public.direct_conversations for update
  using (auth.uid() = user_a or auth.uid() = user_b);

-- 2) Messages table
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_direct_messages_conversation on public.direct_messages (conversation_id, created_at);

-- Make realtime diffing include full row (better for clients)
alter table public.direct_messages replica identity full;

-- Add to realtime publication
do $$ begin
  if not exists (
    select 1 from pg_publication_tables t where t.pubname = 'supabase_realtime' and t.schemaname = 'public' and t.tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;

-- Enable RLS
alter table public.direct_messages enable row level security;

-- Helper to check if current user participates in a conversation
create or replace function public.is_conversation_participant(_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.direct_conversations c
    where c.id = _conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
  );
$$;

-- Policies for messages
create policy if not exists "Participants can read messages"
  on public.direct_messages for select
  using (public.is_conversation_participant(conversation_id));

create policy if not exists "Sender can write messages"
  on public.direct_messages for insert
  with check (
    public.is_conversation_participant(conversation_id) and auth.uid() = sender_id
  );

create policy if not exists "Participants can update messages"
  on public.direct_messages for update
  using (public.is_conversation_participant(conversation_id));

-- 3) Updated_at triggers
create trigger update_direct_conversations_updated_at
before update on public.direct_conversations
for each row execute function public.update_updated_at_column();

create trigger update_direct_messages_updated_at
before update on public.direct_messages
for each row execute function public.update_updated_at_column();

-- 4) Trigger to update last_message_at on new messages
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.direct_conversations
    set last_message_at = now(), updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_insert_touch_conversation
after insert on public.direct_messages
for each row execute procedure public.touch_conversation_on_message();

-- 5) Auto-create conversation when a friendship gets accepted
create or replace function public.ensure_direct_conversation_for_friends()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only act when moving into accepted state
  if (TG_OP = 'UPDATE' and new.status = 'accepted' and (old.status is distinct from new.status)) then
    -- Normalize order to build pair_key
    declare
      a uuid := case when new.user_id::text < new.friend_id::text then new.user_id else new.friend_id end;
      b uuid := case when new.user_id::text < new.friend_id::text then new.friend_id else new.user_id end;
      pk text := a::text || ':' || b::text;
      conv_id uuid;
    begin
      -- Create conversation if it does not exist
      insert into public.direct_conversations (user_a, user_b)
      values (a, b)
      on conflict (pair_key) do nothing
      returning id into conv_id;
      -- Nothing else to do
      return new;
    end;
  end if;
  return new;
end;
$$;

create trigger on_friendship_accepted_create_conversation
after update of status on public.friends
for each row execute procedure public.ensure_direct_conversation_for_friends();
